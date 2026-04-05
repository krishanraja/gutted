'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { GutScore } from '@/components/GutScore'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'

interface ReportStats { avgScore: number; highestScore: number; lowestScore: number; totalLogs: number; totalDocuments: number }
interface WeeklyScore { week: string; avg: number; count: number }
interface ReportAI { overview: string; trends: string; topPatterns: string[]; recommendations: string[]; encouragement: string }
interface ReportLog { date: string; content: string; score: number }
interface Report {
  generatedAt: string; period: string; userName: string
  stats: ReportStats; weeklyScores: WeeklyScore[]; ai: ReportAI; recentLogs: ReportLog[]
}

export default function ReportPage() {
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState('free')
  const [error, setError] = useState('')
  const reportRef = useRef<HTMLDivElement>(null)

  const limits = getPlanLimits(plan)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      setPlan(profile?.plan || 'free')
      setLoading(false)
    }
    load()
  }, [router])

  const generate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/health-report', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReport(data.report)
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const printReport = () => {
    window.print()
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Health Report</h1>
        <p className="text-white/40 text-sm mt-1">Your monthly gut health summary</p>
      </div>

      {!limits.pdfReports ? (
        <div className="px-6">
          <Card className="text-center py-10">
            <div className="text-4xl mb-4">📊</div>
            <p className="font-semibold mb-2">Unlock PDF health reports</p>
            <p className="text-white/40 text-sm mb-6">Upgrade to Pro to generate detailed monthly gut health reports you can share with your doctor.</p>
            <Link href="/dashboard/settings" className="text-[#4ADE80] text-sm font-medium hover:underline">Upgrade to Pro →</Link>
          </Card>
        </div>
      ) : !report ? (
        <div className="px-6">
          <Card className="text-center py-10">
            <div className="text-4xl mb-4">📊</div>
            <p className="font-semibold mb-2">Generate your monthly report</p>
            <p className="text-white/40 text-sm mb-6">Get an AI-powered summary of the last 30 days including trends, patterns, and recommendations.</p>
            <Button onClick={generate} loading={generating}>Generate report</Button>
          </Card>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </div>
      ) : (
        <div ref={reportRef} className="px-6 space-y-4 mb-6">
          {/* Report header */}
          <Card glow>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide">Monthly gut health report</p>
                <p className="font-semibold text-lg mt-1">{report.userName}</p>
                <p className="text-white/40 text-sm">{report.period}</p>
              </div>
              <Badge variant="teal">Pro</Badge>
            </div>
            {report.ai.overview && (
              <p className="text-white/70 text-sm leading-relaxed">{report.ai.overview}</p>
            )}
          </Card>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center py-4">
              <GutScore score={report.stats.avgScore} size="lg" />
              <p className="text-white/40 text-xs mt-2">Avg score</p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-3xl font-bold gradient-text">{report.stats.totalLogs}</p>
              <p className="text-white/40 text-xs mt-2">Total logs</p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-3xl font-bold text-[#4ADE80]">{report.stats.highestScore}</p>
              <p className="text-white/40 text-xs mt-2">Best score</p>
            </Card>
            <Card className="text-center py-4">
              <p className="text-3xl font-bold text-red-400">{report.stats.lowestScore}</p>
              <p className="text-white/40 text-xs mt-2">Lowest score</p>
            </Card>
          </div>

          {/* Weekly trend */}
          {report.weeklyScores.length > 1 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Weekly averages</p>
              <div className="space-y-2">
                {report.weeklyScores.map((w) => (
                  <div key={w.week} className="flex items-center gap-3">
                    <p className="text-white/40 text-xs w-20 shrink-0">
                      {new Date(w.week + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <div className="flex-1 bg-white/5 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00B4B4] to-[#4ADE80]"
                        style={{ width: `${(w.avg / 10) * 100}%` }}
                      />
                    </div>
                    <p className="text-white/60 text-sm font-medium w-8 text-right">{w.avg}</p>
                  </div>
                ))}
              </div>
              {report.ai.trends && (
                <p className="text-white/50 text-sm mt-4 leading-relaxed">{report.ai.trends}</p>
              )}
            </Card>
          )}

          {/* Patterns */}
          {report.ai.topPatterns.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Patterns identified</p>
              <div className="space-y-2">
                {report.ai.topPatterns.map((p, i) => (
                  <div key={i} className="flex gap-2 text-sm text-white/70">
                    <span className="text-[#00B4B4] shrink-0">🔍</span>{p}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {report.ai.recommendations.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Recommendations</p>
              <ul className="space-y-2">
                {report.ai.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/70">
                    <span className="text-[#4ADE80] shrink-0">✓</span>{r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Recent logs summary */}
          {report.recentLogs.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Recent log highlights</p>
              <div className="space-y-2">
                {report.recentLogs.map((l, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <p className="text-white/30 text-xs w-14 shrink-0">{l.date}</p>
                    <p className="text-sm text-white/60 flex-1 truncate">{l.content}</p>
                    {l.score > 0 && (
                      <Badge variant={l.score >= 7 ? 'green' : l.score >= 4 ? 'amber' : 'red'}>
                        {l.score}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Encouragement */}
          {report.ai.encouragement && (
            <Card className="border-[#4ADE80]/20 bg-[#4ADE80]/5">
              <div className="flex gap-3">
                <span className="text-lg">🌟</span>
                <p className="text-sm text-white/70 leading-relaxed">{report.ai.encouragement}</p>
              </div>
            </Card>
          )}

          {/* Disclaimer */}
          <p className="text-white/20 text-xs text-center">
            This report is for informational purposes only and is not a medical document. Always consult a healthcare professional for medical advice.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={printReport} variant="outline" className="flex-1">Print / Save PDF</Button>
            <Button onClick={generate} loading={generating} variant="outline" className="flex-1">Regenerate</Button>
          </div>
        </div>
      )}
    </div>
  )
}
