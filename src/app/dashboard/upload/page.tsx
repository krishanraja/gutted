'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import { DocumentUploader } from '@/components/DocumentUploader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type DocType = 'gut_test' | 'doctor_report' | 'food_label'

interface Analysis {
  summary: string
  biomarkers: Record<string, string>
  recommendations: string[]
  keyFindings?: string[]
}

export default function UploadPage() {
  const [selected, setSelected] = useState<DocType | null>(null)
  const [result, setResult] = useState<Analysis | null>(null)
  const [error, setError] = useState('')

  const onAnalysis = (r: Analysis) => {
    setResult(r)
    setSelected(null)
  }

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto">
      <div className="px-5 pt-12 pb-6">
        <Link href="/dashboard" className="text-white/50 text-sm flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Upload a document</h1>
        <p className="text-white/50 text-sm mt-1">Gut tests, doctor reports, food labels - AI reads them all.</p>
      </div>

      {error && (
        <div className="mx-5 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Upload tiles */}
      <div className="px-5 space-y-3 mb-6">
        {(['gut_test', 'doctor_report', 'food_label'] as DocType[]).map(type => (
          <DocumentUploader key={type} type={type} onAnalysis={onAnalysis} onError={setError}/>
        ))}
      </div>

      {/* Results */}
      {result && (
        <div className="px-5 space-y-4">
          <h2 className="font-bold text-lg gradient-text">AI Analysis</h2>

          <Card glow>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Summary</p>
            <p className="text-white/80 text-sm leading-relaxed">{result.summary}</p>
          </Card>

          {result.keyFindings && result.keyFindings.length > 0 && (
            <Card>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Key Findings</p>
              <ul className="space-y-2">
                {result.keyFindings.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/80">
                    <span className="text-[#4ADE80] flex-shrink-0">•</span>{f}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {result.biomarkers && Object.keys(result.biomarkers).length > 0 && (
            <Card>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Biomarkers</p>
              <div className="space-y-2">
                {Object.entries(result.biomarkers).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-white/70 text-sm">{k}</span>
                    <span className="text-white font-medium text-sm">{v}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <Card>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Recommendations</p>
              <ul className="space-y-2.5">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/80">
                    <span className="text-[#00B4B4] flex-shrink-0 font-bold">{i + 1}.</span>{r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Link href="/dashboard/meal-plan">
            <Button className="w-full">Generate meal plan from this</Button>
          </Link>

          <Button variant="outline" onClick={() => setResult(null)} className="w-full">Upload another document</Button>
        </div>
      )}

      <Navigation/>
    </div>
  )
}
