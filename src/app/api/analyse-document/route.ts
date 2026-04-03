import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

const systemPrompts: Record<string, string> = {
  gut_test: `You are a gut health specialist AI. Analyse this gut test result and return JSON with:
- summary (string): plain English explanation of what this test shows, 2-3 sentences
- biomarkers (object): key biomarker name -> value pairs found in the test
- recommendations (array of 4-5 strings): specific dietary and lifestyle actions based on results
- keyFindings (array of 2-3 strings): most important things the user should know
Focus on actionable insights. Avoid medical diagnoses. Return ONLY valid JSON.`,
  doctor_report: `You are a health document AI. Analyse this medical document and return JSON with:
- summary (string): plain English summary of the key findings, 2-3 sentences
- biomarkers (object): any measurable values found (e.g. inflammation markers, test results)
- recommendations (array of 3-4 strings): what the user should discuss with their doctor or do next
- keyFindings (array of 2-3 strings): most important takeaways
Return ONLY valid JSON.`,
  food_label: `You are a gut health nutrition AI. Analyse this food label or ingredient list and return JSON with:
- summary (string): gut health assessment of this food, 2 sentences
- biomarkers (object): key nutritional values (fibre, sugar, protein, etc.)
- recommendations (array of 2-3 strings): is this good for gut health? why / why not?
- keyFindings (array of 2 strings): top gut health signals in this food
Return ONLY valid JSON.`,
}

export async function POST(req: NextRequest) {
  try {
    const { fileUrl, documentType } = await req.json()
    const systemPrompt = systemPrompts[documentType] || systemPrompts.doctor_report

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please analyse this document:' },
            { type: 'image_url', image_url: { url: fileUrl, detail: 'high' } },
          ],
        },
      ],
    })

    const raw = response.choices[0].message.content || '{}'
    const result = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
    return NextResponse.json(result)
  } catch (err) {
    console.error('Analyse document error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
