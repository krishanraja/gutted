import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan-limits'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const limits = getPlanLimits(profile?.plan || 'free')
    if (!limits.pdfReports) return NextResponse.json({ error: 'Upgrade to Pro for doctor summaries' }, { status: 403 })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [{ data: logs }, { data: documents }] = await Promise.all([
      supabase.from('logs').select('content, gut_score, logged_at').eq('user_id', user.id).gte('logged_at', thirtyDaysAgo.toISOString()).order('logged_at', { ascending: false }),
      supabase.from('documents').select('type, ai_interpretation, biomarkers, recommendations').eq('user_id', user.id).order('uploaded_at', { ascending: false }).limit(5),
    ])

    const allLogs = logs || []
    const scores = allLogs.filter(l => l.gut_score > 0).map(l => l.gut_score)
    const avgScore = scores.length ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: 'You are preparing a concise gut health summary for a doctor visit. Write in a professional, clinical-friendly format. Include objective data points. Be factual and avoid speculation. Always note this is patient-reported data from a health tracking app.',
      messages: [{
        role: 'user',
        content: `Create a doctor visit summary for this patient's gut health data.

Patient profile: ${JSON.stringify(profile?.gut_profile || {})}
Period: Last 30 days
Average gut score (self-reported): ${avgScore}/10
Total symptom logs: ${allLogs.length}

Recent symptom logs: ${JSON.stringify(allLogs.slice(0, 15).map(l => ({ date: new Date(l.logged_at).toLocaleDateString(), symptoms: l.content.slice(0, 100), selfReportedScore: l.gut_score })))}

Documents on file: ${JSON.stringify((documents || []).map(d => ({ type: d.type, findings: d.ai_interpretation, biomarkers: d.biomarkers })))}

Return JSON:
{
  "patientSummary": "<2-3 sentences summarizing overall gut health status>",
  "keySymptoms": ["<symptom 1 with frequency>", "<symptom 2>", "<symptom 3>"],
  "testResults": ["<relevant test finding 1>", "<finding 2>"],
  "scoreHistory": "<brief description of score trends>",
  "dietaryNotes": ["<notable dietary pattern 1>", "<pattern 2>"],
  "questionsForDoctor": ["<suggested question 1>", "<question 2>", "<question 3>"],
  "disclaimer": "This data is self-reported from a consumer health tracking application and should be considered alongside clinical examination."
}`,
      }],
    })

    const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not generate summary')

    const summary = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      summary: {
        ...summary,
        generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        patientName: profile?.name,
        period: `${thirtyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        avgScore,
        totalLogs: allLogs.length,
      },
    })
  } catch (e: unknown) {
    console.error('Doctor summary error:', e)
    return NextResponse.json({ error: 'Could not generate summary' }, { status: 500 })
  }
}
