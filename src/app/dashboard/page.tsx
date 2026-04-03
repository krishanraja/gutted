'use client'
import { useEffect, useState } from 'react'
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
          <Image src="/logo.png" alt="gutted." width={80} height={26} className="h-7 w-auto" />
          {profile?.plan !== 'free' && (
            <Badge variant="teal">{profile?.plan}</Badge>
          )}
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
            <Link href="/auth/signup?plan=core" className="text-[#4ADE80] text-sm font-medium">Upgrade to Core - $9/mo →</Link>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  )
}
