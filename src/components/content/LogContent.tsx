'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getPlanLimits } from '@/lib/plan-limits'
import { useToast } from '@/components/ToastProvider'
import { haptic } from '@/lib/haptics'
import { MicIcon, PencilIcon, FileTextIcon, CheckIcon, AlertIcon, BulbIcon, ArrowRightIcon } from '@/components/icons'

const quickTags = ['Bloated', 'Cramps', 'Irregular', 'Fatigue', 'Feeling good', 'Heartburn', 'Nausea', 'Well hydrated']

interface Analysis {
  gutScore: number
  summary: string
  insights: string[]
  recommendations: string[]
  flagged: boolean
}

type Phase = 'input' | 'processing' | 'results'

export function LogContent({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [transcript, setTranscript] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'voice' | 'text' | 'photo'>('voice')
  const [photoAnalysing, setPhotoAnalysing] = useState(false)
  const [photoResult, setPhotoResult] = useState<{ mealName: string; foods: { name: string; portion: string; gutImpact: string; note: string }[]; overallGutRating: number; logEntry: string; tips: string[]; photoUrl: string } | null>(null)
  const [tagsChanged, setTagsChanged] = useState(false)
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null)
  const [recentLogs, setRecentLogs] = useState<{ content: string; gut_score: number }[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('free')
  const [todayLogCount, setTodayLogCount] = useState(0)
  const [phase, setPhase] = useState<Phase>('input')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const limits = getPlanLimits(plan)
  const atLimit = todayLogCount >= limits.maxLogsPerDay

  useEffect(() => {
    const loadContext = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [{ data: profile }, { data: logs }, { count }] = await Promise.all([
        supabase.from('profiles').select('gut_profile, plan').eq('id', user.id).single(),
        supabase.from('logs').select('content, gut_score').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(5),
        supabase.from('logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStart.toISOString()),
      ])
      setPlan(profile?.plan || 'free')
      setUserProfile(profile?.gut_profile || null)
      setRecentLogs(logs || [])
      setTodayLogCount(count || 0)
    }
    loadContext()
  }, [router])

  const toggleTag = (tag: string) => {
    haptic.light()
    setTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])
    if (analysis) setTagsChanged(true)
  }

  const handleTranscription = (text: string) => {
    setTranscript(text)
    analyseText(text)
  }

  const analyseText = async (text: string) => {
    if (!text.trim()) return
    setPhase('processing')
    haptic.medium()
    setError('')
    try {
      const res = await fetch('/api/analyse-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text + (tags.length ? ` Tags: ${tags.join(', ')}` : ''),
          userProfile,
          recentLogs,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalysis(data)
      setPhase('results')
    } catch (e: unknown) {
      setError((e as Error).message || 'Analysis failed')
      setPhase('input')
    } finally {
      setTagsChanged(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    setPhotoAnalysing(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/analyse-photo', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPhotoResult(data)
      setTranscript(data.logEntry)
      analyseText(data.logEntry)
    } catch (err: unknown) {
      setError((err as Error).message || 'Photo analysis failed')
    } finally {
      setPhotoAnalysing(false)
    }
  }

  const save = async () => {
    if (!transcript.trim() || !userId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('logs').insert({
      user_id: userId,
      type: mode,
      content: transcript,
      gut_score: analysis?.gutScore || 0,
      ai_analysis: analysis,
    })
    haptic.success()
    toast('Log saved successfully', 'success')
    if (embedded) {
      setPhase('input')
      setTranscript('')
      setTags([])
      setAnalysis(null)
    } else {
      router.push('/dashboard')
    }
  }

  const toggleSection = (section: string) => {
    haptic.tap()
    setExpandedSection(expandedSection === section ? null : section)
  }

  const photoUpgradePrompt = (
    <div className="text-center py-8 bg-white/[0.04] border border-white/[0.08] rounded-xl">
      <FileTextIcon size={24} className="mx-auto text-white/35 mb-2" />
      <p className="font-medium mb-1">Photo logging is a Pro feature</p>
      <p className="text-white/55 text-sm mb-3">Snap a photo of your meal. We&apos;ll identify the foods and log them.</p>
      <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade to Pro <ArrowRightIcon size={14} /></Link>
    </div>
  )

  const photoUploadUI = (
    <div>
      <label className="block w-full cursor-pointer">
        <div className="border border-dashed border-white/15 rounded-xl p-8 text-center hover:border-accent-50 hover:bg-white/[0.02] transition-colors">
          {photoAnalysing ? (
            <>
              <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-white/55 text-sm">Analysing your meal…</p>
            </>
          ) : photoResult ? (
            <>
              <CheckIcon size={22} className="mx-auto text-[#3FBE6F] mb-2" />
              <p className="text-white/75 text-sm">{photoResult.mealName}</p>
            </>
          ) : (
            <>
              <FileTextIcon size={28} className="mx-auto text-white/40 mb-2" />
              <p className="text-white/55 text-sm">Tap to take a photo or choose from gallery.</p>
            </>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            handlePhotoUpload(file)
          }}
        />
      </label>
      {photoResult && (
        <div className="mt-4 space-y-3">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
            <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Foods identified</p>
            <div className="space-y-2">
              {photoResult.foods.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {f.gutImpact === 'positive' ? <CheckIcon size={12} className="text-[#3FBE6F]" /> : f.gutImpact === 'negative' ? <AlertIcon size={12} className="text-[#E96363]" /> : <span className="text-white/40">•</span>}
                    <span className="text-white/75">{f.name}</span>
                    <span className="num text-white/35 text-xs">{f.portion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {photoResult.tips.length > 0 && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Tips</p>
              <div className="space-y-1.5">
                {photoResult.tips.map((t, i) => (
                  <p key={i} className="text-sm text-white/65 flex gap-2">
                    <BulbIcon size={14} className="text-[#E8AE1E] shrink-0 mt-0.5" />{t}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const modeToggle = (maxWidth: string = 'max-w-sm') => (
    <div className={`flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 ${maxWidth}`}>
      {([['voice', 'Voice', MicIcon], ['text', 'Text', PencilIcon], ['photo', 'Photo', FileTextIcon]] as const).map(([m, label, ModeIcon]) => (
        <button
          key={m}
          onClick={() => { setMode(m as 'voice' | 'text' | 'photo'); setPhotoResult(null) }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5 ${mode === m ? 'bg-white/[0.06] text-white' : 'text-white/45 hover:text-white/65'}`}
        >
          <ModeIcon size={14} />
          {label}
        </button>
      ))}
    </div>
  )

  const photoContent = plan === 'free' ? photoUpgradePrompt : photoUploadUI

  return (
    <>
      {/* Mobile: viewport-locked phase-based flow */}
      <div className={embedded ? "flex flex-col h-full md:hidden" : "mobile-viewport md:hidden"}>
        {/* Header -- only shown in standalone mode */}
        {!embedded && (
          <div className="flex-none px-5 pt-safe pb-3 animate-fade-in">
            <button onClick={() => phase === 'results' ? setPhase('input') : router.back()} className="text-white/45 text-sm mb-2 inline-flex items-center gap-1 pt-3 hover:text-white transition-colors">
              <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              {phase === 'results' ? 'Edit' : 'Back'}
            </button>
            <h1 className="text-xl font-medium tracking-tight">
              {phase === 'results' ? 'Your gut analysis' : 'How’s your gut today?'}
            </h1>
          </div>
        )}

        {/* Phase: Input */}
        {phase === 'input' && (
          <div className="flex-1 flex flex-col px-5 pb-nav min-h-0 animate-fade-in">
            {/* Mode toggle */}
            <div className="flex-none mb-4">
              {modeToggle('max-w-sm')}
            </div>

            {/* Input area */}
            <div className="flex-1 flex flex-col justify-center">
              {mode === 'photo' ? (
                photoContent
              ) : mode === 'voice' ? (
                <VoiceRecorder onTranscription={handleTranscription} onError={setError} />
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder="How is your gut feeling today? Describe any symptoms, what you ate, your energy levels…"
                    rows={4}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-accent-50 resize-none transition-colors"
                  />
                  <Button onClick={() => analyseText(transcript)} variant="outline" className="w-full" disabled={!transcript.trim()}>
                    Analyse
                  </Button>
                </div>
              )}

              {mode === 'voice' && transcript && (
                <div className="mt-4">
                  <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Transcription</p>
                  <textarea
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent-50 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Quick tags -- horizontal scroll strip */}
            <div className="flex-none mt-4">
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Quick tags</p>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {quickTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`shrink-0 px-3 py-1.5 rounded-md border text-sm transition-all ${
                      tags.includes(tag) ? 'border-accent bg-accent/[0.08] text-white' : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:text-white/80 hover:border-white/15'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {tagsChanged && transcript && (
                <Button onClick={() => analyseText(transcript)} variant="outline" size="sm" className="mt-2 w-full">
                  Re-analyse with updated tags
                </Button>
              )}
            </div>

            {error && (
              <div className="flex-none mt-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Phase: Processing */}
        {phase === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 animate-scale-in">
            <div className="w-12 h-12 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
            <p className="text-white/55 text-sm mb-1">Analysing your gut health…</p>
            <div className="w-44 h-1 rounded-full mt-3 animate-shimmer" />
            <button
              onClick={() => setPhase('input')}
              className="text-white/35 text-xs mt-6 hover:text-white/55 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Phase: Results */}
        {phase === 'results' && analysis && (
          <div className="flex-1 flex flex-col px-5 pb-nav min-h-0 overflow-y-auto animate-scale-in">
            {/* Score card */}
            <Card className="flex-none flex items-center gap-4 mb-3">
              <GutScore score={analysis.gutScore} size="lg" />
              <div>
                <p className="text-white/40 text-[11px] uppercase tracking-wider mb-1">Gut score for this log</p>
                <p className="text-sm text-white/80">{analysis.summary}</p>
              </div>
            </Card>

            {/* Collapsible insights */}
            {analysis.insights.length > 0 && (
              <Card className="flex-none mb-3">
                <button onClick={() => toggleSection('insights')} className="w-full flex items-center justify-between">
                  <p className="text-white/40 text-[11px] uppercase tracking-wider">Insights</p>
                  <svg className={`w-4 h-4 text-white/35 transition-transform ${expandedSection === 'insights' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                {expandedSection === 'insights' && (
                  <ul className="space-y-2 mt-3 animate-fade-up">
                    {analysis.insights.map((insight, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white/75">
                        <span className="text-accent mt-0.5">•</span>{insight}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {/* Collapsible recommendations */}
            {analysis.recommendations.length > 0 && (
              <Card className="flex-none mb-3">
                <button onClick={() => toggleSection('recommendations')} className="w-full flex items-center justify-between">
                  <p className="text-white/40 text-[11px] uppercase tracking-wider">Recommendations</p>
                  <svg className={`w-4 h-4 text-white/35 transition-transform ${expandedSection === 'recommendations' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                {expandedSection === 'recommendations' && (
                  <ul className="space-y-2 mt-3 animate-fade-up">
                    {analysis.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white/75">
                        <ArrowRightIcon size={12} className="text-accent shrink-0 mt-1" />{rec}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {/* Flagged warning */}
            {analysis.flagged && (
              <div className="flex-none flex items-start gap-2 mb-3 px-1">
                <AlertIcon size={14} className="text-[#E8AE1E] shrink-0 mt-0.5" />
                <p className="text-[#E8AE1E] text-xs">Some symptoms may benefit from a chat with your doctor.</p>
              </div>
            )}
          </div>
        )}

        {/* Save button -- anchored at bottom for results phase */}
        {phase === 'results' && transcript && (
          <div className="flex-none px-5 pb-nav">
            {atLimit ? (
              <Card className="text-center">
                <p className="font-medium text-sm mb-1">Daily log limit reached</p>
                <p className="text-white/55 text-xs mb-2">Free plan includes <span className="num">{limits.maxLogsPerDay}</span> logs per day.</p>
                <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-xs font-medium hover:text-white transition-colors">Upgrade now <ArrowRightIcon size={12} /></Link>
              </Card>
            ) : (
              <Button onClick={save} loading={saving} className="w-full" size="lg">Save log</Button>
            )}
          </div>
        )}
      </div>

      {/* Desktop: original layout */}
      <div className="hidden md:block bg-black">
        <div className="px-6 pt-10 pb-6">
          <button onClick={() => router.back()} className="text-white/45 text-sm mb-4 inline-flex items-center gap-1 hover:text-white transition-colors">
            <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="text-2xl font-medium tracking-tight">How&apos;s your gut today?</h1>
          <p className="text-white/45 text-sm mt-1">Voice-log or type how you&apos;re feeling.</p>
        </div>

        <div className="px-6 mb-6">
          {modeToggle('max-w-sm')}
        </div>

        <div className="px-6 mb-6">
          {mode === 'photo' ? (
            photoContent
          ) : mode === 'voice' ? (
            <VoiceRecorder onTranscription={handleTranscription} onError={setError} />
          ) : (
            <div className="space-y-3">
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="How is your gut feeling today? Describe any symptoms, what you ate, your energy levels…"
                rows={5}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-accent-50 resize-none transition-colors"
              />
              <Button onClick={() => analyseText(transcript)} loading={phase === 'processing'} variant="outline" className="w-full" disabled={!transcript.trim()}>
                Analyse
              </Button>
            </div>
          )}

          {mode === 'voice' && transcript && (
            <div className="mt-4">
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Transcription</p>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent-50 resize-none"
              />
            </div>
          )}
        </div>

        <div className="px-6 mb-6">
          <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Quick tags</p>
          <div className="flex flex-wrap gap-2">
            {quickTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-md border text-sm transition-all ${
                  tags.includes(tag) ? 'border-accent bg-accent/[0.08] text-white' : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:text-white/80 hover:border-white/15'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {tagsChanged && transcript && (
            <Button onClick={() => analyseText(transcript)} loading={phase === 'processing'} variant="outline" size="sm" className="mt-3">
              Re-analyse with updated tags
            </Button>
          )}
        </div>

        {error && (
          <div className="px-6 mb-4">
            <p className="text-[#E96363] text-sm">{error}</p>
          </div>
        )}

        {phase === 'processing' && (
          <div className="px-6 mb-6">
            <Card className="text-center py-6">
              <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-3"/>
              <p className="text-white/55 text-sm">Analysing your gut health…</p>
            </Card>
          </div>
        )}

        {analysis && phase === 'results' && (
          <div className="px-6 mb-6 space-y-3 animate-fade-up">
            <Card className="flex items-center gap-4">
              <GutScore score={analysis.gutScore} size="lg" />
              <div>
                <p className="text-white/40 text-[11px] uppercase tracking-wider mb-1">Gut score for this log</p>
                <p className="text-sm text-white/80">{analysis.summary}</p>
              </div>
            </Card>
            {analysis.insights.length > 0 && (
              <Card>
                <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Insights</p>
                <ul className="space-y-2">
                  {analysis.insights.map((insight, i) => (
                    <li key={i} className="flex gap-2 text-sm text-white/75">
                      <span className="text-accent mt-0.5">•</span>{insight}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {analysis.flagged && (
              <div className="rounded-xl bg-[#E8AE1E]/8 border border-[#E8AE1E]/25 p-4">
                <p className="text-[#E8AE1E] text-sm inline-flex items-start gap-2">
                  <AlertIcon size={14} className="shrink-0 mt-0.5" />
                  <span>Some symptoms you mentioned may benefit from a chat with your doctor.</span>
                </p>
              </div>
            )}
          </div>
        )}

        {transcript && (
          <div className="px-6 pb-4">
            {atLimit ? (
              <Card className="text-center">
                <p className="font-medium mb-1">Daily log limit reached</p>
                <p className="text-white/55 text-sm mb-3">Free plan includes <span className="num">{limits.maxLogsPerDay}</span> logs per day. Upgrade for unlimited logging.</p>
                <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade now <ArrowRightIcon size={14} /></Link>
              </Card>
            ) : (
              <Button onClick={save} loading={saving} className="w-full" size="lg">Save log</Button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
