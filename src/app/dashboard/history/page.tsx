'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Log { id: string; type: string; content: string; gut_score: number; logged_at: string; ai_analysis: { summary?: string } | null }

export default function HistoryPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [avgScore, setAvgScore] = useState(0)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(50)
      const l = data || []
      setLogs(l)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentScores = l.filter(x => x.gut_score > 0 && new Date(x.logged_at) >= sevenDaysAgo).map(x => x.gut_score)
      setAvgScore(recentScores.length ? Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length) : 0)
      setLoading(false)
    }
    load()
  }, [])

  const grouped = logs.reduce((acc, log) => {
    const date = new Date(log.logged_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, Log[]>)

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-white/40 text-sm mt-1">Your gut health over time</p>
      </div>

      {/* Average score */}
      {avgScore > 0 && (
        <div className="px-6 mb-6">
          <Card glow className="flex items-center gap-4">
            <GutScore score={avgScore} size="lg" />
            <div>
              <p className="text-white/40 text-xs mb-1">7-day average</p>
              <p className="font-semibold">{avgScore >= 7 ? 'Trending well' : avgScore >= 4 ? 'Room to grow' : "Let's turn this around"}</p>
              <p className="text-white/30 text-xs mt-0.5">{logs.length} log{logs.length !== 1 ? 's' : ''} total</p>
            </div>
          </Card>
        </div>
      )}

      {/* Log timeline */}
      <div className="px-6 space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-white/50">No logs yet. Start tracking your gut health.</p>
          </Card>
        ) : (
          Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <p className="text-white/30 text-xs uppercase tracking-wide mb-3">{date}</p>
              <div className="space-y-2">
                {dayLogs.map(log => (
                  <Card key={log.id}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">{log.type === 'voice' ? '🎤' : '✏️'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/70 leading-relaxed">{log.content}</p>
                        {log.ai_analysis?.summary && (
                          <p className="text-xs text-[#4ADE80] mt-1">{log.ai_analysis.summary}</p>
                        )}
                        <p className="text-white/20 text-xs mt-1">
                          {new Date(log.logged_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {log.gut_score > 0 && (
                        <Badge variant={log.gut_score >= 7 ? 'green' : log.gut_score >= 4 ? 'amber' : 'red'}>
                          {log.gut_score}/10
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Navigation />
    </div>
  )
}
