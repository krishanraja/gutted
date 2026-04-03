import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { text, userProfile } = await req.json()
    const gutProfile = userProfile?.gut_profile || {}

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: `You are a gut health AI assistant. Analyse daily log entries and return a JSON object with:
- gutScore (1-10 integer): overall gut health score for this entry
- insights (array of 2-3 short strings): what this tells us about their gut
- recommendations (array of 2-3 short strings): specific, actionable next steps
- mood (string): one of 'good', 'neutral', 'concerning'

User's gut profile: ${JSON.stringify(gutProfile)}
Be specific, warm, and avoid medical diagnoses. Return ONLY valid JSON.`,
      messages: [{ role: 'user', content: `Log entry: "${text}"` }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const result = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
    return NextResponse.json(result)
  } catch (err) {
    console.error('Analyse log error:', err)
    return NextResponse.json({ gutScore: 5, insights: ['Log saved'], recommendations: ['Keep logging daily'], mood: 'neutral' })
  }
}
