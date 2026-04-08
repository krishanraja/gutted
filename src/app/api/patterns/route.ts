import { NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/security'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { allowed } = rateLimit(`patterns:${user.id}`, { maxRequests: 5, windowMs: 60_000 })
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const { data: logs } = await supabase
      .from('logs')
      .select('content, gut_score, logged_at, ai_analysis')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(50)

    if (!logs || logs.length < 5) {
      return NextResponse.json({ patterns: [], triggerFoods: [], message: 'Need at least 5 logs for pattern detection' })
    }

    const { data: profile } = await supabase.from('profiles').select('gut_profile').eq('id', user.id).single()

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: `You are a gut health pattern analyst. Identify correlations between foods, behaviours, timing, and gut health scores from the user's logs. Be specific and data-driven. Only report patterns you have reasonable confidence in. Also identify specific trigger foods that consistently correlate with low scores, and beneficial foods that correlate with high scores.`,
      messages: [{
        role: 'user',
        content: `Analyse these gut health logs for patterns, trigger foods, and beneficial foods:

User profile: ${JSON.stringify(profile?.gut_profile || {})}

Logs (most recent first, ${logs.length} total):
${JSON.stringify(logs.map(l => ({ content: l.content.slice(0, 200), score: l.gut_score, date: l.logged_at })))}

Return JSON:
{
  "patterns": [
    {"trigger": "<food/behaviour/timing>", "effect": "<symptom/score change>", "confidence": "<high|medium>", "detail": "<1 sentence explanation>", "occurrences": <number of times observed>}
  ],
  "triggerFoods": [
    {"food": "<food name>", "avgScoreAfter": <number>, "timesLogged": <number>, "symptoms": ["<symptom 1>", "<symptom 2>"]}
  ],
  "beneficialFoods": [
    {"food": "<food name>", "avgScoreAfter": <number>, "timesLogged": <number>, "benefits": ["<benefit 1>"]}
  ],
  "weeklyTrend": "<improving|stable|declining|insufficient_data>",
  "summary": "<2-3 sentence overall pattern summary>"
}
Return max 5 patterns, 5 trigger foods, and 5 beneficial foods. Only include items with medium or high confidence.`,
      }],
    })

    const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ patterns: [], triggerFoods: [], beneficialFoods: [] })

    const parsed = JSON.parse(jsonMatch[0])

    // Validate expected shape — only return known keys
    return NextResponse.json({
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns.slice(0, 5) : [],
      triggerFoods: Array.isArray(parsed.triggerFoods) ? parsed.triggerFoods.slice(0, 5) : [],
      beneficialFoods: Array.isArray(parsed.beneficialFoods) ? parsed.beneficialFoods.slice(0, 5) : [],
      weeklyTrend: typeof parsed.weeklyTrend === 'string' ? parsed.weeklyTrend : 'insufficient_data',
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    })
  } catch (e: unknown) {
    console.error('Patterns error:', e)
    return NextResponse.json({ error: 'Could not detect patterns' }, { status: 500 })
  }
}
