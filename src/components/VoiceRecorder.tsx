'use client'
import { useState, useRef, useEffect } from 'react'

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  onError?: (err: string) => void
}

export function VoiceRecorder({ onTranscription, onError }: VoiceRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'processing'>('idle')
  const [amplitude, setAmplitude] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animRef = useRef<number>(0)

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  const animate = () => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.fftSize)
    analyserRef.current.getByteTimeDomainData(data)
    const avg = data.reduce((s, v) => s + Math.abs(v - 128), 0) / data.length
    setAmplitude(avg)
    animRef.current = requestAnimationFrame(animate)
  }

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        cancelAnimationFrame(animRef.current)
        setAmplitude(0)
        setState('processing')
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const form = new FormData()
        form.append('audio', blob, `recording.${mimeType.split('/')[1]}`)
        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: form })
          const { text } = await res.json()
          onTranscription(text || '')
        } catch {
          onError?.('Transcription failed. Please try again.')
        }
        setState('idle')
      }
      recorder.start()
      mediaRef.current = recorder
      setState('recording')
      animate()
    } catch {
      onError?.('Microphone access denied. Please allow mic permissions.')
    }
  }

  const stop = () => { mediaRef.current?.stop() }

  const size = 80 + amplitude * 2
  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        onClick={isRecording ? stop : start}
        disabled={isProcessing}
        className="relative flex items-center justify-center rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50"
        style={{ width: `${size + 40}px`, height: `${size + 40}px` }}
      >
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"/>
            <span className="absolute inset-2 rounded-full bg-red-500/10"/>
          </>
        )}
        <span className={`relative z-10 flex items-center justify-center rounded-full transition-all duration-150 ${
          isRecording ? 'bg-red-500 w-20 h-20' : 'bg-gradient-to-br from-[#00B4B4] to-[#4ADE80] w-20 h-20'
        }`}>
          {isProcessing ? (
            <svg className="animate-spin w-8 h-8 text-black" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : isRecording ? (
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          ) : (
            <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
            </svg>
          )}
        </span>
      </button>
      <p className="text-white/50 text-sm">
        {isProcessing ? 'Transcribing...' : isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
      </p>
    </div>
  )
}
