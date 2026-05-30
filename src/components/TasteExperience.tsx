'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { GutScore } from '@/components/GutScore'
import { Button } from '@/components/ui/Button'
import { MicIcon, ArrowRightIcon } from '@/components/icons'

interface TasteResult {
  gutScore: number
  summary: string
  insights: string[]
  recommendation?: string
  flagged?: boolean
}

// Minimal Web Speech typings (not in the standard lib).
type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

const PROMPTS = [
  'Bloated since lunch, ate a sandwich, slept badly',
  'Cramps every morning this week, lots of coffee',
  'Feeling good, regular, but gassy after dairy',
]

export function TasteExperience() {
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'result' | 'error'>('idle')
  const [result, setResult] = useState<TasteResult | null>(null)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (Ctor) {
      setVoiceSupported(true)
      const rec = new Ctor()
      rec.lang = 'en-US'
      rec.interimResults = true
      rec.continuous = false
      rec.onresult = (e) => {
        let transcript = ''
        for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript
        setText(transcript)
      }
      rec.onend = () => setListening(false)
      rec.onerror = () => setListening(false)
      recognitionRef.current = rec
    }
  }, [])

  const toggleVoice = () => {
    const rec = recognitionRef.current
    if (!rec) return
    if (listening) {
      rec.stop()
      setListening(false)
    } else {
      setError('')
      try {
        rec.start()
        setListening(true)
      } catch {
        setListening(false)
      }
    }
  }

  const analyse = async () => {
    const value = text.trim()
    if (value.length < 3 || state === 'loading') return
    if (listening) recognitionRef.current?.stop()
    setState('loading')
    setError('')
    try {
      const res = await fetch('/api/taste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      setResult(data as TasteResult)
      setState('result')
      // Stash so the first log can be replayed into the account after signup.
      try {
        localStorage.setItem('gutted_taste', JSON.stringify({ text: value, result: data, ts: Date.now() }))
      } catch {}
    } catch (e: unknown) {
      setError((e as Error).message || 'Something went wrong. Try again.')
      setState('error')
    }
  }

  if (state === 'result' && result) {
    return (
      <div className="w-full max-w-sm mx-auto text-left max-h-[62vh] overflow-y-auto hide-scrollbar">
        <div className="bg-black/60 border border-white/[0.12] rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <GutScore score={result.gutScore} size="sm" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wider text-white/40">Your gut today</p>
              <p className="text-sm text-white/85 leading-snug mt-0.5">{result.summary}</p>
            </div>
          </div>

          {result.flagged && (
            <div className="mt-4 rounded-lg bg-[#E96363]/12 border border-[#E96363]/30 px-3 py-2.5">
              <p className="text-[#E96363] text-xs leading-relaxed">
                Some of what you described is worth raising with a doctor soon. gutted. is not a medical service.
              </p>
            </div>
          )}

          {result.insights?.length > 0 && (
            <ul className="mt-4 space-y-2">
              {result.insights.slice(0, 2).map((insight, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/70 leading-snug">
                  <span className="text-accent mt-0.5">·</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          )}

          {result.recommendation && (
            <p className="mt-3 text-sm text-white/80 leading-snug">
              <span className="text-accent font-medium">Try this: </span>{result.recommendation}
            </p>
          )}

          {/* Teaser: what they unlock by saving */}
          <div className="mt-4 relative rounded-lg border border-white/[0.06] overflow-hidden">
            <div className="px-3 py-3 blur-[3px] select-none pointer-events-none" aria-hidden>
              <p className="text-xs text-white/60">7-day trend, trigger foods, and a meal plan built from your gut.</p>
              <div className="mt-2 flex gap-1">
                {[5, 6, 4, 7, 6, 8, 7].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-accent/40" style={{ height: h * 4 }} />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] uppercase tracking-wider text-white/55">Unlock your trend</span>
            </div>
          </div>
        </div>

        <Link href="/auth/signup" className="block mt-3">
          <Button size="lg" variant="gradient" className="w-full">
            Save this and keep going <ArrowRightIcon size={15} className="ml-1" />
          </Button>
        </Link>
        <button
          onClick={() => { setState('idle'); setText(''); setResult(null) }}
          className="w-full mt-2 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Try another
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-black/60 border border-white/[0.12] rounded-2xl p-4 backdrop-blur-md text-left">
        <label className="text-sm text-white/80 font-medium block mb-2">Tell me how your gut feels today</label>
        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
            placeholder={listening ? 'Listening...' : PROMPTS[0]}
            className="w-full resize-none bg-black/30 border border-white/[0.10] rounded-xl px-3.5 py-3 pr-11 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-50 transition-colors"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) analyse() }}
          />
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              aria-label={listening ? 'Stop voice input' : 'Speak'}
              className={`absolute right-2.5 top-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                listening ? 'bg-accent text-black' : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              <MicIcon size={14} />
            </button>
          )}
        </div>
        <Button
          onClick={analyse}
          loading={state === 'loading'}
          disabled={text.trim().length < 3}
          size="lg"
          variant="gradient"
          className="w-full mt-3"
        >
          {state === 'loading' ? 'Reading your gut…' : 'Get my gut score'}
        </Button>
        {error && <p className="text-[#E96363] text-xs mt-2 text-center">{error}</p>}
        <p className="text-[11px] text-white/35 mt-2.5 text-center">No signup. Takes seconds. gutted. is not a medical service.</p>
      </div>
    </div>
  )
}
