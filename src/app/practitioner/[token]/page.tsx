'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { GutScore } from '@/components/GutScore'
import Image from 'next/image'

interface PatientData {
  patient: { name: string; gutProfile: Record<string, unknown>; memberSince: string }
  stats: { avgScore: number; totalLogs: number; highestScore: number; lowestScore: number }
  recentLogs: { content: string; score: number; date: string; analysis: Record<string, unknown> | null }[]
  documents: { type: string; interpretation: string; biomarkers: Record<string, string>; recommendations: string[]; uploadedAt: string }[]
}

export default function PractitionerViewPage() {
  const { token } = useParams()
  const [data, setData] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/practitioner/view?token=${token}`)
        const result = await res.json()
        if (result.error) throw new Error(result.error)
        setData(result)
      } catch (e: unknown) {
        setError((e as Error).message || 'Invalid or expired link')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <Card className="text-center py-10 max-w-md">
        <div className="text-4xl mb-4">🔒</div>
        <p className="font-semibold mb-2">Access denied</p>
        <p className="text-white/40 text-sm">{error}</p>
      </Card>
    </div>
  )

  if (!data) return null

  return (
    <div className="min-h-screen bg-black pb-12">
      {/* Header */}
      <div className="px-6 pt-8 pb-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Image src="/icon.png" alt="gutted." width={32} height={32} className="h-8 w-8" />
          <div>
            <p className="text-white/40 text-xs">gutted. practitioner view</p>
            <p className="font-semibold">Patient: {data.patient.name}</p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-6">
          <p className="text-amber-300 text-xs">This is patient-reported data from a consumer health tracking app. It should be considered alongside clinical examination.</p>
        </div>
      </div>

      <div className="px-6 max-w-3xl mx-auto space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="text-center py-4">
            <GutScore score={data.stats.avgScore} size="lg" />
            <p className="text-white/40 text-xs mt-2">30-day avg</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-3xl font-bold gradient-text">{data.stats.totalLogs}</p>
            <p className="text-white/40 text-xs mt-2">Logs (30d)</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-3xl font-bold text-[#4ADE80]">{data.stats.highestScore}</p>
            <p className="text-white/40 text-xs mt-2">Best score</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-3xl font-bold text-red-400">{data.stats.lowestScore}</p>
            <p className="text-white/40 text-xs mt-2">Lowest score</p>
          </Card>
        </div>

        {/* Patient profile */}
        {data.patient.gutProfile && Object.keys(data.patient.gutProfile).length > 0 && (
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Patient profile</p>
            <div className="space-y-1 text-sm">
              {Object.entries(data.patient.gutProfile).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-white/50 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-white/70">{Array.isArray(value) ? (value as string[]).join(', ') : String(value)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Documents */}
        {data.documents.length > 0 && (
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Test results & documents</p>
            <div className="space-y-4">
              {data.documents.map((doc, i) => (
                <div key={i} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="neutral">{doc.type.replace('_', ' ')}</Badge>
                    <span className="text-white/30 text-xs">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white/60 text-sm mb-2">{doc.interpretation}</p>
                  {doc.biomarkers && Object.keys(doc.biomarkers).length > 0 && (
                    <div className="ml-4 space-y-1">
                      {Object.entries(doc.biomarkers).map(([k, v]) => (
                        <div key={k} className="text-xs">
                          <span className="text-[#00B4B4]">{k}:</span> <span className="text-white/50">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent logs */}
        <Card>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Recent symptom logs</p>
          <div className="space-y-3">
            {data.recentLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="text-white/30 text-xs">{new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-sm text-white/70 mt-0.5">{log.content}</p>
                </div>
                {log.score > 0 && (
                  <Badge variant={log.score >= 7 ? 'green' : log.score >= 4 ? 'amber' : 'red'}>
                    {log.score}/10
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        <p className="text-white/20 text-xs text-center pt-4">
          Generated by gutted. -- gutted.app -- Not a medical document
        </p>
      </div>
    </div>
  )
}
