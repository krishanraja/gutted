'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { DocumentUploader } from '@/components/DocumentUploader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type DocType = 'gut_test' | 'doctor_report' | 'food_label'

interface AnalysisResult {
  summary: string
  biomarkers?: Record<string, string>
  recommendations: string[]
  gutFriendlyRating?: number
  flags?: string[]
  fileUrl?: string
}

export default function UploadPage() {
  const router = useRouter()
  const [activeType, setActiveType] = useState<DocType>('gut_test')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!result) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    await supabase.from('documents').insert({
      user_id: user.id,
      type: activeType,
      file_url: result.fileUrl,
      ai_interpretation: result.summary,
      biomarkers: result.biomarkers || {},
      recommendations: result.recommendations,
    })
    router.push('/dashboard')
  }

  const docTypes: { type: DocType; label: string; emoji: string }[] = [
    { type: 'gut_test', label: 'Gut Test', emoji: '🧬' },
    { type: 'doctor_report', label: "Doctor's Report", emoji: '🏥' },
    { type: 'food_label', label: 'Food Label', emoji: '🍎' },
  ]

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Upload & analyse</h1>
        <p className="text-white/40 text-sm mt-1">Upload any health document or food label for instant AI analysis</p>
      </div>

      {/* Type selector */}
      <div className="px-6 mb-6">
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
      <div className="px-6 mb-6">
        <DocumentUploader
          type={activeType}
          onAnalysed={r => { setResult(r); setError('') }}
          onError={setError}
        />
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

      <Navigation />
    </div>
  )
}
