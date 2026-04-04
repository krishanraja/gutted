import { NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan-limits'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const limits = getPlanLimits(profile?.plan || 'free')
    if (!limits.pdfReports) return NextResponse.json({ error: 'Upgrade to Pro for supplement recommendations' }, { status: 403 })

    const [{ data: logs }, { data: documents }] = await Promise.all([
      supabase.from('logs').select('content, gut_score, ai_analysis').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(20),
      supabase.from('documents').select('type, ai_interpretation, biomarkers, recommendations').eq('user_id', user.id).order('uploaded_at', { ascending: false }).limit(5),
    ])

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: 'You are a gut health supplement advisor. Recommend evidence-based supplements and probiotics based on the user\'s specific health data. Always cite general scientific evidence. Never make medical claims. Always recommend consulting a healthcare professional before starting any supplement regimen.',
      messages: [{
        role: 'user',
        content: `Based on this user's gut health data, recommend personalised supplements and probiotics.

User profile: ${JSON.stringify(profile?.gut_profile || {})}
Recent symptoms from logs: ${JSON.stringify((logs || []).slice(0, 10).map(l => l.content.slice(0, 100)))}
Test results: ${JSON.stringify((documents || []).map(d => ({ type: d.type, findings: d.ai_interpretation, biomarkers: d.biomarkers })))}

Return JSON:
{
  "probiotics": [
    {"strain": "<specific strain name>", "benefit": "<what it helps with for THIS user>", "evidence": "<brief evidence note>", "dosage": "<typical dosage>"}
  ],
  "supplements": [
    {"name": "<supplement name>", "benefit": "<why for THIS user>", "evidence": "<brief evidence note>", "dosage": "<typical dosage>", "timing": "<when to take>"}
  ],
  "dietaryFoods": [
    {"food": "<food name>", "benefit": "<natural source of what and why it helps>"}
  ],
  "cautions": ["<any interactions or cautions specific to their profile>"],
  "disclaimer": "These recommendations are informational only. Always consult your healthcare provider before starting any supplement regimen."
}
Return max 3 probiotics, 4 supplements, and 3 dietary foods.`,
      }],
    })

    const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not generate recommendations')

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e: unknown) {
    console.error('Supplements error:', e)
    return NextResponse.json({ error: 'Could not generate recommendations' }, { status: 500 })
  }
}
