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
    toast('Document saved to profile', 'success')
    router.push('/dashboard')
  }

  const docTypes: { type: DocType; label: string; emoji: string }[] = [
    { type: 'gut_test', label: 'Gut Test', emoji: '🧬' },
    { type: 'doctor_report', label: "Doctor's Report", emoji: '🏥' },
    { type: 'food_label', label: 'Food Label', emoji: '🍎' },
  ]

  return (
    <div className="bg-black">
      <div className="px-6 pt-2 pb-3">
        <p className="text-white/40 text-sm">Upload any health document or food label for instant AI analysis</p>
      </div>

      {/* Type selector */}
      <div className="px-6 mb-4">
        <div className="flex gap-2">
          {docTypes.map(({ type, label, emoji }) => (
            <button
              key={type}
              onClick={() => { setActiveType(type); setResult(null); setError('') }}
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                activeType === type
                  ? 'border-[#00B4B4] bg-[#00B4B4]/10 text-[#4ADE80]'
                  : 'border-white/10 text-white/40 hover:border-white/20'
              }`}
            >
              <span className="text-lg">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Uploader */}
      <div className="px-6 mb-4">
        {atLimit ? (
          <Card className="text-center py-8">
            <p className="text-2xl mb-3">📄</p>
            <p className="font-semibold mb-1">Upload limit reached</p>
            <p className="text-white/50 text-sm mb-3">Free plan includes {limits.maxUploadsPerMonth} upload per month. Upgrade for more.</p>
            <Link href="/dashboard/settings" className="text-[#4ADE80] text-sm font-medium hover:underline">Upgrade now →</Link>
          </Card>
        ) : (
          <DocumentUploader
            type={activeType}
            onAnalysed={r => { setResult(r); setError('') }}
            onError={setError}
          />
        )}
      </div>

      {error && <p className="px-6 text-red-400 text-sm mb-4">{error}</p>}

      {/* Results */}
      {result && (
        <div className="px-6 space-y-4 mb-6">
          <Card glow>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-2">AI Interpretation</p>
            <p className="text-white/80 text-sm leading-relaxed">{result.summary}</p>
          </Card>

          {result.biomarkers && Object.keys(result.biomarkers).length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Key Findings</p>
              <div className="space-y-2">
                {Object.entries(result.biomarkers).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-0.5">
                    <span className="text-xs text-[#00B4B4] font-medium">{k}</span>
                    <span className="text-sm text-white/70">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.gutFriendlyRating && (
            <Card>
              <p className="text-white/40 text-xs mb-2">Gut Friendliness</p>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold gradient-text">{result.gutFriendlyRating}/10</div>
                <p className="text-sm text-white/50">
                  {result.gutFriendlyRating >= 7 ? 'Great choice for your gut' : result.gutFriendlyRating >= 4 ? 'Moderate - okay occasionally' : 'Consider a gut-friendlier alternative'}
                </p>
              </div>
            </Card>
          )}

          {result.recommendations?.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Recommendations</p>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/70">
                    <span className="text-[#4ADE80] mt-0.5 shrink-0">✓</span>{r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {result.flags && result.flags.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <p className="text-amber-400 text-xs uppercase tracking-wide mb-2">Worth noting</p>
              {result.flags.map((f, i) => <p key={i} className="text-amber-300/70 text-sm">⚠️ {f}</p>)}
            </Card>
          )}

          <div className="flex gap-3">
            <Button onClick={save} loading={saving} className="flex-1">Save to profile</Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/meal-plan')} className="flex-1">Generate meal plan</Button>
          </div>
        </div>
      )}
    </div>
  )
}
