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
    if (!limits.pdfReports) return NextResponse.json({ error: 'Upgrade to Pro for PDF reports' }, { status: 403 })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [{ data: logs }, { data: documents }, { data: mealPlans }] = await Promise.all([
      supabase.from('logs').select('*').eq('user_id', user.id).gte('logged_at', thirtyDaysAgo.toISOString()).order('logged_at', { ascending: false }),
      supabase.from('documents').select('*').eq('user_id', user.id).order('uploaded_at', { ascending: false }).limit(5),
      supabase.from('meal_plans').select('*').eq('user_id', user.id).order('generated_at', { ascending: false }).limit(1),
    ])

    const allLogs = logs || []
    const scores = allLogs.filter(l => l.gut_score > 0).map(l => l.gut_score)
    const avgScore = scores.length ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0
    const highestScore = scores.length ? Math.max(...scores) : 0
    const lowestScore = scores.length ? Math.min(...scores) : 0

    // Group scores by week
    const weeklyScores: Record<string, number[]> = {}
    allLogs.forEach(log => {
      if (log.gut_score > 0) {
        const d = new Date(log.logged_at)
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        const key = weekStart.toISOString().split('T')[0]
        if (!weeklyScores[key]) weeklyScores[key] = []
        weeklyScores[key].push(log.gut_score)
      }
    })

    // Get AI summary
    let aiSummary = ''
    if (allLogs.length >= 3) {
      const msg = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: 'You are a gut health report writer. Write a professional, encouraging health summary suitable for a monthly report. Be specific about trends and patterns. Never diagnose. Always recommend consulting a healthcare professional for medical concerns.',
        messages: [{
          role: 'user',
          content: `Write a monthly gut health summary report for this user.

Profile: ${JSON.stringify(profile?.gut_profile || {})}
Logs (last 30 days): ${JSON.stringify(allLogs.slice(0, 20).map(l => ({ content: l.content, score: l.gut_score, date: l.logged_at })))}
Documents: ${JSON.stringify((documents || []).map(d => ({ type: d.type, interpretation: d.ai_interpretation })))}
Average gut score: ${avgScore}/10
Total logs: ${allLogs.length}

Return JSON:
{
  "overview": "<3-4 sentence overview of their gut health this month>",
  "trends": "<2-3 sentences about score trends and changes>",
  "topPatterns": ["<pattern 1>", "<pattern 2>", "<pattern 3>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "encouragement": "<1 sentence of encouragement>"
}`
        }],
      })
      const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) aiSummary = jsonMatch[0]
    }

    let reportData = { overview: '', trends: '', topPatterns: [] as string[], recommendations: [] as string[], encouragement: '' }
    if (aiSummary) {
      try { reportData = JSON.parse(aiSummary) } catch { /* use defaults */ }
    }

    const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const periodStart = thirtyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const periodEnd = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    return NextResponse.json({
      report: {
        generatedAt: reportDate,
        period: `${periodStart} - ${periodEnd}`,
        userName: profile?.name || 'User',
        stats: {
          avgScore,
          highestScore,
          lowestScore,
          totalLogs: allLogs.length,
          totalDocuments: (documents || []).length,
        },
        weeklyScores: Object.entries(weeklyScores).map(([week, s]) => ({
          week,
          avg: Math.round((s.reduce((a, b) => a + b, 0) / s.length) * 10) / 10,
          count: s.length,
        })).sort((a, b) => a.week.localeCompare(b.week)),
        ai: reportData,
        recentLogs: allLogs.slice(0, 10).map(l => ({
          date: new Date(l.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          content: l.content.slice(0, 100),
          score: l.gut_score,
        })),
      },
    })
  } catch (e: unknown) {
    console.error('Health report error:', e)
    return NextResponse.json({ error: 'Could not generate report' }, { status: 500 })
  }
}
