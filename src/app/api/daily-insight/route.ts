import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const [{ data: profile }, { data: logs }] = await Promise.all([
      supabase.from('profiles').select('gut_profile, name').eq('id', user.id).single(),
      supabase.from('logs').select('content, gut_score, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(10),
    ])

    if (!logs || logs.length < 2) {
      return NextResponse.json({ insight: null, message: 'Need more logs for insights' })
    }

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 256,
      system: `You are a warm, encouraging gut health AI assistant. Generate a brief, personalised daily insight based on the user's recent gut health logs. Be specific, actionable, and reference actual patterns you see. Keep it to 1-2 sentences. Never diagnose. Use the user's name if available.`,
      messages: [{
        role: 'user',
        content: `User: ${profile?.name || 'User'}
Profile: ${JSON.stringify(profile?.gut_profile || {})}
Recent logs (newest first): ${JSON.stringify(logs)}

Generate a brief daily gut health insight. Return JSON: {"insight": "<1-2 sentence insight>", "type": "<tip|pattern|encouragement|warning>"}`,
      }],
    })

    const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ insight: 'Keep logging to unlock personalised insights!', type: 'tip' })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e: unknown) {
    console.error('Daily insight error:', e)
    return NextResponse.json({ error: 'Could not generate insight' }, { status: 500 })
  }
}
