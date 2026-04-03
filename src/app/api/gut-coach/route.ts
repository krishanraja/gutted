import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan-limits'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const limits = getPlanLimits(profile?.plan || 'free')
    if (!limits.mealPlan) {
      return NextResponse.json({ error: 'Upgrade to Core or Pro to use the Gut Coach' }, { status: 403 })
    }

    const { messages: userMessages } = await req.json()
    if (!userMessages?.length) return NextResponse.json({ error: 'No messages' }, { status: 400 })

    // Fetch user context
    const [{ data: logs }, { data: documents }, { data: patterns }] = await Promise.all([
      supabase.from('logs').select('content, gut_score, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(15),
      supabase.from('documents').select('type, ai_interpretation, biomarkers, recommendations').eq('user_id', user.id).order('uploaded_at', { ascending: false }).limit(5),
      supabase.from('logs').select('content, gut_score, logged_at, ai_analysis').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(30),
    ])

    const recentScores = (logs || []).filter(l => l.gut_score > 0).map(l => l.gut_score)
    const avgScore = recentScores.length ? Math.round((recentScores.reduce((a, b) => a + b, 0) / recentScores.length) * 10) / 10 : 0

    const systemPrompt = `You are the gutted. Gut Health Coach - a warm, knowledgeable, evidence-based gut health assistant. You have access to the user's complete health data and should reference it when relevant.

## User Profile
- Name: ${profile?.name || 'User'}
- Plan: ${profile?.plan}
- Gut Profile: ${JSON.stringify(profile?.gut_profile || {})}

## Recent Health Data
- Average gut score (last 15 logs): ${avgScore}/10
- Recent logs: ${JSON.stringify((logs || []).slice(0, 10).map(l => ({ content: l.content.slice(0, 150), score: l.gut_score, date: new Date(l.logged_at).toLocaleDateString() })))}
- Documents on file: ${JSON.stringify((documents || []).map(d => ({ type: d.type, summary: typeof d.ai_interpretation === 'string' ? d.ai_interpretation.slice(0, 200) : '', biomarkers: d.biomarkers })))}

## Guidelines
- Be conversational and supportive, not clinical
- Reference their specific data when answering questions (e.g., "Looking at your logs from last week...")
- Provide actionable, specific advice based on THEIR profile and history
- If they ask about foods, consider their dietary restrictions and conditions
- Never diagnose medical conditions - always recommend consulting a healthcare professional for medical concerns
- Keep responses concise (2-4 paragraphs max unless they ask for detail)
- If they mention concerning symptoms (blood in stool, severe pain, unexplained weight loss), flag it and recommend seeing a doctor`

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: userMessages.slice(-10), // Keep last 10 messages for context
    })

    const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
    return NextResponse.json({ reply: content })
  } catch (e: unknown) {
    console.error('Gut coach error:', e)
    return NextResponse.json({ error: 'Coach unavailable' }, { status: 500 })
  }
}
