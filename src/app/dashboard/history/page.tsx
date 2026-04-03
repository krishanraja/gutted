'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { Card } from '@/components/ui/Card'
import { GutScore } from '@/components/GutScore'

interface Log { id: string; content: string; gut_score: number; type: string; logged_at: string }

export default function HistoryPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(50)
      setLogs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const grouped = logs.reduce((acc: Record<string, Log[]>, log) => {
    const date = new Date(log.logged_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto">
      <div className="px-5 pt-12 pb-6">
        <Link href="/dashboard" className="text-white/50 text-sm flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-white/50 text-sm mt-1">{logs.length} log{logs.length !== 1 ? 's' : ''} total</p>
      </div>

      {loading && <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin"/></div>}

      {!loading && logs.length === 0 && (
        <div className="px-5">
          <Card className="text-center py-10">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-semibold mb-2">No logs yet</p>
            <p className="text-white/50 text-sm">Start logging your gut health daily to see your history here.</p>
          </Card>
        </div>
      )}

      <div className="px-5 space-y-6">
        {Object.entries(grouped).map(([date, dayLogs]) => (
          <div key={date}>
            <p className="text-white/40 text-xs uppercase tracking-wider mb-3">{date}</p>
            <div className="space-y-2">
              {dayLogs.map(log => (
                <Card key={log.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {log.gut_score ? <GutScore score={log.gut_score} size="sm" animate={false}/> : <span className="text-xl">{log.type === 'voice' ? '🎤' : '⌨️'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm leading-relaxed line-clamp-3">{log.content || 'Voice log'}</p>
                      <p className="text-white/30 text-xs mt-1">{new Date(log.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Navigation/>
    </div>
  )
}
