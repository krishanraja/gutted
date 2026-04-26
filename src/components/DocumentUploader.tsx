'use client'
import { useState, useRef, DragEvent } from 'react'
import { FileTextIcon, UploadIcon } from '@/components/icons'

interface DocumentUploaderProps {
  type: 'gut_test' | 'doctor_report' | 'food_label'
  onAnalysed: (result: { summary: string; biomarkers?: Record<string, string>; recommendations: string[]; fileName?: string }) => void
  onError?: (msg: string) => void
}

const labels = {
  gut_test: { title: 'Gut test results', desc: 'Viome, GI-MAP, Thryve, SIBO breath tests' },
  doctor_report: { title: "Doctor's report or scan", desc: 'Certificates, prescriptions, scans' },
  food_label: { title: 'Food label or ingredients', desc: 'Photo a label or ingredient list' },
}

export function DocumentUploader({ type, onAnalysed, onError }: DocumentUploaderProps) {
  const [state, setState] = useState<'idle' | 'uploading' | 'analysing'>('idle')
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { title, desc } = labels[type]

  const process = async (file: File) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      onError?.('Please upload an image (JPG, PNG, HEIC, WebP) or PDF.')
      return
    }
    setState('uploading')
    setProgress(0)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)

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
      className={`relative border border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
        dragOver ? 'border-accent bg-accent/[0.06]' :
        busy ? 'border-white/[0.08] cursor-not-allowed' :
        'border-white/15 hover:border-accent-50 hover:bg-white/[0.02]'
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
      <div className="text-white/45 mb-3 flex justify-center">
        {type === 'food_label' ? <FileTextIcon size={26} /> : <UploadIcon size={26} />}
      </div>
      <p className="font-medium text-white mb-1">{title}</p>
      <p className="text-white/50 text-sm mb-4">{desc}</p>

      {busy ? (
        <div className="space-y-2">
          <div className="w-full bg-white/[0.06] rounded-full h-1">
            <div
              className="h-1 rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-accent text-sm animate-pulse">
            {state === 'uploading' ? 'Uploading…' : 'Analysing with AI…'}
          </p>
        </div>
      ) : (
        <p className="text-xs text-white/40">Tap to upload or take a photo. JPG, PNG, PDF.</p>
      )}
    </div>
  )
}
