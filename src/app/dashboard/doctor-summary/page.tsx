'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'
import { FileTextIcon, ArrowRightIcon, CheckIcon, AlertIcon, ShareIcon } from '@/components/icons'

interface DoctorSummary {
  patientSummary: string; keySymptoms: string[]; testResults: string[]
  scoreHistory: string; dietaryNotes: string[]; questionsForDoctor: string[]
  disclaimer: string; generatedAt: string; patientName: string
  period: string; avgScore: number; totalLogs: number
}

interface ActiveShare { id: string; practitioner_name: string | null; practitioner_email: string }

function scoreColor(v: number) {
  return v >= 7 ? '#3FBE6F' : v >= 4 ? '#E8AE1E' : '#E96363'
}

// Compact 0-10 gauge so a clinician reads the headline status instantly without
// parsing a number. Renders clean on the dark skin and on printed paper.
function ScoreGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(10, value)) / 10
  const c = scoreColor(value)
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1">
        <span className="num text-2xl font-semibold tracking-tight print-ink" style={{ color: c }}>{value}<span className="text-sm text-white/35 print-faint font-normal">/10</span></span>
        <span className="text-white/35 text-[10px] uppercase tracking-wider print-faint">Self-reported avg</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden print-track">
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: c }} />
      </div>
    </div>
  )
}

export default function DoctorSummaryPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<DoctorSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState('free')
  const [error, setError] = useState('')
  const [shares, setShares] = useState<ActiveShare[]>([])

  const limits = getPlanLimits(plan)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      const userPlan = profile?.plan || 'free'
      setPlan(userPlan)
      if (getPlanLimits(userPlan).pdfReports) {
        try {
          const res = await fetch('/api/practitioner')
          const data = await res.json()
          if (Array.isArray(data.shares)) {
            setShares(data.shares.filter((s: ActiveShare & { is_active?: boolean }) => s.is_active !== false))
          }
        } catch { /* non-blocking: share status is supplementary */ }
      }
      setLoading(false)
    }
    load()
  }, [router])

  const generate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/doctor-summary', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSummary(data.summary)
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to generate summary')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64 summary-root">
      {/* Scoped print styles. Saving as PDF yields a clean, branded white handoff:
          dark skin swapped for print-safe ink, sections kept off page breaks,
          and screen-only chrome hidden. Nothing here affects screen rendering. */}
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 14mm 14mm 16mm; }
          html, body { background: #ffffff !important; }
          body * { visibility: hidden !important; }
          .summary-sheet, .summary-sheet * { visibility: visible !important; }
          .summary-sheet {
            position: absolute; left: 0; top: 0; width: 100%;
            margin: 0 !important; padding: 0 !important;
            color: #111827 !important; background: #ffffff !important;
          }
          .no-print { display: none !important; }
          .summary-sheet .print-card {
            background: #ffffff !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            break-inside: avoid; page-break-inside: avoid;
            margin-bottom: 10px !important;
            padding: 14px 16px !important;
          }
          .summary-sheet .print-ink { color: #111827 !important; }
          .summary-sheet .print-muted { color: #4b5563 !important; }
          .summary-sheet .print-faint { color: #6b7280 !important; }
          .summary-sheet .print-label { color: #6b7280 !important; }
          .summary-sheet .print-rule { border-color: #e5e7eb !important; }
          .summary-sheet .print-accent { color: #007a7a !important; }
          .summary-sheet .print-band { background: #f3fafa !important; border-color: #cdeaea !important; }
          .summary-sheet .print-track { background: #e5e7eb !important; }
          .summary-sheet .print-stat-box { background: #f9fafb !important; border: 1px solid #e5e7eb !important; }
          .summary-sheet .print-keep { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="px-5 pt-safe pb-5 md:px-6 md:pt-10 no-print">
        <button onClick={() => router.back()} className="text-white/45 text-sm mb-4 inline-flex items-center gap-1 pt-3 md:pt-0 hover:text-white transition-colors">
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-xl md:text-2xl font-medium tracking-tight">Doctor visit summary</h1>
        <p className="text-white/45 text-sm mt-1">A one-page handoff your GP can scan in 30 seconds.</p>
      </div>

      {!limits.pdfReports ? (
        <div className="px-5 md:px-6 no-print">
          <Card className="text-center py-10">
            <FileTextIcon size={28} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-2">Unlock doctor visit summaries</p>
            <p className="text-white/55 text-sm mb-6">Upgrade to Pro to generate shareable summaries for your doctor with your symptoms, patterns, and test results.</p>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade to Pro <ArrowRightIcon size={14} /></Link>
          </Card>
        </div>
      ) : !summary ? (
        <div className="px-5 md:px-6 no-print">
          <Card className="text-center py-10">
            <FileTextIcon size={28} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-2">Prepare for your doctor visit</p>
            <p className="text-white/55 text-sm mb-6">Generate a clinician-friendly one-pager of the last 30 days. Print it, save it as a PDF, or share it through a secure practitioner link.</p>
            <Button onClick={generate} loading={generating}>Generate summary</Button>
          </Card>
          {error && <p className="text-[#E96363] text-sm mt-4 text-center">{error}</p>}
        </div>
      ) : (
        <>
          <div className="summary-sheet px-5 md:px-6 max-w-3xl mx-auto mb-6">
            {/* Handoff header: identity, period, and headline status all readable
                in a single glance. */}
            <Card className="print-card print-keep">
              <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-white/[0.08] print-rule">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold tracking-tight print-ink">gutted<span className="text-accent print-accent">.</span></span>
                    <Badge variant="teal">Pro</Badge>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight mt-2 print-ink">Doctor Visit Summary</h2>
                  <p className="text-sm text-white/55 print-muted mt-0.5">Patient: {summary.patientName}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider print-label">Period</p>
                  <p className="num text-sm font-medium print-ink mt-0.5">{summary.period}</p>
                  <p className="text-white/35 text-[11px] print-faint mt-1.5">Prepared {summary.generatedAt}</p>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-5 items-center">
                <div className="min-w-0">
                  <ScoreGauge value={summary.avgScore} />
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-2 text-center shrink-0 print-stat-box">
                  <p className="num text-2xl font-semibold tracking-tight print-ink">{summary.totalLogs}</p>
                  <p className="text-white/45 text-[10px] uppercase tracking-wider mt-0.5 print-label">Logs in period</p>
                </div>
              </div>
            </Card>

            {/* Overview: the 30-second read. */}
            <Card className="print-card print-keep">
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2 print-label">Clinical overview</p>
              <p className="text-white/80 text-sm leading-relaxed print-ink">{summary.patientSummary}</p>
              {summary.scoreHistory && (
                <p className="text-white/55 text-sm leading-relaxed mt-2.5 print-muted">{summary.scoreHistory}</p>
              )}
            </Card>

            {/* Symptoms + test findings: the two columns a GP scans first. */}
            {(summary.keySymptoms.length > 0 || summary.testResults.length > 0) && (
              <div className="grid md:grid-cols-2 gap-3 print-keep" style={{ display: 'grid' }}>
                {summary.keySymptoms.length > 0 && (
                  <Card className="print-card">
                    <div className="flex items-center gap-1.5 mb-3">
                      <AlertIcon size={13} className="text-[#E8AE1E]" />
                      <p className="text-white/40 text-[10px] uppercase tracking-wider print-label">Symptoms reported</p>
                    </div>
                    <ul className="space-y-1.5">
                      {summary.keySymptoms.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-white/75 print-ink leading-snug">
                          <AlertIcon size={12} className="text-[#E8AE1E] shrink-0 mt-1" />{s}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {summary.testResults.length > 0 && (
                  <Card className="print-card">
                    <div className="flex items-center gap-1.5 mb-3">
                      <FileTextIcon size={13} className="text-accent print-accent" />
                      <p className="text-white/40 text-[10px] uppercase tracking-wider print-label">Relevant test findings</p>
                    </div>
                    <ul className="space-y-1.5">
                      {summary.testResults.map((t, i) => (
                        <li key={i} className="flex gap-2 text-sm text-white/75 print-ink leading-snug">
                          <span className="text-accent print-accent mt-0.5 shrink-0">&bull;</span>{t}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </div>
            )}

            {/* Dietary patterns */}
            {summary.dietaryNotes.length > 0 && (
              <Card className="print-card print-keep">
                <div className="flex items-center gap-1.5 mb-3">
                  <CheckIcon size={13} className="text-[#3FBE6F]" />
                  <p className="text-white/40 text-[10px] uppercase tracking-wider print-label">Dietary patterns noted</p>
                </div>
                <ul className="grid sm:grid-cols-2 gap-x-5 gap-y-1.5">
                  {summary.dietaryNotes.map((n, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/75 print-ink leading-snug">
                      <CheckIcon size={12} className="text-[#3FBE6F] shrink-0 mt-1" />{n}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Questions for doctor: framed as the patient's agenda. */}
            {summary.questionsForDoctor.length > 0 && (
              <Card className="print-card print-keep border-accent/30 print-band">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-3 print-label">Questions the patient would like to discuss</p>
                <ul className="space-y-2">
                  {summary.questionsForDoctor.map((q, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-white/80 print-ink leading-snug">
                      <span className="num text-accent print-accent font-semibold shrink-0">{i + 1}.</span>{q}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Disclaimer */}
            <Card className="print-card print-keep bg-white/5">
              <p className="text-white/35 text-[11px] leading-relaxed print-faint">{summary.disclaimer}</p>
            </Card>
          </div>

          {/* Practitioner-share affordance: prominent, screen-only. Surfaces the
              secure-link flow and lists any active shares already in place. */}
          <div className="px-5 md:px-6 max-w-3xl mx-auto mb-4 no-print">
            <Card className="border-accent/25 bg-[#00B4B4]/[0.04]">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-accent/12 flex items-center justify-center">
                  <ShareIcon size={16} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Send this securely to your practitioner</p>
                  <p className="text-white/55 text-xs mt-1 leading-relaxed">
                    {shares.length > 0
                      ? `Read-only access is active for ${shares.length} practitioner${shares.length > 1 ? 's' : ''}. Manage links or invite another.`
                      : 'Skip the printout: give your doctor or nutritionist a secure, read-only link to your last 30 days of data.'}
                  </p>
                  {shares.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {shares.slice(0, 4).map(s => (
                        <Badge key={s.id} variant="neutral">{s.practitioner_name || s.practitioner_email}</Badge>
                      ))}
                    </div>
                  )}
                  <Link href="/dashboard/share" className="inline-flex items-center gap-1 text-accent text-sm font-medium mt-3 hover:text-white transition-colors">
                    {shares.length > 0 ? 'Manage practitioner access' : 'Share with practitioner'} <ArrowRightIcon size={14} />
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="px-5 md:px-6 max-w-3xl mx-auto flex gap-3 mb-6 no-print">
            <Button onClick={() => window.print()} variant="outline" className="flex-1">Print / Save PDF</Button>
            <Button onClick={generate} loading={generating} variant="outline" className="flex-1">Regenerate</Button>
          </div>
        </>
      )}
    </div>
  )
}
