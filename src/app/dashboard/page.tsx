'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DashboardSkeleton } from '@/components/ui/Skeleton'
import { CardCarousel } from '@/components/CardCarousel'
import { BottomSheet } from '@/components/BottomSheet'
import { SectionNav } from '@/components/SectionNav'
import { LogContent } from '@/components/content/LogContent'
import { HistoryContent } from '@/components/content/HistoryContent'
import { CoachContent } from '@/components/content/CoachContent'
import { haptic } from '@/lib/haptics'
import { useToast } from '@/components/ToastProvider'
import { getUnlockStatus } from '@/lib/unlock-status'

interface Profile { name: string; plan: string; gut_profile: Record<string, unknown> }
interface Log { id: string; type: string; content: string; gut_score: number; logged_at: string }
interface Pattern { trigger: string; effect: string; confidence: string; detail: string; occurrences?: number }
interface TriggerFood { food: string; avgScoreAfter: number; timesLogged: number; symptoms: string[] }
interface BeneficialFood { food: string; avgScoreAfter: number; timesLogged: number; benefits: string[] }

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const initialTab = searchParams.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [todayScore, setTodayScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [dailyInsight, setDailyInsight] = useState<{ insight: string; type: string } | null>(null)
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [hasLoggedToday, setHasLoggedToday] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [patternSheetOpen, setPatternSheetOpen] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [triggerFoods, setTriggerFoods] = useState<TriggerFood[]>([])
  const [beneficialFoods, setBeneficialFoods] = useState<BeneficialFood[]>([])
  const [profileCompleteness, setProfileCompleteness] = useState(0)
  const [completenessItems, setCompletenessItems] = useState<{ label: string; done: boolean; href: string }[]>([])
  const [logCount, setLogCount] = useState(0)
  const [docCount, setDocCount] = useState(0)
  const [hasRestrictions, setHasRestrictions] = useState(false)

  useEffect(() => {
    if (searchParams.get('upgraded') === '1') {
      toast('Welcome to your new plan! Your premium features are now active.', 'success')
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams, toast])

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
    setLogCount(allLogs.length)
    setHasRestrictions(!!(p?.gut_profile as Record<string, unknown>)?.restrictions)

    const scores = allLogs.filter(log => log.gut_score).map(log => log.gut_score)
    setTodayScore(scores.length ? Math.round(scores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(scores.length, 3)) : 0)

    const today = new Date().toDateString()
    setHasLoggedToday(allLogs.some(log => new Date(log.logged_at).toDateString() === today))

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
    const { count: dc } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    setDocCount(dc || 0)
    const items = [
      { label: 'Complete onboarding', done: !!p?.onboarding_complete, href: '/onboarding' },
      { label: 'Log at least 5 entries', done: allLogs.length >= 5, href: '/dashboard/log' },
      { label: 'Upload a gut test', done: (dc || 0) > 0, href: '/dashboard/upload' },
      { label: 'Generate a meal plan', done: false, href: '/dashboard/meal-plan' },
      { label: 'Set dietary restrictions', done: !!(gutProfile as Record<string, unknown>).restrictions, href: '/onboarding' },
    ]
    const { count: mealCount } = await supabase.from('meal_plans').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    items[3].done = (mealCount || 0) > 0
    setCompletenessItems(items)
    setProfileCompleteness(Math.round((items.filter(i => i.done).length / items.length) * 100))

    setLoading(false)

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
    haptic.refresh()
    setRefreshing(false)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const getNudge = () => {
    if (!hasLoggedToday) return { text: "You haven't logged today — how's your gut feeling?", action: '/dashboard/log', cta: 'Log now' }
    const recentScores = logs.slice(0, 5).filter(l => l.gut_score).map(l => l.gut_score)
    const avgRecent = recentScores.length ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0
    if (avgRecent > 0 && avgRecent < 4) return { text: "Your scores have been low. Let's look at what might be causing it.", action: '/dashboard/history', cta: 'View history' }
    return null
  }
  const nudge = getNudge()
  const insightIcons: Record<string, string> = { tip: '💡', pattern: '🔍', encouragement: '🌟', warning: '⚠️' }

  // Contextual line below score — show the most important one
  const contextLine = nudge?.text
    || (dailyInsight ? `${insightIcons[dailyInsight.type] || '💡'} ${dailyInsight.insight}` : null)
    || (todayScore === 0 ? 'Log your first entry to get your score' : todayScore >= 7 ? 'Gut feeling good' : todayScore >= 4 ? 'Room to improve' : 'Rough day — take it easy')

  const unlock = getUnlockStatus(logCount, docCount, hasRestrictions)
  const gutTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'log', label: 'Log' },
    { key: 'history', label: 'History', locked: !unlock.history.unlocked, lockMessage: unlock.history.requirement },
    { key: 'coach', label: 'Coach', locked: !unlock.coach.unlocked, lockMessage: unlock.coach.requirement },
  ]

  // If user selects a locked tab, show the lock message instead
  const activeTabLocked = gutTabs.find(t => t.key === activeTab)?.locked
  const handleTabChange = (key: string) => {
    const tab = gutTabs.find(t => t.key === key)
    if (tab?.locked) return
    setActiveTab(key)
  }

  if (loading) return <DashboardSkeleton />

  return (
    <>
      {/* Mobile: viewport-locked no-scroll layout */}
      <div className="mobile-viewport md:hidden">
        {/* Zone 1: Compact Header */}
        <div className="px-6 pt-10 pb-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/icon.png" alt="gutted." width={28} height={28} className="h-7 w-7" />
              <div>
                <p className="text-white/50 text-xs">{greeting},</p>
                <h1 className="text-lg font-bold leading-tight">{profile?.name || 'friend'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {streak > 1 && (
                <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-0.5">
                  <span className="text-xs">🔥</span>
                  <span className="text-[10px] font-semibold text-orange-400">{streak}</span>
                </div>
              )}
              {profile?.plan !== 'free' && (
                <Link href="/dashboard/settings">
                  <Badge variant="teal">{profile?.plan}</Badge>
                </Link>
              )}
              <Link href="/dashboard/settings" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/40">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Section Nav */}
        <div className="px-6 pb-2">
          <SectionNav tabs={gutTabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Tab Content */}
        {activeTab === 'log' && <div className="flex-1 overflow-y-auto pb-nav"><LogContent embedded /></div>}
        {activeTab === 'history' && <div className="flex-1 overflow-y-auto pb-nav"><HistoryContent embedded /></div>}
        {activeTab === 'coach' && <div className="flex-1 overflow-y-auto pb-nav"><CoachContent /></div>}

        {activeTab === 'overview' && <div className="flex-1 overflow-y-auto pb-nav">
        {/* Zone 2: Hero Score or Welcome */}
        <div className="px-6 py-4">
          {logCount === 0 ? (
            <Card glow className="flex flex-col items-center py-8 animate-fade-up">
              <div className="text-4xl mb-3">👋</div>
              <h2 className="text-xl font-bold mb-2">Let's get to know your gut</h2>
              <p className="text-white/50 text-sm text-center mb-4 px-4">
                Start by logging how you feel. The more you log, the smarter your insights become.
              </p>
              <button
                onClick={() => { haptic.tap(); setActiveTab('log') }}
                className="text-[#4ADE80] text-sm font-medium hover:underline"
              >
                Log your first entry →
              </button>
              <div className="mt-6 w-full space-y-2 px-4">
                <p className="text-white/30 text-[10px] uppercase tracking-wide text-center mb-2">What unlocks as you log</p>
                {[
                  { count: '1 log', feature: 'Gut Score & Overview' },
                  { count: '3 logs', feature: 'History & Trends' },
                  { count: '5 logs', feature: 'AI Coach & Patterns' },
                ].map(item => (
                  <div key={item.feature} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
                    <svg className="w-3.5 h-3.5 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span className="text-xs text-white/40">{item.count}</span>
                    <span className="text-xs text-white/60">{item.feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card glow className="flex flex-col items-center py-6 animate-fade-up">
              <GutScore score={todayScore} size="lg" />
              <p className="text-white/50 text-sm mt-3 text-center line-clamp-2 px-4 animate-fade-up stagger-1">
                {contextLine}
              </p>
              {nudge && (
                <button onClick={() => { haptic.tap(); setActiveTab('log') }} className="text-[#4ADE80] text-xs mt-2 hover:underline animate-fade-up stagger-2">
                  {nudge.cta} →
                </button>
              )}
              {patterns.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 justify-center animate-fade-up stagger-3">
                  {patterns.slice(0, 3).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { haptic.tap(); setPatternSheetOpen(true) }}
                      className="bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] text-white/50 active:scale-[0.97]"
                    >
                      🔍 {p.trigger}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Zone 3: Quick Actions + Carousel */}
        <div className="flex flex-col px-6 min-h-0">
          {/* Quick actions */}
          <div className="flex-none mb-3 animate-fade-up stagger-2">
            <div className="grid grid-cols-4 gap-2">
              {[
                { href: '/dashboard/log', emoji: '🎤', label: 'Log now' },
                { href: '/dashboard/upload', emoji: '📄', label: 'Upload' },
                { href: '/dashboard/meal-plan', emoji: '🍽️', label: 'Meals' },
                { href: '/dashboard/food-checker', emoji: '🔍', label: 'Food check' },
              ].map(({ href, emoji, label }) => (
                <Link key={href} href={href} onClick={() => haptic.light()}>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center hover:border-[#00B4B4]/30 transition-colors active:scale-[0.97]">
                    <div className="text-xl mb-0.5">{emoji}</div>
                    <p className="text-[10px] text-white/60">{label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Card carousel */}
          <div className="flex-1 min-h-0 animate-fade-up stagger-3">
            <CardCarousel>
              {/* Card 1: Recent logs */}
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/40 text-xs uppercase tracking-wide">Recent logs</p>
                  <Link href="/dashboard/history" className="text-[#4ADE80] text-xs">View all</Link>
                </div>
                {logs.length === 0 ? (
                  <Card className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-xl mb-1">🎤</p>
                    <p className="text-white/50 text-xs">No logs yet</p>
                    <Link href="/dashboard/log" className="text-[#4ADE80] text-xs mt-2">Log now</Link>
                  </Card>
                ) : (
                  <div className="space-y-2 flex-1">
                    {logs.slice(0, 3).map(log => (
                      <Card key={log.id}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs shrink-0">{log.type === 'voice' ? '🎤' : '✏️'}</span>
                            <p className="text-xs text-white/60 truncate">{log.content}</p>
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

              {/* Card 2: Daily insight or patterns */}
              <div className="h-full flex flex-col">
                {dailyInsight ? (
                  <Card className="flex-1 border-[#4ADE80]/20 bg-[#4ADE80]/5">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{insightIcons[dailyInsight.type] || '💡'}</span>
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Daily insight</p>
                        <p className="text-sm text-white/70 leading-relaxed">{dailyInsight.insight}</p>
                      </div>
                    </div>
                  </Card>
                ) : patterns.length > 0 ? (
                  <Card className="flex-1">
                    <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Patterns</p>
                    <div className="space-y-2">
                      {patterns.slice(0, 3).map((p, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[#00B4B4] text-xs shrink-0">🔍</span>
                          <p className="text-xs text-white/60">{p.detail}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card className="flex-1 flex flex-col items-center justify-center">
                    <p className="text-xl mb-1">💡</p>
                    <p className="text-white/50 text-xs text-center">Log a few more days to unlock AI insights</p>
                  </Card>
                )}
              </div>

              {/* Card 3: Streak + refresh */}
              <div className="h-full flex flex-col">
                {streak > 1 && (
                  <Card className="mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{streak >= 7 ? '🔥' : streak >= 3 ? '✨' : '📝'}</div>
                      <div>
                        <p className="font-semibold text-sm">{streak}-day streak</p>
                        <p className="text-white/40 text-xs">{streak >= 7 ? 'Amazing consistency!' : 'Keep it going!'}</p>
                      </div>
                    </div>
                  </Card>
                )}
                {profile?.plan === 'free' && (
                  <Card className="flex-1 bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border-[#00B4B4]/20">
                    <p className="font-semibold text-sm mb-1">Unlock your full gut profile</p>
                    <p className="text-white/50 text-xs mb-2">Upload a gut test and get a personalised weekly meal plan.</p>
                    <button
                      disabled={upgrading}
                      onClick={async () => {
                        setUpgrading(true)
                        try {
                          const res = await fetch('/api/stripe/checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ plan: 'core' }),
                          })
                          const { url } = await res.json()
                          if (url) window.location.href = url
                          else setUpgrading(false)
                        } catch { setUpgrading(false) }
                      }}
                      className="text-[#4ADE80] text-xs font-medium hover:underline disabled:opacity-50"
                    >{upgrading ? 'Redirecting...' : 'Upgrade to Core — $14/mo →'}</button>
                  </Card>
                )}
                <button
                  onClick={refresh}
                  disabled={refreshing}
                  className="mt-auto text-center text-white/20 text-xs hover:text-white/40 transition-colors py-2"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh dashboard'}
                </button>
              </div>
            </CardCarousel>
          </div>
        </div>
        </div>}
      </div>

      {/* Desktop: original layout preserved */}
      <div className="hidden md:block min-h-screen bg-black pb-8 md:ml-60 lg:ml-64">
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
                <Link href="/dashboard/settings">
                  <Badge variant="teal">{profile?.plan}</Badge>
                </Link>
              )}
              <Link href="/dashboard/settings" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </Link>
            </div>
          </div>
          <p className="text-white/50 text-sm">{greeting},</p>
          <h1 className="text-2xl font-bold mt-0.5">{profile?.name || 'friend'}</h1>
        </div>

        {/* Section Nav - Desktop */}
        <div className="px-6 pb-4">
          <SectionNav tabs={gutTabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Tab Content - Desktop */}
        {activeTab === 'log' && <div className="px-6"><LogContent /></div>}
        {activeTab === 'history' && <div className="px-6"><HistoryContent /></div>}
        {activeTab === 'coach' && <div className="px-6"><CoachContent /></div>}

        {activeTab === 'overview' && <div className="px-6 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          <div className="space-y-4 mb-6 md:mb-0">
            <Card glow className="flex items-center gap-6 py-6 animate-fade-up">
              <GutScore score={todayScore} size="lg" />
              <div>
                <p className="text-white/40 text-sm mb-1">Today&apos;s gut score</p>
                <p className="text-lg font-semibold">
                  {todayScore === 0 ? 'Log your first entry' : todayScore >= 7 ? 'Gut feeling good' : todayScore >= 4 ? 'Room to improve' : 'Rough day - take it easy'}
                </p>
                {todayScore === 0 && <p className="text-white/30 text-xs mt-1">Tap &ldquo;Log now&rdquo; to get your score</p>}
              </div>
            </Card>

            {nudge && (
              <Card className="border-[#00B4B4]/20 bg-[#00B4B4]/5 animate-fade-up stagger-1">
                <div className="flex items-start gap-3">
                  <span className="text-lg">💬</span>
                  <div className="flex-1">
                    <p className="text-sm text-white/70">{nudge.text}</p>
                    <Link href={nudge.action} className="text-[#4ADE80] text-xs mt-2 inline-block hover:underline">{nudge.cta} →</Link>
                  </div>
                </div>
              </Card>
            )}

            {dailyInsight && (
              <Card className="border-[#4ADE80]/20 bg-[#4ADE80]/5 animate-fade-up stagger-2">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{insightIcons[dailyInsight.type] || '💡'}</span>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Daily insight</p>
                    <p className="text-sm text-white/70 leading-relaxed">{dailyInsight.insight}</p>
                  </div>
                </div>
              </Card>
            )}

            {patterns.length > 0 && (
              <Card className="animate-fade-up stagger-3">
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

            {profileCompleteness < 100 && (
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/40 text-xs uppercase tracking-wide">Gut profile</p>
                  <span className="text-[#4ADE80] text-xs font-medium">{profileCompleteness}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 mb-3">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] transition-all" style={{ width: `${profileCompleteness}%` }} />
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
          </div>

          <div className="space-y-4 mb-6 md:mb-0">
            <div className="animate-fade-up stagger-1">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Quick actions</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { href: '/dashboard/log', emoji: '🎤', label: 'Log now' },
                  { href: '/dashboard/upload', emoji: '📄', label: 'Upload test' },
                  { href: '/dashboard/meal-plan', emoji: '🍽️', label: 'Meal plan' },
                ].map(({ href, emoji, label }) => (
                  <Link key={href} href={href}>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-[#00B4B4]/30 transition-colors active:scale-[0.97]">
                      <div className="text-2xl mb-1">{emoji}</div>
                      <p className="text-xs text-white/60">{label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="animate-fade-up stagger-2">
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

          <div className="space-y-4 hidden lg:block">
            {streak > 0 && (
              <Card className="text-center py-6 animate-fade-up">
                <div className="text-4xl mb-2">{streak >= 90 ? '🏆' : streak >= 30 ? '💎' : streak >= 7 ? '🔥' : streak >= 3 ? '✨' : '📝'}</div>
                <p className="text-3xl font-bold gradient-text mb-1">{streak}</p>
                <p className="text-white/40 text-sm">day{streak !== 1 ? 's' : ''} logging streak</p>
                {streak >= 90 && <p className="text-[#4ADE80] text-xs mt-2">Gut health master! 90+ days</p>}
                {streak >= 30 && streak < 90 && <p className="text-[#4ADE80] text-xs mt-2">Incredible! 30+ day streak</p>}
                {streak >= 7 && streak < 30 && <p className="text-[#4ADE80] text-xs mt-2">Amazing consistency!</p>}
                {streak >= 3 && streak < 7 && <p className="text-[#4ADE80] text-xs mt-2">Keep it going!</p>}
                <div className="mt-4 px-4">
                  <div className="flex justify-between text-xs text-white/30 mb-1">
                    {[7, 30, 90].map(m => (
                      <span key={m} className={streak >= m ? 'text-[#4ADE80]' : ''}>{m}d{streak >= m ? ' ✓' : ''}</span>
                    ))}
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] transition-all" style={{ width: `${Math.min((streak / 90) * 100, 100)}%` }} />
                  </div>
                </div>
              </Card>
            )}
            {profile?.plan === 'free' && (
              <div className="bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border border-[#00B4B4]/20 rounded-2xl p-4 animate-fade-up stagger-1">
                <p className="font-semibold mb-1">Unlock your full gut profile</p>
                <p className="text-white/50 text-sm mb-3">Upload a gut test and get a personalised weekly meal plan.</p>
                <button
                  disabled={upgrading}
                  onClick={async () => {
                    setUpgrading(true)
                    try {
                      const res = await fetch('/api/stripe/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ plan: 'core' }),
                      })
                      const { url } = await res.json()
                      if (url) window.location.href = url
                      else setUpgrading(false)
                    } catch { setUpgrading(false) }
                  }}
                  className="text-[#4ADE80] text-sm font-medium hover:underline disabled:opacity-50"
                >{upgrading ? 'Redirecting...' : 'Upgrade to Core — $14/mo →'}</button>
              </div>
            )}
            <button
              onClick={refresh}
              disabled={refreshing}
              className="w-full text-center text-white/20 text-xs hover:text-white/40 transition-colors py-2"
            >
              {refreshing ? 'Refreshing...' : 'Refresh dashboard'}
            </button>
          </div>
        </div>}
      </div>

      {/* Pattern detail bottom sheet */}
      <BottomSheet open={patternSheetOpen} onClose={() => setPatternSheetOpen(false)} title="Patterns detected">
        <div className="space-y-4">
          {patterns.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-[#00B4B4] shrink-0 mt-0.5">🔍</span>
              <div>
                <p className="text-sm text-white/70">{p.detail}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={p.confidence === 'high' ? 'green' : 'amber'}>{p.confidence}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>
    </>
  )
}
