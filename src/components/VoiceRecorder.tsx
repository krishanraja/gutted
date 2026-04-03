'use client'
import { useState, useRef, useCallback } from 'react'
import { haptic } from '@/lib/haptics'

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  onError?: (msg: string) => void
}

export function VoiceRecorder({ onTranscription, onError }: VoiceRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'transcribing'>('idle')
  const [bars, setBars] = useState<number[]>(Array(20).fill(4))
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animRef = useRef<number>(undefined)
  const analyserRef = useRef<AnalyserNode | undefined>(undefined)

  const animateBars = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    const step = Math.floor(data.length / 20)
    setBars(Array.from({ length: 20 }, (_, i) => Math.max(4, (data[i * step] / 255) * 48)))
    animRef.current = requestAnimationFrame(animateBars)
  }, [])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      ctx.createMediaStreamSource(stream).connect(analyser)
      analyserRef.current = analyser
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        cancelAnimationFrame(animRef.current!)
        setBars(Array(20).fill(4))
        setState('transcribing')
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const fd = new FormData()
        fd.append('audio', blob, 'recording.webm')
        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          const { text, error } = await res.json()
          if (error) throw new Error(error)
          haptic.success()
          onTranscription(text)
        } catch (e: unknown) {
          onError?.((e as Error).message || 'Transcription failed')
        } finally {
          setState('idle')
        }
      }
      mr.start()
      mediaRef.current = mr
      setState('recording')
      haptic.heavy()
      animRef.current = requestAnimationFrame(animateBars)
    } catch {
      onError?.('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  const stop = () => {
    mediaRef.current?.stop()
    mediaRef.current = null
  }

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

      <p className="text-white/40 text-sm">
        {state === 'idle' && 'Tap to start recording'}
        {state === 'recording' && 'Tap to stop'}
        {state === 'transcribing' && 'Transcribing...'}
      </p>
    </div>
  )
}
