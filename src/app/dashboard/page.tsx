'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Log { id: string; content: string; gut_score: number; type: string; logged_at: string }
interface Profile { name: string; gut_profile: Record<string, unknown> }

function getHour() { return new Date().getHours() }
function greeting(name: string) {
  const h = getHour()
  const t = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${t}, ${name?.split(' ')[0] || 'there'}.`
}

function scoreBadge(score: number) {
  if (score >= 7) return <Badge variant="green">{score}/10</Badge>
  if (score >= 4) return <Badge variant="amber">{score}/10</Badge>
  return <Badge variant="red">{score}/10</Badge>
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [avgScore, setAvgScore] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }
      const [{ data: p }, { data: l }] = await Promise.all([
        supabase.from('profiles').select('name, gut_profile').eq('id', user.id).single(),
        supabase.from('logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(10),
      ])
      setProfile(p)
      setLogs(l || [])
      if (l?.length) setAvgScore(Math.round(l.reduce((s: number, x: Log) => s + (x.gut_score || 5), 0) / l.length))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-6">
        <div>
          <p className="text-white/50 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-xl font-bold mt-0.5">{greeting(profile?.name || '')}</h1>
        </div>
        <Image src="/icon.png" alt="gutted." width={36} height={36} className="rounded-xl"/>
      </div>

      {/* Gut Score Card */}
      <div className="mx-5 mb-5">
        <Card glow className="flex items-center gap-6 py-6">
          <GutScore score={avgScore || 5} size="lg"/>
          <div>
            <p className="text-white/50 text-sm">Today's gut score</p>
            <p className="text-white font-semibold mt-0.5">{avgScore >= 7 ? 'Your gut is thriving' : avgScore >= 4 ? 'Room to improve' : 'Needs attention'}</p>
            <p className="text-white/40 text-xs mt-1">Based on {logs.length} log{logs.length !== 1 ? 's' : ''}</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/dashboard/log', icon: '🎤', label: 'Log now' },
            { href: '/dashboard/upload', icon: '📄', label: 'Upload test' },
            { href: '/dashboard/meal-plan', icon: '🍽️', label: 'Meal plan' },
          ].map(a => (
            <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-4 active:scale-95 transition-all hover:bg-white/8">
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs text-white/70 font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upload CTA if no logs */}
      {logs.length === 0 && (
        <div className="mx-5 mb-6">
          <Card className="text-center py-8">
            <p className="text-3xl mb-3">🧬</p>
            <p className="font-semibold mb-1">Upload your first gut test</p>
            <p className="text-white/50 text-sm mb-4">Get personalised insights from your Viome, GI-MAP, or any gut health report.</p>
            <Link href="/dashboard/upload">
              <button className="text-[#4ADE80] text-sm font-medium">Upload now</button>
            </Link>
          </Card>
        </div>
      )}

      {/* Recent Logs */}
      {logs.length > 0 && (
        <div className="px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent logs</h2>
            <Link href="/dashboard/history" className="text-[#4ADE80] text-sm">See all</Link>
          </div>
          <div className="space-y-3">
            {logs.slice(0, 3).map(log => (
              <Card key={log.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-2">{log.content || 'Voice log'}</p>
                    <p className="text-white/30 text-xs mt-1">{new Date(log.logged_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                  {log.gut_score && scoreBadge(log.gut_score)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Navigation/>
    </div>
  )
}
