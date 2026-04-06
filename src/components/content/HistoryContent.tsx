'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import { HistorySkeleton } from '@/components/ui/Skeleton'
import { BottomSheet } from '@/components/BottomSheet'
import { haptic } from '@/lib/haptics'
import { staggerDelay } from '@/lib/animations'

interface Log { id: string; type: string; content: string; gut_score: number; logged_at: string; ai_analysis: { summary?: string; insights?: string[]; recommendations?: string[] } | null }

export function HistoryContent({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [avgScore, setAvgScore] = useState(0)
  const [plan, setPlan] = useState('free')
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)

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

  // Sparkline data
  const scoredLogs = logs.filter(l => l.gut_score > 0).slice(0, 20).reverse()
  const hasSparkline = scoredLogs.length >= 3
  const points = hasSparkline ? scoredLogs.map((l, i) => ({
    x: (i / (scoredLogs.length - 1)) * 280 + 10,
    y: 55 - (l.gut_score / 10) * 45 + 5,
    score: l.gut_score,
  })) : []
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <>
      {/* Mobile: viewport-locked with scroll zone */}
      <div className={embedded ? "flex flex-col h-full md:hidden" : "mobile-viewport md:hidden"}>
        {/* Fixed top: header + score + sparkline */}
        <div className="flex-none">
          {!embedded && (
            <div className="px-6 pt-10 pb-3 animate-fade-in">
              <h1 className="text-xl font-bold">History</h1>
              <p className="text-white/40 text-xs mt-0.5">Your gut health over time</p>
            </div>
          )}

          {/* Compact avg score + sparkline */}
          {(avgScore > 0 || hasSparkline) && (
            <div className="px-6 pb-3">
              {avgScore > 0 && (
                <Card glow className="flex items-center gap-3 py-3 mb-2 animate-fade-up">
                  <GutScore score={avgScore} size="sm" />
                  <div>
                    <p className="text-white/40 text-[10px]">7-day avg</p>
                    <p className="font-semibold text-sm">{avgScore >= 7 ? 'Trending well' : avgScore >= 4 ? 'Room to grow' : "Let's turn this around"}</p>
                  </div>
                  <p className="text-white/20 text-[10px] ml-auto">{logs.length} logs</p>
                </Card>
              )}

              {hasSparkline && (
                <Card className="animate-fade-up stagger-1">
                  <p className="text-white/40 text-[10px] uppercase tracking-wide mb-1.5">Score trend</p>
                  <svg viewBox="0 0 300 65" className="w-full h-12">
                    <rect x="0" y="5" width="300" height="15" fill="rgba(74,222,128,0.05)" rx="2" />
                    <rect x="0" y="20" width="300" height="20" fill="rgba(251,191,36,0.05)" rx="2" />
                    <rect x="0" y="40" width="300" height="20" fill="rgba(239,68,68,0.05)" rx="2" />
                    <path d={pathD} fill="none" stroke="url(#trendGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {points.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={p.score >= 7 ? '#4ADE80' : p.score >= 4 ? '#FBBF24' : '#EF4444'} />
                    ))}
                    <defs>
                      <linearGradient id="trendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00B4B4" />
                        <stop offset="100%" stopColor="#4ADE80" />
                      </linearGradient>
                    </defs>
                  </svg>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Scrollable log list */}
        <div className="flex-1 overflow-y-auto px-6 pb-nav min-h-0">
          {Object.keys(grouped).length === 0 ? (
            <Card className="text-center py-8 animate-fade-up">
              <p className="text-2xl mb-2">📝</p>
              <p className="text-white/50 text-sm">No logs yet. Start tracking your gut health.</p>
            </Card>
          ) : (
            Object.entries(grouped).map(([date, dayLogs], groupIdx) => (
              <div key={date} className="mb-4">
                <p className="text-white/30 text-[10px] uppercase tracking-wide mb-2">{date}</p>
                <div className="space-y-1.5">
                  {dayLogs.map((log, logIdx) => (
                    <button
                      key={log.id}
                      onClick={() => { haptic.light(); setSelectedLog(log) }}
                      className="w-full text-left animate-fade-up active:scale-[0.98] transition-transform"
                      style={staggerDelay(groupIdx * 2 + logIdx)}
                    >
                      <Card>
                        <div className="flex items-center gap-2">
                          <span className="text-xs shrink-0">{log.type === 'voice' ? '🎤' : '✏️'}</span>
                          <p className="text-xs text-white/60 truncate flex-1">{log.content}</p>
                          <span className="text-white/20 text-[10px] shrink-0">
                            {new Date(log.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {log.gut_score > 0 && (
                            <Badge variant={log.gut_score >= 7 ? 'green' : log.gut_score >= 4 ? 'amber' : 'red'}>
                              {log.gut_score}
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}

          {isLimited && logs.length > 0 && (
            <div className="bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border border-[#00B4B4]/20 rounded-2xl p-3 text-center mt-2">
              <p className="text-white/50 text-xs mb-1">Showing last {limits.historyDays} days</p>
              <Link href="/dashboard/settings" className="text-[#4ADE80] text-xs font-medium hover:underline">Upgrade for full history →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Desktop: original layout */}
      <div className="hidden md:block bg-black">
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
              className="text-[#4ADE80] text-xs hover:underline shrink-0"
            >
              Export CSV
            </button>
          )}
        </div>

        {avgScore > 0 && (
          <div className="px-6 mb-6">
            <Card glow className="flex items-center gap-4 animate-fade-up">
              <GutScore score={avgScore} size="lg" />
              <div>
                <p className="text-white/40 text-xs mb-1">7-day average</p>
                <p className="font-semibold">{avgScore >= 7 ? 'Trending well' : avgScore >= 4 ? 'Room to grow' : "Let's turn this around"}</p>
                <p className="text-white/30 text-xs mt-0.5">{logs.length} log{logs.length !== 1 ? 's' : ''} total</p>
              </div>
            </Card>
          </div>
        )}

        {hasSparkline && (
          <div className="px-6 mb-6">
            <Card className="animate-fade-up stagger-1">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Gut score trend</p>
              <svg viewBox="0 0 300 65" className="w-full h-16">
                <rect x="0" y="5" width="300" height="15" fill="rgba(74,222,128,0.05)" rx="2" />
                <rect x="0" y="20" width="300" height="20" fill="rgba(251,191,36,0.05)" rx="2" />
                <rect x="0" y="40" width="300" height="20" fill="rgba(239,68,68,0.05)" rx="2" />
                <path d={pathD} fill="none" stroke="url(#trendGradD)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3" fill={p.score >= 7 ? '#4ADE80' : p.score >= 4 ? '#FBBF24' : '#EF4444'} />
                ))}
                <defs>
                  <linearGradient id="trendGradD" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00B4B4" />
                    <stop offset="100%" stopColor="#4ADE80" />
                  </linearGradient>
                </defs>
              </svg>
            </Card>
          </div>
        )}

        <div className="px-6 space-y-6">
          {Object.keys(grouped).length === 0 ? (
            <Card className="text-center py-10 animate-fade-up">
              <p className="text-3xl mb-3">📝</p>
              <p className="text-white/50">No logs yet. Start tracking your gut health.</p>
            </Card>
          ) : (
            Object.entries(grouped).map(([date, dayLogs]) => (
              <div key={date}>
                <p className="text-white/30 text-xs uppercase tracking-wide mb-3">{date}</p>
                <div className="space-y-2">
                  {dayLogs.map(log => (
                    <Card key={log.id} entrance="fade-up">
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
      </div>

      {/* Log detail bottom sheet (mobile only) */}
      <BottomSheet open={!!selectedLog} onClose={() => setSelectedLog(null)} title="Log detail">
        {selectedLog && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {selectedLog.gut_score > 0 && <GutScore score={selectedLog.gut_score} size="sm" animate={false} />}
              <div>
                <p className="text-white/40 text-xs">
                  {new Date(selectedLog.logged_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-xs text-white/30 mt-0.5">{selectedLog.type === 'voice' ? '🎤 Voice log' : '✏️ Text log'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-white/70 leading-relaxed">{selectedLog.content}</p>
            </div>

            {selectedLog.ai_analysis?.summary && (
              <div className="border-t border-white/10 pt-3">
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">AI Summary</p>
                <p className="text-sm text-[#4ADE80]">{selectedLog.ai_analysis.summary}</p>
              </div>
            )}

            {selectedLog.ai_analysis?.insights && selectedLog.ai_analysis.insights.length > 0 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Insights</p>
                <ul className="space-y-1.5">
                  {selectedLog.ai_analysis.insights.map((insight, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/60">
                      <span className="text-[#4ADE80]">•</span>{insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link href={`/dashboard/history/${selectedLog.id}`} className="block text-center text-[#4ADE80] text-sm mt-2 hover:underline">
              View full detail →
            </Link>
          </div>
        )}
      </BottomSheet>
    </>
  )
}
