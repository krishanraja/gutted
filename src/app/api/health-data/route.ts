import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan-limits'

// POST: Save health data from integrations
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    const limits = getPlanLimits(profile?.plan || 'free')
    if (!limits.pdfReports) return NextResponse.json({ error: 'Upgrade to Pro for health integrations' }, { status: 403 })

    const { entries } = await req.json()
    if (!entries?.length) return NextResponse.json({ error: 'No data entries' }, { status: 400 })

    const rows = entries.map((e: { source: string; metric: string; value: number; recorded_at: string }) => ({
      user_id: user.id,
      source: e.source,
      metric: e.metric,
      value: e.value,
      recorded_at: e.recorded_at,
    }))

    const { error } = await supabase.from('health_data').insert(rows)
    if (error) throw error

    return NextResponse.json({ inserted: rows.length })
  } catch (e: unknown) {
    console.error('Health data error:', e)
    return NextResponse.json({ error: 'Failed to save health data' }, { status: 500 })
  }
}

// GET: Fetch health data with optional gut score correlation
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const days = parseInt(req.nextUrl.searchParams.get('days') || '30')
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const [{ data: healthData }, { data: logs }] = await Promise.all([
      supabase.from('health_data').select('*').eq('user_id', user.id).gte('recorded_at', cutoff.toISOString()).order('recorded_at', { ascending: false }),
      supabase.from('logs').select('gut_score, logged_at').eq('user_id', user.id).gte('logged_at', cutoff.toISOString()).order('logged_at', { ascending: false }),
    ])

    // Group health data by metric
    const metrics: Record<string, { values: number[]; dates: string[] }> = {}
    for (const entry of (healthData || [])) {
      if (!metrics[entry.metric]) metrics[entry.metric] = { values: [], dates: [] }
      metrics[entry.metric].values.push(Number(entry.value))
      metrics[entry.metric].dates.push(entry.recorded_at)
    }

    // Calculate simple correlations with gut scores
    const correlations: Record<string, { metric: string; correlation: string; detail: string }> = {}
    const gutScoresByDate: Record<string, number[]> = {}
    for (const log of (logs || [])) {
      if (log.gut_score > 0) {
        const date = new Date(log.logged_at).toISOString().split('T')[0]
        if (!gutScoresByDate[date]) gutScoresByDate[date] = []
        gutScoresByDate[date].push(log.gut_score)
      }
    }

    for (const [metric, data] of Object.entries(metrics)) {
      const metricByDate: Record<string, number[]> = {}
      for (let i = 0; i < data.values.length; i++) {
        const date = new Date(data.dates[i]).toISOString().split('T')[0]
        if (!metricByDate[date]) metricByDate[date] = []
        metricByDate[date].push(data.values[i])
      }

      // Find overlapping dates
      const commonDates = Object.keys(metricByDate).filter(d => gutScoresByDate[d])
      if (commonDates.length >= 5) {
        const metricAvgs = commonDates.map(d => metricByDate[d].reduce((a, b) => a + b, 0) / metricByDate[d].length)
        const gutAvgs = commonDates.map(d => gutScoresByDate[d].reduce((a, b) => a + b, 0) / gutScoresByDate[d].length)

        // Simple correlation direction
        const highMetricGut = metricAvgs.filter((_, i) => metricAvgs[i] > metricAvgs.reduce((a, b) => a + b, 0) / metricAvgs.length).map((_, i) => gutAvgs[i])
        const lowMetricGut = metricAvgs.filter((_, i) => metricAvgs[i] <= metricAvgs.reduce((a, b) => a + b, 0) / metricAvgs.length).map((_, i) => gutAvgs[i])

        const highAvg = highMetricGut.length ? highMetricGut.reduce((a, b) => a + b, 0) / highMetricGut.length : 0
        const lowAvg = lowMetricGut.length ? lowMetricGut.reduce((a, b) => a + b, 0) / lowMetricGut.length : 0
        const diff = Math.abs(highAvg - lowAvg)

        if (diff > 0.5) {
          correlations[metric] = {
            metric,
            correlation: highAvg > lowAvg ? 'positive' : 'negative',
            detail: highAvg > lowAvg
              ? `Higher ${metric.replace('_', ' ')} tends to correlate with better gut scores (+${diff.toFixed(1)})`
              : `Higher ${metric.replace('_', ' ')} tends to correlate with lower gut scores (-${diff.toFixed(1)})`,
          }
        }
      }
    }

    return NextResponse.json({
      metrics: Object.entries(metrics).map(([metric, data]) => ({
        metric,
        count: data.values.length,
        avg: Math.round((data.values.reduce((a, b) => a + b, 0) / data.values.length) * 10) / 10,
        latest: data.values[0],
      })),
      correlations: Object.values(correlations),
    })
  } catch (e: unknown) {
    console.error('Health data fetch error:', e)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
