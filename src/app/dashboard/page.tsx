'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Profile { name: string; plan: string; gut_profile: Record<string, unknown> }
interface Log { id: string; type: string; content: string; gut_score: number; logged_at: string }

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [todayScore, setTodayScore] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth/login'; return }

      const [{ data: p }, { data: l }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(10),
      ])

      setProfile(p)
      setLogs(l || [])
      const scores = (l || []).filter(log => log.gut_score).map(log => log.gut_score)
      setTodayScore(scores.length ? Math.round(scores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(scores.length, 3)) : 0)
      setLoading(false)
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <Image src="/icon.png" alt="gutted." width={32} height={32} className="h-8 w-8" />
          <div className="flex items-center gap-2">
            {profile?.plan !== 'free' && (
              <Badge variant="teal">{profile?.plan}</Badge>
            )}
            <Link href="/dashboard/settings" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </Link>
          </div>
        </div>
        <p className="text-white/50 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold mt-0.5">{profile?.name || 'friend'}</h1>
      </div>

      {/* Gut score card */}
      <div className="px-6 mb-6">
        <Card glow className="flex items-center gap-6 py-6">
          <GutScore score={todayScore} size="lg" />
          <div>
            <p className="text-white/40 text-sm mb-1">Today's gut score</p>
            <p className="text-lg font-semibold">
              {todayScore === 0 ? 'Log your first entry' : todayScore >= 7 ? 'Gut feeling good' : todayScore >= 4 ? 'Room to improve' : 'Rough day - take it easy'}
            </p>
            {todayScore === 0 && <p className="text-white/30 text-xs mt-1">Tap "Log now" to get your score</p>}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="px-6 mb-6">
        <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Quick actions</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/dashboard/log', emoji: '🎤', label: 'Log now' },
            { href: '/dashboard/upload', emoji: '📄', label: 'Upload test' },
            { href: '/dashboard/meal-plan', emoji: '🍽️', label: 'Meal plan' },
          ].map(({ href, emoji, label }) => (
            <Link key={href} href={href}>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-[#00B4B4]/30 transition-colors active:scale-95">
                <div className="text-2xl mb-1">{emoji}</div>
                <p className="text-xs text-white/60">{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent logs */}
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/40 text-xs uppercase tracking-wide">Recent logs</p>
          <Link href="/dashboard/history" className="text-[#4ADE80] text-xs">View all</Link>
        </div>
        {logs.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-2xl mb-2">🎤</p>
            <p className="text-white/50 text-sm">No logs yet. Start by recording how you feel.</p>
            <Link href="/dashboard/log" className="inline-block mt-3 text-[#4ADE80] text-sm">Log now</Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 3).map(log => (
              <Card key={log.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{log.type === 'voice' ? '🎤' : '✏️'}</span>
                      <span className="text-white/30 text-xs">{new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-white/70 truncate">{log.content}</p>
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
        )}
      </div>

      {/* Upsell if free */}
      {profile?.plan === 'free' && (
        <div className="px-6 mt-6">
          <div className="bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border border-[#00B4B4]/20 rounded-2xl p-4">
            <p className="font-semibold mb-1">Unlock your full gut profile</p>
            <p className="text-white/50 text-sm mb-3">Upload a gut test and get a personalised weekly meal plan.</p>
            <button
              onClick={async () => {
                const res = await fetch('/api/stripe/checkout', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ plan: 'core' }),
                })
                const { url } = await res.json()
                if (url) window.location.href = url
              }}
              className="text-[#4ADE80] text-sm font-medium hover:underline"
            >Upgrade to Core - $9/mo →</button>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  )
}
