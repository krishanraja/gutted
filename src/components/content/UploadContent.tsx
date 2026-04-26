'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DocumentUploader } from '@/components/DocumentUploader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getPlanLimits } from '@/lib/plan-limits'
import { useToast } from '@/components/ToastProvider'
import { FileTextIcon, CheckIcon, AlertIcon, ArrowRightIcon } from '@/components/icons'

type DocType = 'gut_test' | 'doctor_report' | 'food_label'

interface AnalysisResult {
  summary: string
  biomarkers?: Record<string, string>
  recommendations: string[]
  gutFriendlyRating?: number
  flags?: string[]
  fileUrl?: string
  fileName?: string
}

export function UploadContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeType, setActiveType] = useState<DocType>('gut_test')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [plan, setPlan] = useState('free')
  const [monthUploadCount, setMonthUploadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  const limits = getPlanLimits(plan)
  const atLimit = monthUploadCount >= limits.maxUploadsPerMonth

  useEffect(() => {
    const loadContext = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from('profiles').select('plan').eq('id', user.id).single(),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('uploaded_at', monthStart.toISOString()),
      ])
      setPlan(profile?.plan || 'free')
      setMonthUploadCount(count || 0)
    }
    loadContext()
  }, [router])

  const save = async () => {
    if (!result || !userId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('documents').insert({
      user_id: userId,
      type: activeType,
      file_url: result.fileUrl,
      file_name: result.fileName || 'untitled',
      ai_interpretation: result.summary,
      biomarkers: result.biomarkers || {},
      recommendations: result.recommendations,
    })
    toast('Document saved to profile.', 'success')
    router.push('/dashboard')
  }

  const docTypes: { type: DocType; label: string }[] = [
    { type: 'gut_test', label: 'Gut test' },
    { type: 'doctor_report', label: "Doctor's report" },
    { type: 'food_label', label: 'Food label' },
  ]

  const ratingColor = (() => {
    const r = result?.gutFriendlyRating ?? 0
    return r >= 7 ? '#3FBE6F' : r >= 4 ? '#E8AE1E' : '#E96363'
  })()

  return (
    <div className="bg-black">
      <div className="px-5 md:px-6 pt-2 pb-3">
        <p className="text-white/45 text-sm">Upload any health document or food label for instant AI analysis.</p>
      </div>

      {/* Type selector */}
      <div className="px-5 md:px-6 mb-4">
        <div className="flex gap-2">
          {docTypes.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => { setActiveType(type); setResult(null); setError('') }}
              className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                activeType === type
                  ? 'border-accent bg-accent/[0.08] text-white'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/15 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Uploader */}
      <div className="px-5 md:px-6 mb-4">
        {atLimit ? (
          <Card className="text-center py-8">
            <FileTextIcon size={24} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-1">Upload limit reached</p>
            <p className="text-white/55 text-sm mb-3">Free plan includes <span className="num">{limits.maxUploadsPerMonth}</span> upload per month. Upgrade for more.</p>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade now <ArrowRightIcon size={14} /></Link>
          </Card>
        ) : (
          <DocumentUploader
            type={activeType}
            onAnalysed={r => { setResult(r); setError('') }}
            onError={setError}
          />
        )}
      </div>

      {error && <p className="px-5 md:px-6 text-[#E96363] text-sm mb-4">{error}</p>}

      {/* Results */}
      {result && (
        <div className="px-5 md:px-6 space-y-3 mb-6">
          <Card>
            <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">AI interpretation</p>
            <p className="text-white/80 text-sm leading-relaxed">{result.summary}</p>
          </Card>

          {result.biomarkers && Object.keys(result.biomarkers).length > 0 && (
            <Card>
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Key findings</p>
              <div className="space-y-2.5">
                {Object.entries(result.biomarkers).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-[11px] uppercase tracking-wider text-accent font-medium">{k}</span>
                    <span className="text-sm text-white/75">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.gutFriendlyRating && (
            <Card>
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Gut friendliness</p>
              <div className="flex items-center gap-3">
                <div className="num text-3xl font-semibold tracking-tight" style={{ color: ratingColor }}>
                  {result.gutFriendlyRating}<span className="text-lg text-white/35">/10</span>
                </div>
                <p className="text-sm text-white/55">
                  {result.gutFriendlyRating >= 7 ? 'Great choice for your gut.' : result.gutFriendlyRating >= 4 ? 'Moderate. Okay occasionally.' : 'Consider a gut-friendlier alternative.'}
                </p>
              </div>
            </Card>
          )}

          {result.recommendations?.length > 0 && (
            <Card>
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Recommendations</p>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/75">
                    <CheckIcon size={14} className="text-[#3FBE6F] mt-0.5 shrink-0" />{r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {result.flags && result.flags.length > 0 && (
            <div className="rounded-xl bg-[#E8AE1E]/8 border border-[#E8AE1E]/25 p-4">
              <p className="text-[#E8AE1E] text-[11px] uppercase tracking-wider mb-2">Worth noting</p>
              <div className="space-y-1.5">
                {result.flags.map((f, i) => (
                  <p key={i} className="text-[#E8AE1E]/85 text-sm inline-flex gap-2">
                    <AlertIcon size={14} className="shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={save} loading={saving} className="flex-1">Save to profile</Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/meal-plan')} className="flex-1">Generate meal plan</Button>
          </div>
        </div>
      )}
    </div>
  )
}
