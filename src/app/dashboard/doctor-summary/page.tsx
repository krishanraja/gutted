'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'

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
        <h1 className="text-2xl font-bold">Doctor Visit Summary</h1>
        <p className="text-white/40 text-sm mt-1">A shareable summary for your healthcare provider</p>
      </div>

      {!limits.pdfReports ? (
        <div className="px-6">
          <Card className="text-center py-10">
            <div className="text-4xl mb-4">🏥</div>
            <p className="font-semibold mb-2">Unlock doctor visit summaries</p>
            <p className="text-white/40 text-sm mb-6">Upgrade to Pro to generate shareable summaries for your doctor with your symptoms, patterns, and test results.</p>
            <Link href="/dashboard/settings" className="text-[#4ADE80] text-sm font-medium hover:underline">Upgrade to Pro →</Link>
          </Card>
        </div>
      ) : !summary ? (
        <div className="px-6">
          <Card className="text-center py-10">
            <div className="text-4xl mb-4">🏥</div>
            <p className="font-semibold mb-2">Prepare for your doctor visit</p>
            <p className="text-white/40 text-sm mb-6">Generate a clinical-friendly summary of the last 30 days to share with your healthcare provider.</p>
            <Button onClick={generate} loading={generating}>Generate summary</Button>
          </Card>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </div>
      ) : (
        <div className="px-6 space-y-4 mb-6">
          {/* Header */}
          <Card glow>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide">Doctor visit summary</p>
                <p className="font-semibold mt-1">{summary.patientName}</p>
                <p className="text-white/40 text-sm">{summary.period}</p>
              </div>
              <Badge variant="teal">Pro</Badge>
            </div>
            <div className="flex gap-4 mt-3">
              <div><span className="text-white/40 text-xs">Avg Score</span><p className="font-semibold text-[#4ADE80]">{summary.avgScore}/10</p></div>
              <div><span className="text-white/40 text-xs">Logs</span><p className="font-semibold">{summary.totalLogs}</p></div>
            </div>
          </Card>

          {/* Patient summary */}
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Overview</p>
            <p className="text-white/70 text-sm leading-relaxed">{summary.patientSummary}</p>
          </Card>

          {/* Key symptoms */}
          {summary.keySymptoms.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Key symptoms reported</p>
              <ul className="space-y-1.5">
                {summary.keySymptoms.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/70"><span className="text-amber-400">•</span>{s}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Test results */}
          {summary.testResults.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Relevant test findings</p>
              <ul className="space-y-1.5">
                {summary.testResults.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/70"><span className="text-[#00B4B4]">🔬</span>{t}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Score history */}
          {summary.scoreHistory && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Score trends</p>
              <p className="text-white/70 text-sm leading-relaxed">{summary.scoreHistory}</p>
            </Card>
          )}

          {/* Dietary notes */}
          {summary.dietaryNotes.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Dietary patterns noted</p>
              <ul className="space-y-1.5">
                {summary.dietaryNotes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/70"><span className="text-[#4ADE80]">🥗</span>{n}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Questions for doctor */}
          {summary.questionsForDoctor.length > 0 && (
            <Card className="border-[#00B4B4]/20 bg-[#00B4B4]/5">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Suggested questions for your doctor</p>
              <ul className="space-y-2">
                {summary.questionsForDoctor.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/70"><span className="text-[#00B4B4]">❓</span>{q}</li>
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

      <Navigation />
    </div>
  )
}
