'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import { HistorySkeleton } from '@/components/ui/Skeleton'

interface Log { id: string; type: string; content: string; gut_score: number; logged_at: string; ai_analysis: { summary?: string } | null }

export default function HistoryPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [avgScore, setAvgScore] = useState(0)
  const [plan, setPlan] = useState('free')

  const limits = getPlanLimits(plan)
  const isLimited = limits.historyDays !== Infinity

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      const userPlan = profile?.plan || 'free'
      setPlan(userPlan)
      const userLimits = getPlanLimits(userPlan)

      let query = supabase.from('logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(50)
      if (userLimits.historyDays !== Infinity) {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - userLimits.historyDays)
        query = query.gte('logged_at', cutoff.toISOString())
      }

      const { data } = await query
      const l = data || []
      setLogs(l)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentScores = l.filter(x => x.gut_score > 0 && new Date(x.logged_at) >= sevenDaysAgo).map(x => x.gut_score)
      setAvgScore(recentScores.length ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length) : 0)
      setLoading(false)
    }
    load()
  }, [])

  const grouped = logs.reduce((acc, log) => {
    const date = new Date(log.logged_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, Log[]>)

  if (loading) return <HistorySkeleton />

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">History</h1>
          <p className="text-white/40 text-sm mt-1">Your gut health over time</p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={() => {
              const csv = ['Date,Type,Content,Gut Score', ...logs.map(l =>
                `"${new Date(l.logged_at).toLocaleDateString()}","${l.type}","${l.content.replace(/"/g, '""')}",${l.gut_score}`
              )].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `gutted-logs-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
            }}
            className="hidden md:block text-[#4ADE80] text-xs hover:underline shrink-0"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Average score */}
      {avgScore > 0 && (
        <div className="px-6 mb-6">
          <Card glow className="flex items-center gap-4">
            <GutScore score={avgScore} size="lg" />
            <div>
              <p className="text-white/40 text-xs mb-1">7-day average</p>
              <p className="font-semibold">{avgScore >= 7 ? 'Trending well' : avgScore >= 4 ? 'Room to grow' : "Let's turn this around"}</p>
              <p className="text-white/30 text-xs mt-0.5">{logs.length} log{logs.length !== 1 ? 's' : ''} total</p>
            </div>
          </Card>
        </div>
      )}

      {/* Trend sparkline */}
      {(() => {
        const scoredLogs = logs.filter(l => l.gut_score > 0).slice(0, 20).reverse()
        if (scoredLogs.length < 3) return null
        const points = scoredLogs.map((l, i) => ({
          x: (i / (scoredLogs.length - 1)) * 280 + 10,
          y: 55 - (l.gut_score / 10) * 45 + 5,
          score: l.gut_score,
        }))
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
        return (
          <div className="px-6 mb-6">
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Gut score trend</p>
              <svg viewBox="0 0 300 65" className="w-full h-16">
                {/* Zone backgrounds */}
                <rect x="0" y="5" width="300" height="15" fill="rgba(74,222,128,0.05)" rx="2" />
                <rect x="0" y="20" width="300" height="20" fill="rgba(251,191,36,0.05)" rx="2" />
                <rect x="0" y="40" width="300" height="20" fill="rgba(239,68,68,0.05)" rx="2" />
                {/* Trend line */}
                <path d={pathD} fill="none" stroke="url(#trendGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Dots */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    fill={p.score >= 7 ? '#4ADE80' : p.score >= 4 ? '#FBBF24' : '#EF4444'}
                  />
                ))}
                <defs>
                  <linearGradient id="trendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00B4B4" />
                    <stop offset="100%" stopColor="#4ADE80" />
                  </linearGradient>
                </defs>
              </svg>
            </Card>
          </div>
        )
      })()}

      {/* Log timeline */}
      <div className="px-6 space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-white/50">No logs yet. Start tracking your gut health.</p>
          </Card>
        ) : (
          Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <p className="text-white/30 text-xs uppercase tracking-wide mb-3">{date}</p>
              <div className="space-y-2">
                {dayLogs.map(log => (
                  <Card key={log.id}>
                    <Link href={`/dashboard/history/${log.id}`} className="flex items-start gap-3 -m-4 p-4">
                      <span className="text-lg mt-0.5">{log.type === 'voice' ? '🎤' : '✏️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/70 leading-relaxed">{log.content}</p>
                        {log.ai_analysis?.summary && (
                          <p className="text-xs text-[#4ADE80] mt-1">{log.ai_analysis.summary}</p>
                        )}
                        <p className="text-white/20 text-xs mt-1">
                          {new Date(log.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {log.gut_score > 0 && (
                        <Badge variant={log.gut_score >= 7 ? 'green' : log.gut_score >= 4 ? 'amber' : 'red'}>
                          {log.gut_score}/10
                        </Badge>
                      )}
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {isLimited && logs.length > 0 && (
        <div className="px-6 mt-6">
          <div className="bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border border-[#00B4B4]/20 rounded-2xl p-4 text-center">
            <p className="text-white/50 text-sm mb-2">Showing last {limits.historyDays} days only</p>
            <Link href="/dashboard/settings" className="text-[#4ADE80] text-sm font-medium hover:underline">Upgrade for full history →</Link>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  )
}
