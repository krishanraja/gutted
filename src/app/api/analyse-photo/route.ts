import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('plan, gut_profile').eq('id', user.id).single()
    if (profile?.plan === 'free') {
      return NextResponse.json({ error: 'Upgrade to Pro for photo food logging' }, { status: 403 })
    }

    const fd = await req.formData()
    const file = fd.get('file') as File
    if (!file) return NextResponse.json({ error: 'No photo provided' }, { status: 400 })

    // Upload to Supabase Storage
    const serviceClient = await createServiceClient()
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `meals/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await serviceClient.storage
      .from('documents')
      .upload(path, Buffer.from(bytes), { contentType: file.type })

    if (uploadError) throw uploadError
    const { data: { publicUrl } } = serviceClient.storage.from('documents').getPublicUrl(path)

    // Use GPT-4o Vision to identify foods
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: publicUrl, detail: 'high' } },
          {
            type: 'text',
            text: `Identify all foods in this meal photo. For each food, estimate the portion size and gut health impact.

User's gut profile: ${JSON.stringify(profile?.gut_profile || {})}

Return exactly this JSON:
{
  "mealName": "<descriptive name for this meal>",
  "foods": [
    {"name": "<food>", "portion": "<estimated portion>", "gutImpact": "<positive|neutral|negative>", "note": "<brief gut health note>"}
  ],
  "overallGutRating": <1-10>,
  "logEntry": "<natural language description suitable for a gut health log entry, 1-2 sentences>",
  "tips": ["<tip for making this meal more gut-friendly>"]
}`,
          },
        ],
      }],
    })

    const content = response.choices[0].message.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not analyse photo')

    return NextResponse.json({ ...JSON.parse(jsonMatch[0]), photoUrl: publicUrl })
  } catch (e: unknown) {
    console.error('Photo analysis error:', e)
    return NextResponse.json({ error: 'Could not analyse photo' }, { status: 500 })
  }
}
