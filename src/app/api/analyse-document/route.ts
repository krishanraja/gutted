import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { validateFile, rateLimit } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { allowed } = rateLimit(`analyse-doc:${user.id}`, { maxRequests: 10, windowMs: 60_000 })
    if (!allowed) return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })

    const fd = await req.formData()
    const file = fd.get('file') as File
    const type = fd.get('type') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const { valid, error: fileError, sanitizedExt } = validateFile(file, 'document')
    if (!valid) return NextResponse.json({ error: fileError }, { status: 400 })

    // Upload to Supabase Storage scoped to user
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${sanitizedExt}`
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, Buffer.from(bytes), { contentType: file.type })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

    // Build type-specific prompt
    const typePrompts: Record<string, string> = {
      gut_test: `This is a gut health test result (e.g. Viome, GI-MAP, Thryve, SIBO test). Extract all biomarkers, scores, and findings. Explain what they mean in plain English for someone without a medical background. Focus on actionable dietary and lifestyle insights.`,
      doctor_report: `This is a doctor's report, prescription, or medical scan related to gut/digestive health. Extract key findings and explain them clearly. Do not diagnose - help the user understand what their doctor has said.`,
      food_label: `This is a food label, ingredient list, or nutrition panel. Analyse the ingredients for gut health impact. Flag any common gut irritants (gluten, dairy, artificial sweeteners, FODMAPs, preservatives). Rate the overall gut health friendliness.`,
    }

    const validTypes = new Set(['gut_test', 'doctor_report', 'food_label'])
    const safeType = validTypes.has(type) ? type : 'doctor_report'
    const prompt = typePrompts[safeType]

    // Use GPT-4o Vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: publicUrl, detail: 'high' },
          },
          {
            type: 'text',
            text: `${prompt}

Return exactly this JSON:
{
  "summary": "<plain English explanation, 3-5 sentences, what this means for the user's gut health>",
  "biomarkers": {"<marker name>": "<value and what it means>"},
  "recommendations": ["<specific actionable recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "gutFriendlyRating": <1-10 if food label, else null>,
  "flags": ["<any concerning findings that warrant medical attention>"]
}`,
          },
        ],
      }],
    })

    const content = response.choices[0].message.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid AI response')
    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({ ...parsed, fileUrl: publicUrl })
  } catch (e: unknown) {
    console.error('Analyse document error:', e)
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
