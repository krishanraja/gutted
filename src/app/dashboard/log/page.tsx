'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getPlanLimits } from '@/lib/plan-limits'
import { useToast } from '@/components/ToastProvider'
import { haptic } from '@/lib/haptics'

const quickTags = ['🫧 Bloated', '😫 Cramps', '💩 Irregular', '😴 Fatigue', '✨ Feeling good', '🔥 Heartburn', '🤢 Nausea', '💧 Well hydrated']

interface Analysis {
  gutScore: number
  summary: string
  insights: string[]
  recommendations: string[]
  flagged: boolean
}

export default function LogPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [transcript, setTranscript] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [analysing, setAnalysing] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [tagsChanged, setTagsChanged] = useState(false)
  const [userProfile, setUserProfile] = useState<Record<string, unknown> | null>(null)
  const [recentLogs, setRecentLogs] = useState<{ content: string; gut_score: number }[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('free')
  const [todayLogCount, setTodayLogCount] = useState(0)

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
    setAnalysing(true)
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
    } catch (e: unknown) {
      setError((e as Error).message || 'Analysis failed')
    } finally {
      setAnalysing(false)
      setTagsChanged(false)
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
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">How's your gut today?</h1>
        <p className="text-white/40 text-sm mt-1">Voice-log or type how you're feeling</p>
      </div>

      {/* Mode toggle */}
      <div className="px-6 mb-6">
        <div className="flex bg-white/5 rounded-xl p-1 max-w-xs">
          {(['voice', 'text'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${mode === m ? 'bg-white/10 text-white' : 'text-white/40'}`}
            >
              {m === 'voice' ? '🎤 Voice' : '✏️ Text'}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-6 mb-6">
        {mode === 'voice' ? (
          <VoiceRecorder onTranscription={handleTranscription} onError={setError} />
        ) : (
          <div className="space-y-3">
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="How is your gut feeling today? Describe any symptoms, what you ate, your energy levels..."
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00B4B4]/50 resize-none transition-colors"
            />
            <Button onClick={() => analyseText(transcript)} loading={analysing} variant="outline" className="w-full" disabled={!transcript.trim()}>
              Analyse
            </Button>
          </div>
        )}

        {/* Transcript display (after voice) */}
        {mode === 'voice' && transcript && (
          <div className="mt-4">
            <p className="text-white/40 text-xs mb-2">Transcription</p>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00B4B4]/50 resize-none"
            />
          </div>
        )}
      </div>

      {/* Quick tags */}
      <div className="px-6 mb-6">
        <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Quick tags</p>
        <div className="flex flex-wrap gap-2">
          {quickTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-xl border text-sm transition-all ${
                tags.includes(tag) ? 'border-[#00B4B4] bg-[#00B4B4]/20 text-[#4ADE80]' : 'border-white/15 text-white/50 hover:border-white/30'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {tagsChanged && transcript && (
          <Button onClick={() => analyseText(transcript)} loading={analysing} variant="outline" size="sm" className="mt-3">
            Re-analyse with updated tags
          </Button>
        )}
      </div>

      {error && (
        <div className="px-6 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-white/30 text-xs mt-1">
            {error.toLowerCase().includes('microphone') || error.toLowerCase().includes('permission')
              ? 'Check your browser microphone permissions and try again.'
              : error.toLowerCase().includes('transcri') || error.toLowerCase().includes('failed')
              ? 'Try recording again or switch to text mode.'
              : 'Please try again.'}
          </p>
        </div>
      )}

      {/* Analysis results */}
      {analysing && (
        <div className="px-6 mb-6">
          <Card className="text-center py-6">
            <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin mx-auto mb-3"/>
            <p className="text-white/50 text-sm">Analysing your gut health...</p>
          </Card>
        </div>
      )}

      {analysis && !analysing && (
        <div className="px-6 mb-6 space-y-4">
          <Card glow className="flex items-center gap-4">
            <GutScore score={analysis.gutScore} size="lg" />
            <div>
              <p className="text-white/40 text-xs mb-1">Gut score for this log</p>
              <p className="text-sm text-white/80">{analysis.summary}</p>
            </div>
          </Card>
          {analysis.insights.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Insights</p>
              <ul className="space-y-2">
                {analysis.insights.map((insight, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/70">
                    <span className="text-[#4ADE80] mt-0.5">•</span>{insight}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {analysis.flagged && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <p className="text-amber-400 text-sm">⚠️ Some symptoms you mentioned may benefit from a chat with your doctor.</p>
            </Card>
          )}
        </div>
      )}

      {/* Save button */}
      {transcript && (
        <div className="px-6 pb-4">
          {atLimit ? (
            <div className="bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border border-[#00B4B4]/20 rounded-2xl p-4 text-center">
              <p className="font-semibold mb-1">Daily log limit reached</p>
              <p className="text-white/50 text-sm mb-3">Free plan includes {limits.maxLogsPerDay} logs per day. Upgrade for unlimited logging.</p>
              <Link href="/dashboard/settings" className="text-[#4ADE80] text-sm font-medium hover:underline">Upgrade now →</Link>
            </div>
          ) : (
            <Button onClick={save} loading={saving} className="w-full" size="lg">Save log</Button>
          )}
        </div>
      )}

      <Navigation />
    </div>
  )
}
