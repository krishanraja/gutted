import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, truncate } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { allowed } = rateLimit(`log:${user.id}`, { maxRequests: 15, windowMs: 60_000 })
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: 'No log text' }, { status: 400 })

    const safeText = truncate(text, 2000)

    // Fetch user context server-side instead of trusting client
    const [{ data: profile }, { data: recentLogs }] = await Promise.all([
      supabase.from('profiles').select('gut_profile').eq('id', user.id).single(),
      supabase.from('logs').select('content, gut_score, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(5),
    ])

    const systemPrompt = `You are a gut health AI assistant. Analyse daily gut health log entries from users and provide personalised, evidence-based insights. Be warm, encouraging, and specific. Never provide medical diagnoses. Always recommend consulting a healthcare professional for serious concerns.

User profile: ${JSON.stringify(profile?.gut_profile || {})}
Recent logs (last 5): ${JSON.stringify((recentLogs || []).map(l => ({ content: l.content.slice(0, 100), score: l.gut_score })))}`

    const userPrompt = `Analyse this gut health log entry and return a JSON response:

Log entry: "${safeText}"

Return exactly this JSON structure:
{
  "gutScore": <number 1-10, based on symptoms described>,
  "summary": "<2-3 sentence plain English interpretation of what this tells us about their gut health today>",
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>"],
  "flagged": <true if any serious symptoms mentioned that warrant medical attention, else false>
}`

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
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
