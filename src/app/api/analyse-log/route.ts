import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { text, userProfile, recentLogs } = await req.json()
    if (!text) return NextResponse.json({ error: 'No log text' }, { status: 400 })

    const systemPrompt = `You are a gut health AI assistant. Analyse daily gut health log entries from users and provide personalised, evidence-based insights. Be warm, encouraging, and specific. Never provide medical diagnoses. Always recommend consulting a healthcare professional for serious concerns.

User profile: ${JSON.stringify(userProfile || {})}
Recent logs (last 5): ${JSON.stringify(recentLogs || [])}`

    const userPrompt = `Analyse this gut health log entry and return a JSON response:

Log entry: "${text}"

Return exactly this JSON structure:
{
  "gutScore": <number 1-10, based on symptoms described>,
  "summary": "<2-3 sentence plain English interpretation of what this tells us about their gut health today>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>"],
  "flagged": <true if any serious symptoms mentioned that warrant medical attention, else false>
}`

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid AI response')
    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json(parsed)
  } catch (e: unknown) {
    console.error('Analyse log error:', e)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
