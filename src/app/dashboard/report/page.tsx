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
import { FileTextIcon, ArrowRightIcon, SearchIcon, CheckIcon, SparkleIcon } from '@/components/icons'

interface ReportStats { avgScore: number; highestScore: number; lowestScore: number; totalLogs: number; totalDocuments: number }
interface WeeklyScore { week: string; avg: number; count: number }
interface ReportAI { overview: string; trends: string; topPatterns: string[]; recommendations: string[]; encouragement: string }
interface ReportLog { date: string; content: string; score: number }
interface Report {
  generatedAt: string; period: string; userName: string
  stats: ReportStats; weeklyScores: WeeklyScore[]; ai: ReportAI; recentLogs: ReportLog[]
}

function scoreColor(v: number) {
  return v >= 7 ? '#3FBE6F' : v >= 4 ? '#E8AE1E' : '#E96363'
}

// On-skin SVG trend chart: a smooth area sparkline with point markers so the
// month reads as a single shape on screen and stays crisp on paper. Falls back
// to nothing upstream when fewer than two weeks exist.
function TrendChart({ data }: { data: WeeklyScore[] }) {
  const W = 640
  const H = 150
  const padX = 12
  const padY = 16
  const innerW = W - padX * 2
  const innerH = H - padY * 2
  const n = data.length
  const x = (i: number) => padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => padY + innerH - (Math.max(0, Math.min(10, v)) / 10) * innerH
  const pts = data.map((d, i) => ({ px: x(i), py: y(d.avg), v: d.avg, week: d.week }))
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px.toFixed(1)} ${p.py.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${pts[pts.length - 1].px.toFixed(1)} ${(padY + innerH).toFixed(1)} L ${pts[0].px.toFixed(1)} ${(padY + innerH).toFixed(1)} Z`
  const gridLines = [10, 7, 4, 0]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Weekly average gut score trend">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00B4B4" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#00B4B4" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines.map(g => {
        const gy = y(g)
        return (
          <g key={g}>
            <line x1={padX} y1={gy} x2={W - padX} y2={gy} className="trend-grid" stroke="rgba(255,255,255,0.07)" strokeWidth={1} strokeDasharray="2 4" />
            <text x={2} y={gy + 3} className="trend-axis" fill="rgba(255,255,255,0.3)" fontSize={9}>{g}</text>
          </g>
        )
      })}
      <path d={areaPath} fill="url(#trendFill)" className="trend-area" />
      <path d={linePath} fill="none" stroke="#00B4B4" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" className="trend-line" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.px} cy={p.py} r={3.25} fill="#0a0a0a" stroke={scoreColor(p.v)} strokeWidth={2} className="trend-dot" />
          <text x={p.px} y={p.py - 9} textAnchor="middle" fontSize={10} fontWeight={600} fill={scoreColor(p.v)} className="trend-val">{p.v}</text>
        </g>
      ))}
    </svg>
  )
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
      <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64 report-root">
      {/* Scoped print styles. Produces a clean, branded white one-pager when the
          browser "Save as PDF" runs. Everything outside .report-sheet is hidden,
          the dark skin is swapped for print-safe ink, and sections are kept
          off page breaks. Nothing here leaks to screen rendering. */}
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 14mm 14mm 16mm; }
          html, body { background: #ffffff !important; }
          body * { visibility: hidden !important; }
          .report-sheet, .report-sheet * { visibility: visible !important; }
          .report-sheet {
            position: absolute; left: 0; top: 0; width: 100%;
            margin: 0 !important; padding: 0 !important;
            color: #111827 !important; background: #ffffff !important;
          }
          .no-print { display: none !important; }
          .report-sheet .print-card {
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            break-inside: avoid; page-break-inside: avoid;
            margin-bottom: 10px !important;
            padding: 14px 16px !important;
          }
          .report-sheet .print-ink { color: #111827 !important; }
          .report-sheet .print-muted { color: #4b5563 !important; }
          .report-sheet .print-faint { color: #6b7280 !important; }
          .report-sheet .print-label { color: #6b7280 !important; }
          .report-sheet .print-rule { border-color: #e5e7eb !important; }
          .report-sheet .print-accent { color: #007a7a !important; }
          .report-sheet .print-band { background: #f3fafa !important; border-color: #cdeaea !important; }
          .report-sheet .trend-grid { stroke: rgba(17,24,39,0.12) !important; }
          .report-sheet .trend-axis { fill: #6b7280 !important; }
          .report-sheet .trend-line { stroke: #007a7a !important; }
          .report-sheet .trend-dot { fill: #ffffff !important; }
          .report-sheet .trend-area { opacity: 0.55 !important; }
          .report-sheet .print-stat-box {
            background: #f9fafb !important; border: 1px solid #e5e7eb !important;
          }
          .report-sheet .print-keep { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="px-5 pt-safe pb-5 md:px-6 md:pt-10 no-print">
        <button onClick={() => router.back()} className="text-white/45 text-sm mb-4 inline-flex items-center gap-1 pt-3 md:pt-0 hover:text-white transition-colors">
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-xl md:text-2xl font-medium tracking-tight">Health report</h1>
        <p className="text-white/45 text-sm mt-1">A clean, printable summary of your last 30 days.</p>
      </div>

      {!limits.pdfReports ? (
        <div className="px-5 md:px-6 no-print">
          <Card className="text-center py-10">
            <FileTextIcon size={28} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-2">Unlock PDF health reports</p>
            <p className="text-white/55 text-sm mb-6">Upgrade to Pro to generate detailed monthly gut health reports you can share with your doctor.</p>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade to Pro <ArrowRightIcon size={14} /></Link>
          </Card>
        </div>
      ) : !report ? (
        <div className="px-5 md:px-6 no-print">
          <Card className="text-center py-10">
            <FileTextIcon size={28} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-2">Generate your monthly report</p>
            <p className="text-white/55 text-sm mb-6">Get an AI summary of the last 30 days including trends, patterns, and capability-focused suggestions, formatted for clean printing.</p>
            <Button onClick={generate} loading={generating}>Generate report</Button>
          </Card>
          {error && <p className="text-[#E96363] text-sm mt-4 text-center">{error}</p>}
        </div>
      ) : (
        <>
          <div ref={reportRef} className="report-sheet px-5 md:px-6 max-w-3xl mx-auto mb-6">
            {/* Document header */}
            <Card className="print-card print-keep">
              <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-white/[0.08] print-rule">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold tracking-tight print-ink">gutted<span className="text-accent print-accent">.</span></span>
                    <Badge variant="teal">Pro</Badge>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight mt-2 print-ink">Monthly Gut Health Report</h2>
                  <p className="text-sm text-white/55 print-muted mt-0.5">{report.userName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider print-label">Reporting period</p>
                  <p className="num text-sm font-medium print-ink mt-0.5">{report.period}</p>
                  <p className="text-white/35 text-[11px] print-faint mt-1.5">Generated {report.generatedAt}</p>
                </div>
              </div>
              {report.ai.overview && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1.5 print-label">Summary</p>
                  <p className="text-white/75 text-sm leading-relaxed print-ink">{report.ai.overview}</p>
                </div>
              )}
            </Card>

            {/* Metrics row */}
            <Card className="print-card print-keep">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-3 print-label">At a glance</p>
              <div className="flex items-center gap-5">
                <div className="shrink-0 text-center">
                  <GutScore score={report.stats.avgScore} size="lg" animate={false} />
                  <p className="text-white/45 text-[10px] uppercase tracking-wider mt-1 print-label">Avg score</p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-2.5 text-center print-stat-box">
                    <p className="num text-2xl font-semibold tracking-tight print-ink">{report.stats.totalLogs}</p>
                    <p className="text-white/45 text-[10px] uppercase tracking-wider mt-1 print-label">Logs</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-2.5 text-center print-stat-box">
                    <p className="num text-2xl font-semibold tracking-tight print-ink">{report.stats.totalDocuments}</p>
                    <p className="text-white/45 text-[10px] uppercase tracking-wider mt-1 print-label">Documents</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-2.5 text-center print-stat-box">
                    <p className="num text-2xl font-semibold tracking-tight text-[#3FBE6F]">{report.stats.highestScore}</p>
                    <p className="text-white/45 text-[10px] uppercase tracking-wider mt-1 print-label">Best day</p>
                  </div>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-2.5 text-center print-stat-box">
                    <p className="num text-2xl font-semibold tracking-tight text-[#E96363]">{report.stats.lowestScore}</p>
                    <p className="text-white/45 text-[10px] uppercase tracking-wider mt-1 print-label">Lowest day</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Weekly trend */}
            {report.weeklyScores.length > 1 && (
              <Card className="print-card print-keep">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider print-label">Weekly average score</p>
                  <p className="text-white/35 text-[10px] print-faint">Scale 0 to 10</p>
                </div>
                <TrendChart data={report.weeklyScores} />
                <div className="flex justify-between mt-1 px-1">
                  {report.weeklyScores.map((w) => (
                    <p key={w.week} className="num text-white/35 text-[10px] print-faint">
                      {new Date(w.week + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  ))}
                </div>
                {report.ai.trends && (
                  <p className="text-white/55 text-sm mt-3 leading-relaxed print-muted">{report.ai.trends}</p>
                )}
              </Card>
            )}

            {/* Patterns + Recommendations side by side on paper */}
            {(report.ai.topPatterns.length > 0 || report.ai.recommendations.length > 0) && (
              <div className="grid md:grid-cols-2 gap-3 print-keep" style={{ display: 'grid' }}>
                {report.ai.topPatterns.length > 0 && (
                  <Card className="print-card">
                    <div className="flex items-center gap-1.5 mb-3">
                      <SearchIcon size={13} className="text-accent print-accent" />
                      <p className="text-white/40 text-[10px] uppercase tracking-wider print-label">Patterns identified</p>
                    </div>
                    <ul className="space-y-2">
                      {report.ai.topPatterns.map((p, i) => (
                        <li key={i} className="flex gap-2 text-sm text-white/70 print-ink leading-snug">
                          <span className="text-accent print-accent shrink-0 leading-snug">{i + 1}.</span>{p}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {report.ai.recommendations.length > 0 && (
                  <Card className="print-card">
                    <div className="flex items-center gap-1.5 mb-3">
                      <CheckIcon size={13} className="text-[#3FBE6F]" />
                      <p className="text-white/40 text-[10px] uppercase tracking-wider print-label">Suggestions to explore</p>
                    </div>
                    <ul className="space-y-2">
                      {report.ai.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2 text-sm text-white/70 print-ink leading-snug">
                          <CheckIcon size={13} className="text-[#3FBE6F] shrink-0 mt-0.5" />{r}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}

            {/* Recent log highlights */}
            {report.recentLogs.length > 0 && (
              <Card className="print-card print-keep">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-3 print-label">Recent log highlights</p>
                <div className="divide-y divide-white/[0.06] print-rule">
                  {report.recentLogs.map((l, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 first:pt-0 last:pb-0">
                      <p className="num text-white/35 text-xs w-14 shrink-0 print-faint">{l.date}</p>
                      <p className="text-sm text-white/60 flex-1 truncate print-muted">{l.content}</p>
                      {l.score > 0 && (
                        <Badge variant={l.score >= 7 ? 'green' : l.score >= 4 ? 'amber' : 'red'}>{l.score}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Encouragement */}
            {report.ai.encouragement && (
              <Card className="print-card print-keep border-accent/20 bg-[#4ADE80]/5 print-band">
                <div className="flex gap-2.5">
                  <SparkleIcon size={16} className="text-accent print-accent shrink-0 mt-0.5" />
                  <p className="text-sm text-white/70 leading-relaxed print-ink">{report.ai.encouragement}</p>
                </div>
              </Card>
            )}

            {/* Disclaimer */}
            <p className="text-white/25 text-[11px] leading-relaxed text-center mt-3 print-faint">
              This report summarizes self-reported data from a consumer health tracking app. It is for informational purposes only and is not a medical document or a diagnosis. Always consult a qualified healthcare professional for medical advice.
            </p>
          </div>

          {/* Actions */}
          <div className="px-5 md:px-6 max-w-3xl mx-auto flex gap-3 mb-6 no-print">
            <Button onClick={printReport} variant="outline" className="flex-1">Print / Save PDF</Button>
            <Button onClick={generate} loading={generating} variant="outline" className="flex-1">Regenerate</Button>
          </div>
        </>
      )}
    </div>
  )
}
