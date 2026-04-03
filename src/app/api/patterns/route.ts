import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: logs } = await supabase
      .from('logs')
      .select('content, gut_score, logged_at, ai_analysis')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(20)

    if (!logs || logs.length < 5) {
      return NextResponse.json({ patterns: [], message: 'Need at least 5 logs for pattern detection' })
    }

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      system: `You are a gut health pattern analyst. Identify correlations between foods, behaviours, timing, and gut health scores from the user's logs. Be specific and data-driven. Only report patterns you have reasonable confidence in.`,
      messages: [{
        role: 'user',
        content: `Analyse these gut health logs for patterns and correlations:
${JSON.stringify(logs)}

Return JSON:
{
  "patterns": [
    {"trigger": "<food/behaviour/timing>", "effect": "<symptom/score change>", "confidence": "<high|medium>", "detail": "<1 sentence explanation>"}
  ]
}
Return max 3 patterns. Only include medium or high confidence patterns.`,
      }],
    })

    const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ patterns: [] })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e: unknown) {
    console.error('Patterns error:', e)
    return NextResponse.json({ error: 'Could not detect patterns' }, { status: 500 })
  }
}
