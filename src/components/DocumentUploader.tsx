'use client'
import { useState, useRef, DragEvent, ChangeEvent } from 'react'

type DocType = 'gut_test' | 'doctor_report' | 'food_label'

interface DocumentUploaderProps {
  type: DocType
  onAnalysis: (result: { summary: string; biomarkers: Record<string, string>; recommendations: string[] }) => void
  onError?: (err: string) => void
}

const labels: Record<DocType, { title: string; desc: string; icon: string }> = {
  gut_test: { title: 'Gut Test Results', desc: 'Viome, GI-MAP, Thryve, SIBO, Microbiome reports', icon: '🧬' },
  doctor_report: { title: "Doctor's Report / Scan", desc: 'Certificates, pathology, imaging results', icon: '🏥' },
  food_label: { title: 'Food Label', desc: 'Ingredients list or nutrition panel', icon: '🥗' },
}

export function DocumentUploader({ type, onAnalysis, onError }: DocumentUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const [state, setState] = useState<'idle' | 'uploading' | 'analysing'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const label = labels[type]

  const process = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      onError?.('Please upload an image or PDF.')
      return
    }
    setState('uploading')
    const form = new FormData()
    form.append('file', file)
    form.append('type', type)
    try {
      const uploadRes = await fetch('/api/upload-document', { method: 'POST', body: form })
      const { fileUrl } = await uploadRes.json()
      setState('analysing')
      const analyseRes = await fetch('/api/analyse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, documentType: type }),
      })
      const result = await analyseRes.json()
      onAnalysis(result)
    } catch {
      onError?.('Upload failed. Please try again.')
    }
    setState('idle')
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) process(file)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) process(file)
  }

  const busy = state !== 'idle'

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !busy && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer min-h-[140px]
        ${dragging ? 'border-[#4ADE80] bg-[#4ADE80]/5' : 'border-white/20 hover:border-white/40 bg-white/3'}
        ${busy ? 'opacity-70 cursor-not-allowed' : ''}
      `}
    >
      <input ref={inputRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={onChange} disabled={busy}/>
      <span className="text-3xl">{label.icon}</span>
      <div className="text-center">
        <p className="font-semibold text-white text-sm">{label.title}</p>
        <p className="text-white/40 text-xs mt-0.5">{label.desc}</p>
      </div>
      {busy && (
        <div className="flex items-center gap-2 text-[#4ADE80] text-sm">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {state === 'uploading' ? 'Uploading...' : 'Analysing with AI...'}
        </div>
      )}
      {!busy && <p className="text-[#00B4B4] text-xs">Tap to upload or take a photo</p>}
    </div>
  )
}
