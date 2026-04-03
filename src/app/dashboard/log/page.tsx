'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const quickTags = ['🫧 Bloated', '😫 Cramps', '💩 Irregular', '😴 Fatigue', '✨ Feeling good', '🔥 Heartburn', '😮‍💨 Gassy', '💧 Dehydrated']

interface Analysis { gutScore: number; insights: string[]; recommendations: string[] }

export default function LogPage() {
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [saving, setSaving] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const onTranscription = (t: string) => setText(t)

  const analyse = async () => {
    if (!text.trim()) return
    setAnalysing(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('gut_profile').eq('id', user?.id || '').single()
    const res = await fetch('/api/analyse-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${text} ${tags.join(', ')}`, userProfile: profile }),
    })
    const result = await res.json()
    setAnalysis(result)
    setAnalysing(false)
  }

  const save = async () => {
    if (!text.trim() && tags.length === 0) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('logs').insert({
      user_id: user?.id,
      type: mode,
      content: [text, ...tags].filter(Boolean).join(' | '),
      gut_score: analysis?.gutScore || null,
      ai_analysis: analysis || null,
      logged_at: new Date().toISOString(),
    })
    setSaved(true)
    setSaving(false)
  }

  if (saved) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 max-w-md mx-auto text-center pb-24">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-bold mb-2">Log saved</h2>
      <p className="text-white/50 mb-8">Keep logging daily to improve your gut score over time.</p>
      <div className="flex gap-3 w-full">
        <Button variant="outline" onClick={() => { setText(''); setTags([]); setAnalysis(null); setSaved(false) }} className="flex-1">Log again</Button>
        <Link href="/dashboard" className="flex-1"><Button className="w-full">Dashboard</Button></Link>
      </div>
      <Navigation/>
    </div>
  )

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto">
      <div className="px-5 pt-12 pb-6">
        <Link href="/dashboard" className="text-white/50 text-sm flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Log your gut</h1>
        <p className="text-white/50 text-sm mt-1">How's your body feeling right now?</p>
      </div>

      {/* Mode toggle */}
      <div className="px-5 mb-6">
        <div className="flex bg-white/5 rounded-xl p-1">
          {(['voice', 'text'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-white/10 text-white' : 'text-white/40'}`}>
              {m === 'voice' ? '🎤 Voice' : '⌨️ Text'}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-5 mb-6">
        {mode === 'voice' ? (
          <div className="flex flex-col items-center py-4">
            <VoiceRecorder onTranscription={onTranscription} onError={setError}/>
            {text && (
              <div className="mt-6 w-full bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-white/40 mb-2">Transcription - tap to edit</p>
                <textarea
                  value={text} onChange={e => setText(e.target.value)}
                  className="w-full bg-transparent text-white/80 text-sm resize-none focus:outline-none"
                  rows={3}
                />
              </div>
            )}
          </div>
        ) : (
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            placeholder="How's your gut feeling? Any symptoms, meals, or energy levels to note..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4ADE80]/50 resize-none"
            rows={5}
          />
        )}
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Quick tags */}
      <div className="px-5 mb-6">
        <p className="text-white/50 text-sm mb-3">Quick symptoms</p>
        <div className="flex flex-wrap gap-2">
          {quickTags.map(tag => (
            <button key={tag} onClick={() => setTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag])}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${tags.includes(tag) ? 'bg-[#4ADE80]/20 border-[#4ADE80]/60 text-[#4ADE80]' : 'bg-white/5 border-white/20 text-white/60'}`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Analysis */}
      {analysis && (
        <div className="px-5 mb-6 space-y-3">
          <Card glow className="flex items-center gap-4">
            <GutScore score={analysis.gutScore} size="sm"/>
            <div>
              <p className="text-sm text-white/50">Gut score for this log</p>
              <p className="font-semibold">{analysis.gutScore}/10</p>
            </div>
          </Card>
          {analysis.insights.length > 0 && (
            <Card>
              <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Insights</p>
              <ul className="space-y-1.5">
                {analysis.insights.map((i, idx) => <li key={idx} className="text-sm text-white/80 flex gap-2"><span className="text-[#4ADE80]">-</span>{i}</li>)}
              </ul>
            </Card>
          )}
          {analysis.recommendations.length > 0 && (
            <Card>
              <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Recommendations</p>
              <ul className="space-y-1.5">
                {analysis.recommendations.map((r, idx) => <li key={idx} className="text-sm text-white/80 flex gap-2"><span className="text-[#00B4B4]">+</span>{r}</li>)}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 flex gap-3">
        {!analysis && (text.trim() || tags.length > 0) && (
          <Button variant="outline" onClick={analyse} loading={analysing} className="flex-1">Analyse</Button>
        )}
        <Button onClick={save} loading={saving} disabled={!text.trim() && tags.length === 0} className="flex-1">Save log</Button>
      </div>

      <Navigation/>
    </div>
  )
}
