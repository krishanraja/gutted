'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { haptic } from '@/lib/haptics'

interface VoiceRecorderProps {
  /** Fired once with the final transcript when capture completes (mirrors original contract). */
  onTranscription: (text: string) => void
  onError?: (msg: string) => void
  /** Live partial transcript while the user speaks (Web Speech path only). Optional. */
  onInterim?: (text: string) => void
  /** Open straight into recording on mount (voice-first, lowest friction). */
  autoStart?: boolean
}

// Minimal typing for the Web Speech API (not in lib.dom for all targets).
interface SpeechRecognitionResultLike {
  0: { transcript: string }
  isFinal: boolean
  length: number
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: { length: number; [i: number]: SpeechRecognitionResultLike }
}
interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error?: string }) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function VoiceRecorder({ onTranscription, onError, onInterim, autoStart = false }: VoiceRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'transcribing'>('idle')
  const [bars, setBars] = useState<number[]>(Array(20).fill(4))
  const [liveText, setLiveText] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)

  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animRef = useRef<number>(undefined)
  const analyserRef = useRef<AnalyserNode | undefined>(undefined)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Web Speech state. When available, the recogniser produces the transcript
  // live and we skip the Whisper round-trip entirely.
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const finalTextRef = useRef('')
  const usingSpeechRef = useRef(false)
  // Set when the user deliberately stops, so onend does not look like a drop-out.
  const stoppingRef = useRef(false)

  // Callbacks can change identity between renders; keep latest in refs so the
  // long-lived recogniser/recorder handlers stay stable.
  const onTranscriptionRef = useRef(onTranscription)
  const onErrorRef = useRef(onError)
  const onInterimRef = useRef(onInterim)
  useEffect(() => { onTranscriptionRef.current = onTranscription }, [onTranscription])
  useEffect(() => { onErrorRef.current = onError }, [onError])
  useEffect(() => { onInterimRef.current = onInterim }, [onInterim])

  useEffect(() => {
    setSpeechSupported(getSpeechRecognition() !== null)
  }, [])

  const animateBars = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    const step = Math.floor(data.length / 20)
    setBars(Array.from({ length: 20 }, (_, i) => Math.max(4, (data[i * step] / 255) * 48)))
    animRef.current = requestAnimationFrame(animateBars)
  }, [])

  // Tear down audio analysis + the underlying mic stream. Visualiser meter only,
  // safe to call repeatedly.
  const teardownMeter = useCallback(() => {
    if (animRef.current !== undefined) cancelAnimationFrame(animRef.current)
    animRef.current = undefined
    setBars(Array(20).fill(4))
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    analyserRef.current = undefined
  }, [])

  const start = useCallback(async () => {
    setLiveText('')
    finalTextRef.current = ''
    stoppingRef.current = false
    const SpeechRecognition = getSpeechRecognition()

    try {
      // Mic stream powers the waveform visualiser regardless of which transcript path runs.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      ctx.createMediaStreamSource(stream).connect(analyser)
      analyserRef.current = analyser

      if (SpeechRecognition) {
        // --- Web Speech path: live transcript, no Whisper round-trip ---
        usingSpeechRef.current = true
        const recog = new SpeechRecognition()
        recog.continuous = true
        recog.interimResults = true
        recog.lang = 'en-US'
        recog.onresult = (e: SpeechRecognitionEventLike) => {
          let interim = ''
          let final = finalTextRef.current
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i]
            const chunk = res[0].transcript
            if (res.isFinal) final += chunk
            else interim += chunk
          }
          finalTextRef.current = final
          const combined = (final + interim).trim()
          setLiveText(combined)
          onInterimRef.current?.(combined)
        }
        recog.onerror = (ev: { error?: string }) => {
          // 'no-speech'/'aborted' are benign; fall back to Whisper for hard errors
          // only if we captured nothing.
          if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
            onErrorRef.current?.('Microphone access denied. Please allow microphone access and try again.')
          }
        }
        recog.onend = () => {
          // Recogniser ended. If the user asked to stop, finalise with whatever we have.
          if (!stoppingRef.current) return
          const finalText = finalTextRef.current.trim()
          teardownMeter()
          recognitionRef.current = null
          if (finalText) {
            setState('idle')
            haptic.success()
            onTranscriptionRef.current(finalText)
          } else {
            // Nothing heard: drop cleanly back to idle without erroring.
            setState('idle')
          }
        }
        recognitionRef.current = recog
        recog.start()
      } else {
        // --- Fallback path: record then transcribe via Whisper (original flow) ---
        usingSpeechRef.current = false
        chunksRef.current = []
        const mr = new MediaRecorder(stream)
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
        mr.onstop = async () => {
          teardownMeter()
          setState('transcribing')
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const fd = new FormData()
          fd.append('audio', blob, 'recording.webm')
          try {
            const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
            const { text, error } = await res.json()
            if (error) throw new Error(error)
            haptic.success()
            onTranscriptionRef.current(text)
          } catch (e: unknown) {
            onErrorRef.current?.((e as Error).message || 'Transcription failed')
          } finally {
            setState('idle')
          }
        }
        mr.start()
        mediaRef.current = mr
      }

      setState('recording')
      haptic.heavy()
      animRef.current = requestAnimationFrame(animateBars)
    } catch {
      teardownMeter()
      setState('idle')
      onErrorRef.current?.('Microphone access denied. Please allow microphone access and try again.')
    }
  }, [animateBars, teardownMeter])

  const stop = useCallback(() => {
    if (usingSpeechRef.current) {
      stoppingRef.current = true
      recognitionRef.current?.stop()
    } else {
      mediaRef.current?.stop()
      mediaRef.current = null
    }
  }, [])

  // Auto-open into recording when requested (voice-first default).
  const startedRef = useRef(false)
  useEffect(() => {
    if (!autoStart || startedRef.current) return
    startedRef.current = true
    start()
  }, [autoStart, start])

  // Clean up everything on unmount.
  useEffect(() => {
    return () => {
      stoppingRef.current = true
      try { recognitionRef.current?.abort() } catch {}
      try { mediaRef.current?.stop() } catch {}
      teardownMeter()
    }
  }, [teardownMeter])

  const hint = state === 'idle'
    ? (speechSupported ? 'Tap and start speaking' : 'Tap to start recording')
    : state === 'recording'
    ? (speechSupported ? 'Listening, tap when done' : 'Tap to stop')
    : 'Transcribing...'

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Waveform */}
      <div className="flex items-end gap-1 h-14 px-4">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full transition-all duration-75"
            style={{
              height: `${h}px`,
              background: state === 'recording'
                ? `linear-gradient(to top, #00B4B4, #4ADE80)`
                : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>

      {/* Mic button */}
      <button
        onClick={state === 'idle' ? start : state === 'recording' ? stop : undefined}
        disabled={state === 'transcribing'}
        aria-label={state === 'recording' ? 'Stop recording' : 'Start voice log'}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
          state === 'recording'
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/40'
            : state === 'transcribing'
            ? 'bg-white/10 cursor-not-allowed'
            : 'bg-gradient-to-br from-[#00B4B4] to-[#4ADE80] hover:scale-105 shadow-lg shadow-[#00B4B4]/30 animate-glow-pulse'
        }`}
      >
        {state === 'recording' && (
          <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-30"/>
        )}
        {state === 'transcribing' ? (
          <svg className="animate-spin h-7 w-7 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : state === 'recording' ? (
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : (
          <svg className="w-7 h-7 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a4 4 0 00-4 4v6a4 4 0 008 0V5a4 4 0 00-4-4zm-1 16.93V20H9a1 1 0 000 2h6a1 1 0 000-2h-2v-2.07A7 7 0 0019 11a1 1 0 00-2 0 5 5 0 01-10 0 1 1 0 00-2 0 7 7 0 006 6.93z"/>
          </svg>
        )}
      </button>

      <p className="text-white/40 text-sm">{hint}</p>

      {/* Live transcript (Web Speech path) -- gives immediate feedback as you speak. */}
      {speechSupported && state === 'recording' && liveText && (
        <p className="text-white/75 text-sm text-center px-4 max-w-sm leading-relaxed animate-fade-in">
          {liveText}
          <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 align-middle animate-pulse" />
        </p>
      )}
    </div>
  )
}
