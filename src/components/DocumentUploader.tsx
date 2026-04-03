'use client'
import { useState, useRef, DragEvent } from 'react'

interface DocumentUploaderProps {
  type: 'gut_test' | 'doctor_report' | 'food_label'
  onAnalysed: (result: { summary: string; biomarkers?: Record<string, string>; recommendations: string[]; fileName?: string }) => void
  onError?: (msg: string) => void
}

const labels = {
  gut_test: { title: 'Gut Test Results', desc: 'Viome, GI-MAP, Thryve, SIBO', emoji: '🧬' },
  doctor_report: { title: "Doctor's Report / Scan", desc: 'Certificates, prescriptions, scans', emoji: '🏥' },
  food_label: { title: 'Food Label / Ingredients', desc: 'Photo a label or ingredient list', emoji: '🍎' },
}

export function DocumentUploader({ type, onAnalysed, onError }: DocumentUploaderProps) {
  const [state, setState] = useState<'idle' | 'uploading' | 'analysing'>('idle')
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { title, desc, emoji } = labels[type]

  const process = async (file: File) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      onError?.('Please upload an image (JPG, PNG, HEIC, WebP) or PDF.')
      return
    }
    setState('uploading')
    setProgress(0)

    // Upload to our API which handles Supabase storage + analysis
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)

    // Simulate progress
    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 10, 70)), 300)

    try {
      setState('analysing')
      const res = await fetch('/api/analyse-document', { method: 'POST', body: fd })
      clearInterval(progressInterval)
      setProgress(100)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onAnalysed({ ...data, fileName: file.name })
    } catch (e: unknown) {
      onError?.((e as Error).message || 'Analysis failed. Please try again.')
    } finally {
      setState('idle')
      setProgress(0)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) process(file)
  }

  const busy = state !== 'idle'

  return (
    <div
      onClick={() => !busy && inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
        dragOver ? 'border-[#00B4B4] bg-[#00B4B4]/10' :
        busy ? 'border-white/10 cursor-not-allowed' :
        'border-white/20 hover:border-[#00B4B4]/50 hover:bg-white/5'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf"
        capture={type === 'food_label' ? 'environment' : undefined}
        onChange={e => { const f = e.target.files?.[0]; if (f) process(f) }}
      />
      <div className="text-3xl mb-3">{emoji}</div>
      <p className="font-semibold text-white mb-1">{title}</p>
      <p className="text-white/40 text-sm mb-4">{desc}</p>

      {busy ? (
        <div className="space-y-2">
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[#4ADE80] text-sm animate-pulse">
            {state === 'uploading' ? 'Uploading...' : 'Analysing with AI...'}
          </p>
        </div>
      ) : (
        <p className="text-xs text-white/30">Tap to upload or take a photo - JPG, PNG, PDF</p>
      )}
    </div>
  )
}
