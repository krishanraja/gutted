'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DashboardSkeleton } from '@/components/ui/Skeleton'

interface Profile { name: string; plan: string; gut_profile: Record<string, unknown> }
interface Log { id: string; type: string; content: string; gut_score: number; logged_at: string }
interface Pattern { trigger: string; effect: string; confidence: string; detail: string; occurrences?: number }
interface TriggerFood { food: string; avgScoreAfter: number; timesLogged: number; symptoms: string[] }
interface BeneficialFood { food: string; avgScoreAfter: number; timesLogged: number; benefits: string[] }

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [todayScore, setTodayScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [dailyInsight, setDailyInsight] = useState<{ insight: string; type: string } | null>(null)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [triggerFoods, setTriggerFoods] = useState<TriggerFood[]>([])
  const [beneficialFoods, setBeneficialFoods] = useState<BeneficialFood[]>([])
  const [hasLoggedToday, setHasLoggedToday] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [profileCompleteness, setProfileCompleteness] = useState(0)
  const [completenessItems, setCompletenessItems] = useState<{ label: string; done: boolean; href: string }[]>([])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    const [{ data: p }, { data: l }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(30),
    ])

    setProfile(p)
    const allLogs = l || []
    setLogs(allLogs)

    // Calculate today's score (avg of last 3 scored logs)
    const scores = allLogs.filter(log => log.gut_score).map(log => log.gut_score)
    setTodayScore(scores.length ? Math.round(scores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(scores.length, 3)) : 0)

    // Check if logged today
    const today = new Date().toDateString()
    setHasLoggedToday(allLogs.some(log => new Date(log.logged_at).toDateString() === today))

    // Calculate streak
    const logDates = [...new Set(allLogs.map(log => new Date(log.logged_at).toDateString()))]
    let streakCount = 0
    const now = new Date()
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(now)
      checkDate.setDate(checkDate.getDate() - i)
      if (logDates.includes(checkDate.toDateString())) {
        streakCount++
      } else if (i > 0) {
        break
      }
    }
    setStreak(streakCount)

    // Calculate profile completeness
    const gutProfile = p?.gut_profile || {} as Record<string, unknown>
    const { count: docCount } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    const items = [
      { label: 'Complete onboarding', done: !!p?.onboarding_complete, href: '/onboarding' },
      { label: 'Log at least 5 entries', done: allLogs.length >= 5, href: '/dashboard/log' },
      { label: 'Upload a gut test', done: (docCount || 0) > 0, href: '/dashboard/upload' },
      { label: 'Generate a meal plan', done: false, href: '/dashboard/meal-plan' },
      { label: 'Set dietary restrictions', done: !!(gutProfile as Record<string, unknown>).restrictions, href: '/onboarding' },
    ]
    // Check meal plan
    const { count: mealCount } = await supabase.from('meal_plans').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    items[3].done = (mealCount || 0) > 0
    setCompletenessItems(items)
    setProfileCompleteness(Math.round((items.filter(i => i.done).length / items.length) * 100))

    setLoading(false)

    // Fetch AI insights in background (non-blocking)
    if (allLogs.length >= 2) {
      fetch('/api/daily-insight', { method: 'POST' })
        .then(r => r.json())
        .then(data => { if (data.insight) setDailyInsight(data) })
        .catch(() => {})
    }
    if (allLogs.length >= 5) {
      fetch('/api/patterns', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
          if (data.patterns?.length) setPatterns(data.patterns)
          if (data.triggerFoods?.length) setTriggerFoods(data.triggerFoods)
          if (data.beneficialFoods?.length) setBeneficialFoods(data.beneficialFoods)
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Determine proactive nudge
  const getNudge = () => {
    if (!hasLoggedToday) return { text: "You haven't logged today  - how's your gut feeling?", action: '/dashboard/log', cta: 'Log now' }
    const recentScores = logs.slice(0, 5).filter(l => l.gut_score).map(l => l.gut_score)
    const avgRecent = recentScores.length ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0
    if (avgRecent > 0 && avgRecent < 4) return { text: "Your scores have been low this week. Let's look at what might be causing it.", action: '/dashboard/history', cta: 'View history' }
    return null
  }
  const nudge = getNudge()

  const insightIcons: Record<string, string> = { tip: '💡', pattern: '🔍', encouragement: '🌟', warning: '⚠️' }

  if (loading) return <DashboardSkeleton />

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <Image src="/icon.png" alt="gutted." width={32} height={32} className="h-8 w-8" />
          <div className="flex items-center gap-2">
            {streak > 1 && (
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-semibold text-orange-400">{streak}</span>
              </div>
            )}
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

      {/* Desktop: 2-column layout, Mobile: single column */}
      <div className="px-6 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {/* Column 1: Score + AI Insights */}
        <div className="space-y-4 mb-6 md:mb-0">
          {/* Gut score card */}
          <Card glow className="py-6">
            <div className="flex items-center gap-6">
              <GutScore score={todayScore} size="lg" />
              <div>
                <p className="text-white/40 text-sm mb-1">Today&apos;s gut score</p>
                <p className="text-lg font-semibold">
                  {todayScore === 0 ? 'Log your first entry' : todayScore >= 7 ? 'Gut feeling good' : todayScore >= 4 ? 'Room to improve' : 'Rough day - take it easy'}
                </p>
                {todayScore === 0 && <p className="text-white/30 text-xs mt-1">Tap &ldquo;Log now&rdquo; to get your score</p>}
              </div>
            </div>
            {/* Goal progress */}
            {todayScore > 0 && (profile?.gut_profile as Record<string, unknown>)?.scoreGoal && (
              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/40">Goal: {(profile?.gut_profile as Record<string, unknown>).scoreGoal as number}/10</span>
                  <span className={todayScore >= ((profile?.gut_profile as Record<string, unknown>).scoreGoal as number) ? 'text-[#4ADE80]' : 'text-white/40'}>
                    {todayScore >= ((profile?.gut_profile as Record<string, unknown>).scoreGoal as number) ? 'On target!' : `${((profile?.gut_profile as Record<string, unknown>).scoreGoal as number) - todayScore} to go`}
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${todayScore >= ((profile?.gut_profile as Record<string, unknown>).scoreGoal as number) ? 'bg-[#4ADE80]' : 'bg-gradient-to-r from-[#00B4B4] to-[#4ADE80]'}`}
                    style={{ width: `${Math.min((todayScore / ((profile?.gut_profile as Record<string, unknown>).scoreGoal as number)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Profile completeness */}
          {profileCompleteness < 100 && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/40 text-xs uppercase tracking-wide">Gut profile</p>
                <span className="text-[#4ADE80] text-xs font-medium">{profileCompleteness}%</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2 mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] transition-all"
                  style={{ width: `${profileCompleteness}%` }}
                />
              </div>
              <div className="space-y-1.5">
                {completenessItems.filter(i => !i.done).slice(0, 2).map((item) => (
                  <Link key={item.label} href={item.href} className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors">
                    <span className="w-4 h-4 rounded border border-white/20 shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Proactive nudge */}
          {nudge && (
            <Card className="border-[#00B4B4]/20 bg-[#00B4B4]/5">
              <div className="flex items-start gap-3">
                <span className="text-lg">💬</span>
                <div className="flex-1">
                  <p className="text-sm text-white/70">{nudge.text}</p>
                  <Link href={nudge.action} className="text-[#4ADE80] text-xs mt-2 inline-block hover:underline">{nudge.cta} →</Link>
                </div>
              </div>
            </Card>
          )}

          {/* Daily AI insight */}
          {dailyInsight && (
            <Card className="border-[#4ADE80]/20 bg-[#4ADE80]/5">
              <div className="flex items-start gap-3">
                <span className="text-lg">{insightIcons[dailyInsight.type] || '💡'}</span>
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Daily insight</p>
                  <p className="text-sm text-white/70 leading-relaxed">{dailyInsight.insight}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Patterns */}
          {patterns.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Patterns detected</p>
              <div className="space-y-3">
                {patterns.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[#00B4B4] shrink-0 mt-0.5">🔍</span>
                    <div>
                      <p className="text-sm text-white/70">{p.detail}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={p.confidence === 'high' ? 'green' : 'amber'}>{p.confidence}</Badge>
                        {p.occurrences && <span className="text-white/30 text-xs">{p.occurrences}x observed</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Trigger Foods */}
          {triggerFoods.length > 0 && (
            <Card className="border-red-500/20 bg-red-500/5">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Trigger foods</p>
              <div className="space-y-2">
                {triggerFoods.map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-sm">⚠️</span>
                      <span className="text-sm text-white/70">{f.food}</span>
                    </div>
                    <Badge variant="red">{f.avgScoreAfter}/10</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Beneficial Foods */}
          {beneficialFoods.length > 0 && (
            <Card className="border-[#4ADE80]/20 bg-[#4ADE80]/5">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Gut-friendly foods</p>
              <div className="space-y-2">
                {beneficialFoods.map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[#4ADE80] text-sm">✓</span>
                      <span className="text-sm text-white/70">{f.food}</span>
                    </div>
                    <Badge variant="green">{f.avgScoreAfter}/10</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Column 2: Quick actions + Recent logs */}
        <div className="space-y-4 mb-6 md:mb-0">
          {/* Quick actions */}
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Quick actions</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { href: '/dashboard/log', emoji: '🎤', label: 'Log now' },
                { href: '/dashboard/upload', emoji: '📄', label: 'Upload test' },
                { href: '/dashboard/meal-plan', emoji: '🍽️', label: 'Meal plan' },
                { href: '/dashboard/food-checker', emoji: '🔍', label: 'Food check' },
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
          <div>
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
                {logs.slice(0, 5).map(log => (
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
        </div>

        {/* Column 3 (desktop lg only): Streak + Upsell */}
        <div className="space-y-4 hidden lg:block">
          {/* Streak card with milestones */}
          {streak > 0 && (
            <Card className="text-center py-6">
              <div className="text-4xl mb-2">{streak >= 90 ? '🏆' : streak >= 30 ? '💎' : streak >= 7 ? '🔥' : streak >= 3 ? '✨' : '📝'}</div>
              <p className="text-3xl font-bold gradient-text mb-1">{streak}</p>
              <p className="text-white/40 text-sm">day{streak !== 1 ? 's' : ''} logging streak</p>
              {streak >= 90 && <p className="text-[#4ADE80] text-xs mt-2">Gut health master! 90+ days</p>}
              {streak >= 30 && streak < 90 && <p className="text-[#4ADE80] text-xs mt-2">Incredible! 30+ day streak</p>}
              {streak >= 7 && streak < 30 && <p className="text-[#4ADE80] text-xs mt-2">Amazing consistency!</p>}
              {streak >= 3 && streak < 7 && <p className="text-[#4ADE80] text-xs mt-2">Keep it going!</p>}

              {/* Milestone progress */}
              <div className="mt-4 px-4">
                <div className="flex justify-between text-xs text-white/30 mb-1">
                  {[7, 30, 90].map(m => (
                    <span key={m} className={streak >= m ? 'text-[#4ADE80]' : ''}>{m}d{streak >= m ? ' ✓' : ''}</span>
                  ))}
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] transition-all"
                    style={{ width: `${Math.min((streak / 90) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Upsell if free */}
          {profile?.plan === 'free' && (
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
          )}

          {/* Pull to refresh indicator (desktop) */}
          <button
            onClick={refresh}
            disabled={refreshing}
            className="w-full text-center text-white/20 text-xs hover:text-white/40 transition-colors py-2"
          >
            {refreshing ? 'Refreshing...' : 'Refresh dashboard'}
          </button>
        </div>
      </div>

      {/* Mobile-only: Streak + Upsell (below main content) */}
      <div className="px-6 lg:hidden">
        {/* Streak badge (inline on mobile) */}
        {streak > 1 && (
          <div className="mb-4">
            <Card className="flex items-center gap-4 py-3">
              <div className="text-2xl">{streak >= 90 ? '🏆' : streak >= 30 ? '💎' : streak >= 7 ? '🔥' : streak >= 3 ? '✨' : '📝'}</div>
              <div className="flex-1">
                <p className="font-semibold">{streak}-day streak</p>
                <p className="text-white/40 text-xs">
                  {streak >= 90 ? 'Gut health master!' : streak >= 30 ? 'Incredible! 30+ days' : streak >= 7 ? 'Amazing consistency!' : 'Keep it going!'}
                </p>
                <div className="flex gap-1 mt-1.5">
                  {[7, 30, 90].map(m => (
                    <span key={m} className={`text-[10px] px-1.5 py-0.5 rounded ${streak >= m ? 'bg-[#4ADE80]/20 text-[#4ADE80]' : 'bg-white/5 text-white/20'}`}>{m}d</span>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Upsell if free (mobile) */}
        {profile?.plan === 'free' && (
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
        )}
      </div>

      <Navigation />
    </div>
  )
}
