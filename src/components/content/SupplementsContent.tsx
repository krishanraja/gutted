'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'

interface Probiotic { strain: string; benefit: string; evidence: string; dosage: string }
interface Supplement { name: string; benefit: string; evidence: string; dosage: string; timing: string }
interface DietaryFood { food: string; benefit: string }
interface Recommendations { probiotics: Probiotic[]; supplements: Supplement[]; dietaryFoods: DietaryFood[]; cautions: string[]; disclaimer: string }

export function SupplementsContent() {
  const router = useRouter()
  const [recs, setRecs] = useState<Recommendations | null>(null)
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
      const res = await fetch('/api/supplements', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRecs(data)
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to generate recommendations')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return (
    <div className="bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="bg-black">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Supplements</h1>
        <p className="text-white/40 text-sm mt-1">Personalised supplement and probiotic recommendations</p>
      </div>

      {!limits.pdfReports ? (
        <div className="px-6">
          <Card className="text-center py-10">
            <div className="text-4xl mb-4">💊</div>
            <p className="font-semibold mb-2">Unlock supplement recommendations</p>
            <p className="text-white/40 text-sm mb-6">Upgrade to Pro for AI-powered, personalised supplement and probiotic recommendations based on your health data.</p>
            <Link href="/dashboard/settings" className="text-[#4ADE80] text-sm font-medium hover:underline">Upgrade to Pro →</Link>
          </Card>
        </div>
      ) : !recs ? (
        <div className="px-6">
          <Card className="text-center py-10">
            <div className="text-4xl mb-4">💊</div>
            <p className="font-semibold mb-2">Get personalised recommendations</p>
            <p className="text-white/40 text-sm mb-6">Based on your logs, test results, and gut profile, we'll recommend specific probiotics and supplements.</p>
            <Button onClick={generate} loading={generating}>Generate recommendations</Button>
          </Card>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </div>
      ) : (
        <div className="px-6 space-y-4 mb-6">
          {/* Probiotics */}
          {recs.probiotics.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Recommended probiotics</p>
              <div className="space-y-4">
                {recs.probiotics.map((p, i) => (
                  <div key={i} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#4ADE80]">🦠</span>
                      <p className="font-medium text-sm">{p.strain}</p>
                    </div>
                    <p className="text-white/60 text-sm mb-1">{p.benefit}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-white/30">Dosage: {p.dosage}</span>
                      <Badge variant="neutral">{p.evidence}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Supplements */}
          {recs.supplements.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Recommended supplements</p>
              <div className="space-y-4">
                {recs.supplements.map((s, i) => (
                  <div key={i} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#00B4B4]">💊</span>
                      <p className="font-medium text-sm">{s.name}</p>
                    </div>
                    <p className="text-white/60 text-sm mb-1">{s.benefit}</p>
                    <div className="flex gap-3 text-xs text-white/30">
                      <span>Dosage: {s.dosage}</span>
                      <span>Timing: {s.timing}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Dietary foods */}
          {recs.dietaryFoods.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Natural food sources</p>
              <div className="space-y-2">
                {recs.dietaryFoods.map((f, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="text-[#4ADE80] shrink-0">🥬</span>
                    <div>
                      <span className="text-white/80 font-medium">{f.food}</span>
                      <span className="text-white/50"> - {f.benefit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Cautions */}
          {recs.cautions.length > 0 && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <p className="text-amber-400 text-xs uppercase tracking-wide mb-2">Cautions</p>
              {recs.cautions.map((c, i) => (
                <p key={i} className="text-amber-300/70 text-sm">⚠️ {c}</p>
              ))}
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="bg-white/5">
            <p className="text-white/30 text-xs leading-relaxed">{recs.disclaimer}</p>
          </Card>

          <Button onClick={generate} loading={generating} variant="outline" className="w-full">Regenerate</Button>
        </div>
      )}
    </div>
  )
}
