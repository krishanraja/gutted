'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'
import { FileTextIcon, ArrowRightIcon, CheckIcon, AlertIcon } from '@/components/icons'

interface DoctorSummary {
  patientSummary: string; keySymptoms: string[]; testResults: string[]
  scoreHistory: string; dietaryNotes: string[]; questionsForDoctor: string[]
  disclaimer: string; generatedAt: string; patientName: string
  period: string; avgScore: number; totalLogs: number
}

export default function DoctorSummaryPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<DoctorSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [plan, setPlan] = useState('free')
  const [error, setError] = useState('')

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
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-5 pt-safe pb-5 md:px-6 md:pt-10">
        <button onClick={() => router.back()} className="text-white/45 text-sm mb-4 inline-flex items-center gap-1 pt-3 md:pt-0 hover:text-white transition-colors">
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-xl md:text-2xl font-medium tracking-tight">Doctor visit summary</h1>
        <p className="text-white/45 text-sm mt-1">A shareable summary for your healthcare provider.</p>
      </div>

      {!limits.pdfReports ? (
        <div className="px-5 md:px-6">
          <Card className="text-center py-10">
            <FileTextIcon size={28} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-2">Unlock doctor visit summaries</p>
            <p className="text-white/55 text-sm mb-6">Upgrade to Pro to generate shareable summaries for your doctor with your symptoms, patterns, and test results.</p>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade to Pro <ArrowRightIcon size={14} /></Link>
          </Card>
        </div>
      ) : !summary ? (
        <div className="px-5 md:px-6">
          <Card className="text-center py-10">
            <FileTextIcon size={28} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-2">Prepare for your doctor visit</p>
            <p className="text-white/55 text-sm mb-6">Generate a clinical-friendly summary of the last 30 days to share with your healthcare provider.</p>
            <Button onClick={generate} loading={generating}>Generate summary</Button>
          </Card>
          {error && <p className="text-[#E96363] text-sm mt-4 text-center">{error}</p>}
        </div>
      ) : (
        <div className="px-5 md:px-6 space-y-3 mb-6">
          {/* Header */}
          <Card>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white/40 text-[11px] uppercase tracking-wider">Doctor visit summary</p>
                <p className="font-medium tracking-tight mt-1">{summary.patientName}</p>
                <p className="text-white/45 text-sm">{summary.period}</p>
              </div>
              <Badge variant="teal">Pro</Badge>
            </div>
            <div className="flex gap-6 mt-3">
              <div>
                <span className="text-white/45 text-[11px] uppercase tracking-wider">Avg score</span>
                <p className="num font-medium text-accent">{summary.avgScore}/10</p>
              </div>
              <div>
                <span className="text-white/45 text-[11px] uppercase tracking-wider">Logs</span>
                <p className="num font-medium">{summary.totalLogs}</p>
              </div>
            </div>
          </Card>

          {/* Patient summary */}
          <Card>
            <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Overview</p>
            <p className="text-white/75 text-sm leading-relaxed">{summary.patientSummary}</p>
          </Card>

          {/* Key symptoms */}
          {summary.keySymptoms.length > 0 && (
            <Card>
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Key symptoms reported</p>
              <ul className="space-y-1.5">
                {summary.keySymptoms.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/75">
                    <AlertIcon size={12} className="text-[#E8AE1E] shrink-0 mt-1" />{s}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Test results */}
          {summary.testResults.length > 0 && (
            <Card>
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Relevant test findings</p>
              <ul className="space-y-1.5">
                {summary.testResults.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/75">
                    <span className="text-accent mt-0.5">•</span>{t}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Score history */}
          {summary.scoreHistory && (
            <Card>
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Score trends</p>
              <p className="text-white/75 text-sm leading-relaxed">{summary.scoreHistory}</p>
            </Card>
          )}

          {/* Dietary notes */}
          {summary.dietaryNotes.length > 0 && (
            <Card>
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Dietary patterns noted</p>
              <ul className="space-y-1.5">
                {summary.dietaryNotes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/75">
                    <CheckIcon size={12} className="text-[#3FBE6F] shrink-0 mt-1" />{n}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Questions for doctor */}
          {summary.questionsForDoctor.length > 0 && (
            <Card className="border-accent/30">
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Suggested questions for your doctor</p>
              <ul className="space-y-2">
                {summary.questionsForDoctor.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/75">
                    <span className="text-accent mt-0.5">?</span>{q}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="bg-white/5">
            <p className="text-white/30 text-xs leading-relaxed">{summary.disclaimer}</p>
          </Card>

          <div className="flex gap-3">
            <Button onClick={() => window.print()} variant="outline" className="flex-1">Print / Save PDF</Button>
            <Button onClick={generate} loading={generating} variant="outline" className="flex-1">Regenerate</Button>
          </div>
        </div>
      )}
    </div>
  )
}
