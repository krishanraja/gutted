'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'
import { PillIcon, AlertIcon, CheckIcon, ArrowRightIcon } from '@/components/icons'

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
      <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="bg-black">
      <div className="px-5 pt-safe pb-5 md:px-6 md:pt-10">
        <button onClick={() => router.back()} className="text-white/45 text-sm mb-4 inline-flex items-center gap-1 pt-3 md:pt-0 hover:text-white transition-colors">
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-xl md:text-2xl font-medium tracking-tight">Supplements</h1>
        <p className="text-white/45 text-sm mt-1">Personalised supplement and probiotic recommendations.</p>
      </div>

      {!limits.pdfReports ? (
        <div className="px-5 md:px-6">
          <Card className="text-center py-10">
            <PillIcon size={28} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-2">Unlock supplement recommendations</p>
            <p className="text-white/55 text-sm mb-6">Upgrade to Pro for AI-powered, personalised supplement and probiotic recommendations based on your health data.</p>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade to Pro <ArrowRightIcon size={14} /></Link>
          </Card>
        </div>
      ) : !recs ? (
        <div className="px-5 md:px-6">
          <Card className="text-center py-10">
            <PillIcon size={28} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-2">Get personalised recommendations</p>
            <p className="text-white/55 text-sm mb-6">Based on your logs, test results, and gut profile, we&apos;ll recommend specific probiotics and supplements.</p>
            <Button onClick={generate} loading={generating}>Generate recommendations</Button>
          </Card>
          {error && <p className="text-[#E96363] text-sm mt-4 text-center">{error}</p>}
        </div>
      ) : (
        <div className="px-5 md:px-6 space-y-3 mb-6">
          {/* Probiotics */}
          {recs.probiotics.length > 0 && (
            <Card>
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Recommended probiotics</p>
              <div className="space-y-3">
                {recs.probiotics.map((p, i) => (
                  <div key={i} className="hairline border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckIcon size={14} className="text-[#3FBE6F]" />
                      <p className="font-medium text-sm">{p.strain}</p>
                    </div>
                    <p className="text-white/65 text-sm mb-1">{p.benefit}</p>
                    <div className="flex gap-3 text-xs items-center">
                      <span className="text-white/40">Dosage: <span className="text-white/65 num">{p.dosage}</span></span>
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
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Recommended supplements</p>
              <div className="space-y-3">
                {recs.supplements.map((s, i) => (
                  <div key={i} className="hairline border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <PillIcon size={14} className="text-accent" />
                      <p className="font-medium text-sm">{s.name}</p>
                    </div>
                    <p className="text-white/65 text-sm mb-1">{s.benefit}</p>
                    <div className="flex gap-3 text-xs text-white/40">
                      <span>Dosage: <span className="text-white/65 num">{s.dosage}</span></span>
                      <span>Timing: <span className="text-white/65">{s.timing}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Dietary foods */}
          {recs.dietaryFoods.length > 0 && (
            <Card>
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Natural food sources</p>
              <div className="space-y-2">
                {recs.dietaryFoods.map((f, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <CheckIcon size={14} className="text-[#3FBE6F] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-white/85 font-medium">{f.food}</span>
                      <span className="text-white/55"> – {f.benefit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Cautions */}
          {recs.cautions.length > 0 && (
            <div className="rounded-xl bg-[#E8AE1E]/8 border border-[#E8AE1E]/25 p-4">
              <p className="text-[#E8AE1E] text-[11px] uppercase tracking-wider mb-2">Cautions</p>
              <div className="space-y-1.5">
                {recs.cautions.map((c, i) => (
                  <p key={i} className="text-[#E8AE1E]/85 text-sm inline-flex gap-2">
                    <AlertIcon size={14} className="shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <Card>
            <p className="text-white/40 text-xs leading-relaxed">{recs.disclaimer}</p>
          </Card>

          <Button onClick={generate} loading={generating} variant="outline" className="w-full">Regenerate</Button>
        </div>
      )}
    </div>
  )
}
