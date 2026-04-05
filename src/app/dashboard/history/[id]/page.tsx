'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface LogDetail {
  id: string
  type: string
  content: string
  gut_score: number
  logged_at: string
  ai_analysis: {
    gutScore: number
    summary: string
    insights: string[]
    recommendations: string[]
    flagged: boolean
  } | null
}

export default function LogDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [log, setLog] = useState<LogDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('logs').select('*').eq('id', params.id).eq('user_id', user.id).single()
      setLog(data)
      setLoading(false)
    }
    load()
  }, [params.id, router])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin"/>
    </div>
  )

  if (!log) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-2xl mb-2">📝</p>
        <p className="text-white/50">Log not found</p>
        <button onClick={() => router.push('/dashboard/history')} className="text-[#4ADE80] text-sm mt-3">Back to history</button>
      </div>
    </div>
  )

  const analysis = log.ai_analysis

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{log.type === 'voice' ? '🎤' : '✏️'}</span>
          <span className="text-white/30 text-sm">
            {new Date(log.logged_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-white/20 text-sm">
            {new Date(log.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <h1 className="text-2xl font-bold">Log details</h1>
      </div>

      <div className="px-6 space-y-4">
        {/* Score + summary */}
        {analysis && (
          <Card glow className="flex items-center gap-4">
            <GutScore score={analysis.gutScore} size="lg" />
            <div>
              <p className="text-white/40 text-xs mb-1">Gut score</p>
              <p className="text-sm text-white/80">{analysis.summary}</p>
            </div>
          </Card>
        )}

        {/* Content */}
        <Card>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-2">What you logged</p>
          <p className="text-white/80 text-sm leading-relaxed">{log.content}</p>
        </Card>

        {/* Insights */}
        {analysis?.insights && analysis.insights.length > 0 && (
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Insights</p>
            <ul className="space-y-2">
              {analysis.insights.map((insight, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/70">
                  <span className="text-[#4ADE80] mt-0.5">•</span>{insight}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Recommendations */}
        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Recommendations</p>
            <ul className="space-y-2">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/70">
                  <span className="text-[#00B4B4] mt-0.5 shrink-0">✓</span>{rec}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Flagged warning */}
        {analysis?.flagged && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <p className="text-amber-400 text-sm">⚠️ Some symptoms may benefit from a chat with your doctor.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
