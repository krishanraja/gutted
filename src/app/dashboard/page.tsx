'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { GutScore } from '@/components/GutScore'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/Avatar'
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
import { GuidedLogWizard } from '@/components/GuidedLogWizard'
import {
  MicIcon, FileTextIcon, UtensilsIcon, SearchIcon, FlameIcon, BulbIcon,
  AlertIcon, CheckIcon, PencilIcon, SettingsIcon, ArrowRightIcon, ChatIcon,
} from '@/components/icons'

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
  const [userId, setUserId] = useState('')

  useEffect(() => {
    if (searchParams.get('upgraded') === '1') {
      toast("You're on the new plan. Premium features are active.", 'success')
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams, toast])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }
    setUserId(user.id)

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

  // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(audit-#19): mount-time data load. Migrate to React 19 `use()` + Suspense as part of file split.
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
    if (!hasLoggedToday) return { text: "You haven't logged today. How's your gut?", action: '/dashboard/log', cta: 'New log' }
    const recentScores = logs.slice(0, 5).filter(l => l.gut_score).map(l => l.gut_score)
    const avgRecent = recentScores.length ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0
    if (avgRecent > 0 && avgRecent < 4) return { text: 'Your scores have been low. Take a look at the pattern.', action: '/dashboard/history', cta: 'View history' }
    return null
  }
  const nudge = getNudge()

  // Contextual line below score -- show the most important one
  const contextLine = nudge?.text
    || dailyInsight?.insight
    || (todayScore === 0 ? 'Log your first entry to get your score' : todayScore >= 7 ? 'Gut feeling good.' : todayScore >= 4 ? 'Room to improve.' : 'Rough day. Take it easy.')

  const unlock = getUnlockStatus(logCount, docCount, hasRestrictions)
  const gutTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'log', label: 'Log' },
    { key: 'history', label: 'History', locked: !unlock.history.unlocked, lockMessage: unlock.history.requirement },
    { key: 'coach', label: 'Coach', locked: !unlock.coach.unlocked, lockMessage: unlock.coach.requirement },
  ]

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
        <div className="px-5 pt-safe pb-2 animate-fade-in">
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <Image src="/icon.png" alt="gutted." width={28} height={28} className="h-7 w-7" />
              <div>
                <p className="text-white/45 text-[11px] uppercase tracking-wider">{greeting}</p>
                <h1 className="text-base font-medium leading-tight">{profile?.name || 'You'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {streak > 1 && (
                <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1">
                  <FlameIcon size={12} className="text-[#E8AE1E]" />
                  <span className="num text-[11px] font-medium text-white/75">{streak}</span>
                </div>
              )}
              <Link href="/dashboard/settings" aria-label="Profile" className="rounded-full hover:bg-white/5 transition-colors">
                <Avatar size="sm" name={profile?.name} />
              </Link>
              <Link href="/dashboard/settings" aria-label="Settings" className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-white/40">
                <SettingsIcon size={18} />
              </Link>
            </div>
          </div>
        </div>

        {/* Section Nav */}
        <div className="px-5">
          <SectionNav tabs={gutTabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Tab Content */}
        {activeTab === 'log' && <div className="flex-1 overflow-y-auto pb-nav"><LogContent embedded /></div>}
        {activeTab === 'history' && <div className="flex-1 overflow-y-auto pb-nav"><HistoryContent embedded /></div>}
        {activeTab === 'coach' && <div className="flex-1 overflow-y-auto pb-nav"><CoachContent /></div>}

        {activeTab === 'overview' && <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-nav">
        {/* Zone 2: Hero Score or Welcome */}
        <div className={`px-5 py-3 ${logCount < 3 ? 'flex-1 min-h-0' : 'flex-none'}`}>
          {logCount < 3 ? (
            <GuidedLogWizard
              logCount={logCount}
              userProfile={profile?.gut_profile || null}
              userId={userId}
              onComplete={() => load()}
            />
          ) : (
            <Card className="flex flex-col items-center py-5 animate-fade-up">
              <GutScore score={todayScore} size="lg" />
              <p className="text-white/55 text-sm mt-4 text-center line-clamp-2 px-4 animate-fade-up stagger-1">
                {contextLine}
              </p>
              {nudge && (
                <button
                  onClick={() => { haptic.tap(); setActiveTab('log') }}
                  className="inline-flex items-center gap-1 text-accent text-xs mt-2 hover:text-white transition-colors animate-fade-up stagger-2"
                >
                  {nudge.cta} <ArrowRightIcon size={12} />
                </button>
              )}
              {patterns.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 justify-center animate-fade-up stagger-3">
                  {patterns.slice(0, 3).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { haptic.tap(); setPatternSheetOpen(true) }}
                      className="inline-flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-[11px] text-white/55 hover:text-white/80 active:scale-[0.98]"
                    >
                      <SearchIcon size={11} /> {p.trigger}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Zone 3: Quick Actions + Carousel (hidden during onboarding wizard) */}
        {logCount >= 3 && <div className="flex-1 min-h-0 flex flex-col px-5">
          {/* Quick actions */}
          <div className="flex-none mb-3 animate-fade-up stagger-2">
            <div className="grid grid-cols-4 gap-2">
              {[
                { href: '/dashboard/log', Icon: MicIcon, label: 'Log' },
                { href: '/dashboard/upload', Icon: FileTextIcon, label: 'Upload' },
                { href: '/dashboard/meal-plan', Icon: UtensilsIcon, label: 'Meals' },
                { href: '/dashboard/food-checker', Icon: SearchIcon, label: 'Check' },
              ].map(({ href, Icon, label }) => (
                <Link key={href} href={href} onClick={() => haptic.light()}>
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-center hover:bg-white/[0.06] hover:border-white/15 transition-all active:scale-[0.98]">
                    <Icon size={18} className="mx-auto text-white/70" />
                    <p className="text-[11px] text-white/60 mt-1.5">{label}</p>
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
                  <p className="text-white/40 text-[11px] uppercase tracking-wider">Recent logs</p>
                  <Link href="/dashboard/history" className="text-accent text-xs hover:text-white transition-colors">All logs</Link>
                </div>
                {logs.length === 0 ? (
                  <Card className="flex-1 flex flex-col items-center justify-center">
                    <MicIcon size={20} className="text-white/30" />
                    <p className="text-white/55 text-xs mt-2">No logs yet</p>
                    <Link href="/dashboard/log" className="text-accent text-xs mt-2 hover:text-white transition-colors">New log</Link>
                  </Card>
                ) : (
                  <div className="space-y-2 flex-1">
                    {logs.slice(0, 3).map(log => (
                      <Card key={log.id}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {log.type === 'voice' ? <MicIcon size={12} className="text-white/40 shrink-0" /> : <PencilIcon size={12} className="text-white/40 shrink-0" />}
                            <p className="text-xs text-white/65 truncate">{log.content}</p>
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
                  <Card className="flex-1">
                    <div className="flex items-start gap-3">
                      <BulbIcon size={16} className="text-[#E8AE1E] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-white/40 text-[11px] uppercase tracking-wider mb-1">Daily insight</p>
                        <p className="text-sm text-white/75 leading-relaxed">{dailyInsight.insight}</p>
                      </div>
                    </div>
                  </Card>
                ) : patterns.length > 0 ? (
                  <Card className="flex-1">
                    <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Patterns</p>
                    <div className="space-y-2">
                      {patterns.slice(0, 3).map((p, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <SearchIcon size={12} className="text-accent shrink-0 mt-0.5" />
                          <p className="text-xs text-white/65">{p.detail}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card className="flex-1 flex flex-col items-center justify-center">
                    <BulbIcon size={20} className="text-white/30" />
                    <p className="text-white/55 text-xs text-center mt-2">Log a few more days to unlock AI insights.</p>
                  </Card>
                )}
              </div>

              {/* Card 3: Streak + upgrade + refresh */}
              <div className="h-full flex flex-col">
                {streak > 1 && (
                  <Card className="mb-2">
                    <div className="flex items-center gap-3">
                      <FlameIcon size={20} className="text-[#E8AE1E]" />
                      <div>
                        <p className="font-medium text-sm"><span className="num">{streak}</span>-day streak</p>
                        <p className="text-white/45 text-xs">{streak >= 7 ? 'Solid consistency.' : 'Keep going.'}</p>
                      </div>
                    </div>
                  </Card>
                )}
                {profile?.plan === 'free' && (
                  <Card className="flex-1">
                    <p className="font-medium text-sm mb-1">Unlock your full gut profile</p>
                    <p className="text-white/55 text-xs mb-3">Upload a gut test and get a weekly meal plan built from your data.</p>
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
                      className="inline-flex items-center gap-1 text-accent text-xs font-medium hover:text-white transition-colors disabled:opacity-50"
                    >{upgrading ? 'Redirecting…' : <>Upgrade to Core – $14/mo <ArrowRightIcon size={12} /></>}</button>
                  </Card>
                )}
                <button
                  onClick={refresh}
                  disabled={refreshing}
                  className="mt-auto text-center text-white/25 text-xs hover:text-white/50 transition-colors py-2"
                >
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </CardCarousel>
          </div>
        </div>}
        </div>}
      </div>

      {/* Desktop layout */}
      <div className="hidden md:block min-h-screen bg-black pb-8 md:ml-60 lg:ml-64">
        {/* Header */}
        <div className="px-6 pt-10 pb-6">
          <div className="flex items-center justify-between mb-6">
            <Image src="/icon.png" alt="gutted." width={32} height={32} className="h-8 w-8" />
            <div className="flex items-center gap-2">
              {streak > 1 && (
                <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1">
                  <FlameIcon size={14} className="text-[#E8AE1E]" />
                  <span className="num text-xs font-medium text-white/75">{streak}</span>
                </div>
              )}
              <Link href="/dashboard/settings" aria-label="Profile" className="rounded-full hover:bg-white/5 transition-colors">
                <Avatar size="sm" name={profile?.name} />
              </Link>
              <Link href="/dashboard/settings" aria-label="Settings" className="p-2 rounded-md hover:bg-white/5 transition-colors text-white/40 hover:text-white/70">
                <SettingsIcon size={18} />
              </Link>
            </div>
          </div>
          <p className="text-white/45 text-xs uppercase tracking-wider">{greeting}</p>
          <h1 className="text-2xl font-medium mt-1">{profile?.name || 'You'}</h1>
        </div>

        {/* Section Nav - Desktop */}
        <div className="px-6 mb-6">
          <SectionNav tabs={gutTabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Tab Content - Desktop */}
        {activeTab === 'log' && <div className="px-6"><LogContent /></div>}
        {activeTab === 'history' && <div className="px-6"><HistoryContent /></div>}
        {activeTab === 'coach' && <div className="px-6"><CoachContent /></div>}

        {activeTab === 'overview' && <div className="px-6 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          <div className="space-y-4 mb-6 md:mb-0">
            {logCount < 3 ? (
              <GuidedLogWizard
                logCount={logCount}
                userProfile={profile?.gut_profile || null}
                userId={userId}
                onComplete={() => load()}
              />
            ) : (
            <Card className="flex items-center gap-6 py-6 animate-fade-up">
              <GutScore score={todayScore} size="lg" />
              <div>
                <p className="text-white/45 text-xs uppercase tracking-wider mb-1">Today&apos;s gut score</p>
                <p className="text-base font-medium">
                  {todayScore === 0 ? 'Log your first entry' : todayScore >= 7 ? 'Gut feeling good' : todayScore >= 4 ? 'Room to improve' : 'Rough day. Take it easy.'}
                </p>
                {todayScore === 0 && <p className="text-white/35 text-xs mt-1">Log to get your score.</p>}
              </div>
            </Card>
            )}

            {nudge && (
              <Card className="animate-fade-up stagger-1">
                <div className="flex items-start gap-3">
                  <ChatIcon size={16} className="text-accent shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-white/75">{nudge.text}</p>
                    <Link href={nudge.action} className="inline-flex items-center gap-1 text-accent text-xs mt-2 hover:text-white transition-colors">{nudge.cta} <ArrowRightIcon size={12} /></Link>
                  </div>
                </div>
              </Card>
            )}

            {dailyInsight && (
              <Card className="animate-fade-up stagger-2">
                <div className="flex items-start gap-3">
                  <BulbIcon size={16} className="text-[#E8AE1E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/40 text-[11px] uppercase tracking-wider mb-1">Daily insight</p>
                    <p className="text-sm text-white/75 leading-relaxed">{dailyInsight.insight}</p>
                  </div>
                </div>
              </Card>
            )}

            {patterns.length > 0 && (
              <Card className="animate-fade-up stagger-3">
                <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Patterns detected</p>
                <div className="space-y-3">
                  {patterns.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <SearchIcon size={14} className="text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-white/75">{p.detail}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant={p.confidence === 'high' ? 'green' : 'amber'}>{p.confidence}</Badge>
                          {p.occurrences && <span className="num text-white/35 text-xs">{p.occurrences}× observed</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {triggerFoods.length > 0 && (
              <Card>
                <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Trigger foods</p>
                <div className="space-y-2">
                  {triggerFoods.map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertIcon size={14} className="text-[#E96363]" />
                        <span className="text-sm text-white/75">{f.food}</span>
                      </div>
                      <Badge variant="red">{f.avgScoreAfter}/10</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {beneficialFoods.length > 0 && (
              <Card>
                <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Gut-friendly foods</p>
                <div className="space-y-2">
                  {beneficialFoods.map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckIcon size={14} className="text-[#3FBE6F]" />
                        <span className="text-sm text-white/75">{f.food}</span>
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
                  <p className="text-white/40 text-[11px] uppercase tracking-wider">Gut profile</p>
                  <span className="num text-accent text-xs font-medium">{profileCompleteness}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-3">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${profileCompleteness}%` }} />
                </div>
                <div className="space-y-1.5">
                  {completenessItems.filter(i => !i.done).slice(0, 2).map((item) => (
                    <Link key={item.label} href={item.href} className="flex items-center gap-2 text-sm text-white/55 hover:text-white/80 transition-colors">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4 mb-6 md:mb-0">
            <div className="animate-fade-up stagger-1">
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Quick actions</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { href: '/dashboard/log', Icon: MicIcon, label: 'New log' },
                  { href: '/dashboard/upload', Icon: FileTextIcon, label: 'Upload test' },
                  { href: '/dashboard/meal-plan', Icon: UtensilsIcon, label: 'Meal plan' },
                ].map(({ href, Icon, label }) => (
                  <Link key={href} href={href}>
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center hover:bg-white/[0.06] hover:border-white/15 transition-all active:scale-[0.98]">
                      <Icon size={20} className="mx-auto text-white/70" />
                      <p className="text-xs text-white/65 mt-2">{label}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="animate-fade-up stagger-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/40 text-[11px] uppercase tracking-wider">Recent logs</p>
                <Link href="/dashboard/history" className="text-accent text-xs hover:text-white transition-colors">All logs</Link>
              </div>
              {logs.length === 0 ? (
                <Card className="text-center py-8">
                  <MicIcon size={22} className="mx-auto text-white/30" />
                  <p className="text-white/55 text-sm mt-2">No logs yet. Start by recording how you feel.</p>
                  <Link href="/dashboard/log" className="inline-block mt-3 text-accent text-sm hover:text-white transition-colors">New log</Link>
                </Card>
              ) : (
                <div className="space-y-3">
                  {logs.slice(0, 5).map(log => (
                    <Card key={log.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {log.type === 'voice' ? <MicIcon size={12} className="text-white/40" /> : <PencilIcon size={12} className="text-white/40" />}
                            <span className="num text-white/35 text-xs">{new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-sm text-white/75 truncate">{log.content}</p>
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
                <FlameIcon size={28} className="mx-auto text-[#E8AE1E]" />
                <p className="num text-3xl font-semibold mt-2 tracking-tight">{streak}</p>
                <p className="text-white/45 text-sm">day{streak !== 1 ? 's' : ''} logging streak</p>
                {streak >= 90 && <p className="text-[#3FBE6F] text-xs mt-2">Gut-health master. 90+ days.</p>}
                {streak >= 30 && streak < 90 && <p className="text-[#3FBE6F] text-xs mt-2">30+ day streak.</p>}
                {streak >= 7 && streak < 30 && <p className="text-[#3FBE6F] text-xs mt-2">Solid consistency.</p>}
                {streak >= 3 && streak < 7 && <p className="text-[#3FBE6F] text-xs mt-2">Keep it going.</p>}
                <div className="mt-4 px-4">
                  <div className="flex justify-between text-xs text-white/30 mb-1.5 num">
                    {[7, 30, 90].map(m => (
                      <span key={m} className={streak >= m ? 'text-[#3FBE6F]' : ''}>{m}d{streak >= m ? ' ✓' : ''}</span>
                    ))}
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min((streak / 90) * 100, 100)}%` }} />
                  </div>
                </div>
              </Card>
            )}
            {profile?.plan === 'free' && (
              <Card>
                <p className="font-medium mb-1">Unlock your full gut profile</p>
                <p className="text-white/55 text-sm mb-3">Upload a gut test and get a weekly meal plan built from your data.</p>
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
                  className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors disabled:opacity-50"
                >{upgrading ? 'Redirecting…' : <>Upgrade to Core – $14/mo <ArrowRightIcon size={14} /></>}</button>
              </Card>
            )}
            <button
              onClick={refresh}
              disabled={refreshing}
              className="w-full text-center text-white/25 text-xs hover:text-white/50 transition-colors py-2"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>}
      </div>

      {/* Pattern detail bottom sheet */}
      <BottomSheet open={patternSheetOpen} onClose={() => setPatternSheetOpen(false)} title="Patterns detected">
        <div className="space-y-4">
          {patterns.map((p, i) => (
            <div key={i} className="flex items-start gap-3">
              <SearchIcon size={14} className="text-accent shrink-0 mt-1" />
              <div>
                <p className="text-sm text-white/75">{p.detail}</p>
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
