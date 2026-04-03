'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getPlanLimits } from '@/lib/plan-limits'
import { haptic } from '@/lib/haptics'
import { MealPlanSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ToastProvider'

interface Meal { name: string; description: string; gutBenefits: string; prepTime: string }
interface Day { day: string; breakfast: Meal; lunch: Meal; dinner: Meal; snacks: string[] }
interface GroceryCategory { category: string; items: string[] }
interface Plan { weekSummary: string; days: Day[]; gutTips: string[]; groceryList?: GroceryCategory[] }

export default function MealPlanPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const [error, setError] = useState('')

  const [userPlan, setUserPlan] = useState('free')
  const [planAge, setPlanAge] = useState(0)
  const [emailing, setEmailing] = useState(false)
  const [showGroceryList, setShowGroceryList] = useState(false)
  const touchStartRef = useRef(0)
  const { toast } = useToast()
  const limits = getPlanLimits(userPlan)

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  useEffect(() => {
    setActiveDay(todayIndex)
    loadPlan()
  }, [])

  const loadPlan = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profile }, { data }] = await Promise.all([
      supabase.from('profiles').select('plan').eq('id', user.id).single(),
      supabase.from('meal_plans').select('*').eq('user_id', user.id).order('generated_at', { ascending: false }).limit(1).single(),
    ])
    setUserPlan(profile?.plan || 'free')
    if (data?.plan) {
      setPlan(data.plan)
      const age = Math.floor((Date.now() - new Date(data.generated_at).getTime()) / (1000 * 60 * 60 * 24))
      setPlanAge(age)
    }
    setLoading(false)
  }

  const generate = async () => {
    setGenerating(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: docs }, { data: logs }] = await Promise.all([
        supabase.from('profiles').select('gut_profile, plan').eq('id', user.id).single(),
        supabase.from('documents').select('ai_interpretation, recommendations').eq('user_id', user.id).order('uploaded_at', { ascending: false }).limit(3),
        supabase.from('logs').select('content, gut_score').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(5),
      ])

      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile: profile?.gut_profile, documents: docs, recentLogs: logs }),
      })
      const { plan: newPlan, error: e } = await res.json()
      if (e) throw new Error(e)

      // Save to DB
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
      await supabase.from('meal_plans').insert({ user_id: user.id, week_start: weekStart.toISOString().split('T')[0], plan: newPlan })

      setPlan(newPlan)
    } catch (e: unknown) {
      setError((e as Error).message || 'Could not generate meal plan')
    } finally {
      setGenerating(false)
    }
  }

  const emailPlan = async () => {
    setEmailing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('name, email').eq('id', user.id).single()
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weekly-meal-plan',
          to: profile?.email || user.email,
          data: { name: profile?.name || 'there', mealPlanUrl: `${window.location.origin}/dashboard/meal-plan` },
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      toast('Meal plan sent to your email', 'success')
    } catch {
      toast('Could not send email', 'error')
    } finally {
      setEmailing(false)
    }
  }

  if (loading) return <MealPlanSkeleton />

  const currentDay = plan?.days[activeDay]

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-4">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Your meal plan</h1>
        <p className="text-white/40 text-sm mt-1">Personalised for your gut profile</p>
      </div>

      {!plan ? (
        <div className="px-6">
          {!limits.mealPlan ? (
            <Card className="text-center py-10">
              <div className="text-4xl mb-4">🍽️</div>
              <p className="font-semibold mb-2">Unlock personalised meal plans</p>
              <p className="text-white/40 text-sm mb-6">Upgrade to Core or Pro to get AI-generated weekly meal plans tailored to your gut profile.</p>
              <Link href="/dashboard/settings" className="text-[#4ADE80] text-sm font-medium hover:underline">Upgrade now →</Link>
            </Card>
          ) : (
            <Card className="text-center py-10">
              <div className="text-4xl mb-4">🍽️</div>
              <p className="font-semibold mb-2">No meal plan yet</p>
              <p className="text-white/40 text-sm mb-6">Upload a gut test or log a few days to generate your personalised plan.</p>
              <Button onClick={generate} loading={generating} className="mx-auto">Generate my meal plan</Button>
            </Card>
          )}
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </div>
      ) : (
        <>
          {/* Stale plan banner */}
          {planAge >= 7 && (
            <div className="px-6 mb-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                <p className="text-amber-300 text-sm">This plan is {planAge} days old</p>
                <button onClick={generate} disabled={generating} className="text-[#4ADE80] text-sm font-medium hover:underline shrink-0 ml-2">
                  {generating ? 'Generating...' : 'Refresh →'}
                </button>
              </div>
            </div>
          )}

          {/* Week summary */}
          <div className="px-6 mb-4">
            <Card className="bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border-[#00B4B4]/20">
              <p className="text-sm text-white/70 leading-relaxed">{plan.weekSummary}</p>
            </Card>
          </div>

          {/* Day tabs */}
          {!showGroceryList && <div className="px-6 mb-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              {days.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setActiveDay(i)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeDay === i
                      ? 'bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] text-black'
                      : i === todayIndex
                      ? 'border border-[#00B4B4]/50 text-[#4ADE80]'
                      : 'bg-white/5 text-white/40'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>}

          {/* Meals (swipeable) */}
          {!showGroceryList && currentDay && (
            <div
              className="px-6 space-y-3 mb-4"
              onTouchStart={e => { touchStartRef.current = e.touches[0].clientX }}
              onTouchEnd={e => {
                const diff = e.changedTouches[0].clientX - touchStartRef.current
                if (Math.abs(diff) > 60) {
                  const next = diff < 0 ? Math.min(activeDay + 1, 6) : Math.max(activeDay - 1, 0)
                  if (next !== activeDay) { setActiveDay(next); haptic.light() }
                }
              }}
            >
              {(['breakfast', 'lunch', 'dinner'] as const).map(meal => {
                const m = currentDay[meal]
                return (
                  <Card key={meal}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5 capitalize">{meal}</p>
                        <p className="font-semibold">{m.name}</p>
                      </div>
                      <span className="text-white/30 text-xs shrink-0 ml-2">⏱ {m.prepTime}</span>
                    </div>
                    <p className="text-white/50 text-sm mb-2">{m.description}</p>
                    <p className="text-[#4ADE80] text-xs">✓ {m.gutBenefits}</p>
                  </Card>
                )
              })}

              {/* Snacks */}
              {currentDay.snacks?.length > 0 && (
                <Card>
                  <p className="text-white/30 text-xs uppercase tracking-wide mb-2">Snacks</p>
                  <div className="flex flex-wrap gap-2">
                    {currentDay.snacks.map((s, i) => (
                      <span key={i} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white/60">{s}</span>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* View toggle: Meals / Grocery List */}
          {plan.groceryList && plan.groceryList.length > 0 && (
            <div className="px-6 mb-4">
              <div className="flex bg-white/5 rounded-xl p-1 max-w-xs">
                <button
                  onClick={() => setShowGroceryList(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!showGroceryList ? 'bg-white/10 text-white' : 'text-white/40'}`}
                >
                  Meals
                </button>
                <button
                  onClick={() => setShowGroceryList(true)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${showGroceryList ? 'bg-white/10 text-white' : 'text-white/40'}`}
                >
                  Grocery List
                </button>
              </div>
            </div>
          )}

          {/* Grocery list */}
          {showGroceryList && plan.groceryList && (
            <div className="px-6 space-y-3 mb-4">
              {plan.groceryList.map((cat) => (
                <Card key={cat.category}>
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-2">{cat.category}</p>
                  <ul className="space-y-1.5">
                    {cat.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                        <span className="w-4 h-4 rounded border border-white/20 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const text = plan.groceryList!.map(c => `${c.category}:\n${c.items.map(i => `  - ${i}`).join('\n')}`).join('\n\n')
                  navigator.clipboard.writeText(text)
                  toast('Grocery list copied to clipboard', 'success')
                }}
              >
                Copy list to clipboard
              </Button>
            </div>
          )}

          {/* Gut tips */}
          {plan.gutTips?.length > 0 && !showGroceryList && (
            <div className="px-6 mb-4">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">This week's gut tips</p>
              <div className="space-y-2">
                {plan.gutTips.map((tip, i) => (
                  <div key={i} className="flex gap-2 text-sm text-white/60">
                    <span className="text-[#00B4B4] shrink-0">💡</span>{tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-6 flex gap-3 flex-wrap">
            <Button onClick={generate} loading={generating} variant="outline" className="flex-1">Regenerate</Button>
            <Button
              variant="outline"
              className="hidden md:flex flex-1"
              onClick={() => window.print()}
            >
              Print plan
            </Button>
            {limits.emailMealPlans && (
              <Button
                variant="outline"
                className="flex-1"
                loading={emailing}
                onClick={emailPlan}
              >
                Email me this plan
              </Button>
            )}
          </div>
        </>
      )}

      <Navigation />
    </div>
  )
}
