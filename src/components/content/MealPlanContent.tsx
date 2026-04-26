'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { getPlanLimits } from '@/lib/plan-limits'
import { haptic } from '@/lib/haptics'
import { MealPlanSkeleton } from '@/components/ui/Skeleton'
import { CardCarousel } from '@/components/CardCarousel'
import { BottomSheet } from '@/components/BottomSheet'
import { useToast } from '@/components/ToastProvider'
import { UtensilsIcon, BulbIcon, CheckIcon, ArrowRightIcon, CalendarIcon } from '@/components/icons'

interface Meal { name: string; description: string; gutBenefits: string; prepTime: string }
interface Day { day: string; breakfast: Meal; lunch: Meal; dinner: Meal; snacks: string[] }
interface GroceryCategory { category: string; items: string[] }
interface Plan { weekSummary: string; days: Day[]; gutTips: string[]; groceryList?: GroceryCategory[] }

export function MealPlanContent() {
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const [error, setError] = useState('')
  const [tipsOpen, setTipsOpen] = useState(false)

  const [userPlan, setUserPlan] = useState('free')
  const [planAge, setPlanAge] = useState(0)
  const [emailing, setEmailing] = useState(false)
  const [showGroceryList, setShowGroceryList] = useState(false)
  const { toast } = useToast()
  const limits = getPlanLimits(userPlan)

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const mealLabels = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const

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

  const renderMealCard = (meal: Meal, label: string) => (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-white/40 text-[11px] uppercase tracking-wider mb-0.5">{label}</p>
            <p className="font-medium tracking-tight">{meal.name}</p>
          </div>
          <span className="num text-white/40 text-xs shrink-0 ml-2 inline-flex items-center gap-1">
            <CalendarIcon size={11} /> {meal.prepTime}
          </span>
        </div>
        <p className="text-white/55 text-sm mb-3 flex-1">{meal.description}</p>
        <p className="text-[#3FBE6F] text-xs inline-flex items-center gap-1">
          <CheckIcon size={11} /> {meal.gutBenefits}
        </p>
      </Card>
    </div>
  )

  return (
    <>
      {/* Mobile: viewport-locked with meal carousel */}
      <div className="mobile-viewport md:hidden">
        {/* Header */}
        <div className="flex-none px-5 pt-safe pb-3 animate-fade-in">
          <div className="flex items-center justify-between pt-3">
            <div>
              <button onClick={() => router.back()} className="text-white/45 text-sm mb-1 inline-flex items-center gap-1 hover:text-white transition-colors">
                <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                Back
              </button>
              <h1 className="text-xl font-medium tracking-tight">Your meal plan</h1>
            </div>
            {plan?.gutTips && plan.gutTips.length > 0 && (
              <button
                onClick={() => { haptic.tap(); setTipsOpen(true) }}
                className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/45 hover:text-white/80 transition-colors"
                aria-label="View tips"
              >
                <BulbIcon size={18} />
              </button>
            )}
          </div>
        </div>

        {!plan ? (
          <div className="flex-1 flex items-center justify-center px-5">
            {!limits.mealPlan ? (
              <Card className="text-center py-10 w-full animate-fade-up">
                <UtensilsIcon size={28} className="mx-auto text-white/35 mb-3" />
                <p className="font-medium mb-2">Unlock personalised meal plans</p>
                <p className="text-white/55 text-sm mb-6">Upgrade to Core or Pro to get AI-generated weekly meal plans tailored to your gut profile.</p>
                <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade now <ArrowRightIcon size={14} /></Link>
              </Card>
            ) : (
              <Card className="text-center py-10 w-full animate-fade-up">
                <UtensilsIcon size={28} className="mx-auto text-white/35 mb-3" />
                <p className="font-medium mb-2">No meal plan yet</p>
                <p className="text-white/55 text-sm mb-6">Upload a gut test or log a few days to generate your personalised plan.</p>
                <Button onClick={generate} loading={generating} className="mx-auto">Generate my meal plan</Button>
              </Card>
            )}
            {error && <p className="text-[#E96363] text-sm mt-4 text-center">{error}</p>}
          </div>
        ) : (
          <>
            {/* Stale plan banner */}
            {planAge >= 7 && (
              <div className="flex-none px-5 mb-2">
                <div className="bg-[#E8AE1E]/8 border border-[#E8AE1E]/25 rounded-lg p-2.5 flex items-center justify-between">
                  <p className="num text-[#E8AE1E] text-xs">{planAge} days old</p>
                  <button onClick={generate} disabled={generating} className="text-accent text-xs font-medium hover:text-white transition-colors">
                    {generating ? 'Generating…' : 'Refresh'}
                  </button>
                </div>
              </div>
            )}

            {/* View toggle: Meals / Grocery List */}
            {plan.groceryList && plan.groceryList.length > 0 && (
              <div className="flex-none px-5 mb-3">
                <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 max-w-xs">
                  <button
                    onClick={() => setShowGroceryList(false)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${!showGroceryList ? 'bg-white/[0.06] text-white' : 'text-white/45'}`}
                  >
                    Meals
                  </button>
                  <button
                    onClick={() => setShowGroceryList(true)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${showGroceryList ? 'bg-white/[0.06] text-white' : 'text-white/45'}`}
                  >
                    Grocery list
                  </button>
                </div>
              </div>
            )}

            {/* Day tabs */}
            {!showGroceryList && (
              <div className="flex-none px-5 mb-3">
                <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
                  {days.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => { setActiveDay(i); haptic.tap() }}
                      className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        activeDay === i
                          ? 'bg-white/[0.10] text-white border border-white/15'
                          : i === todayIndex
                          ? 'border border-accent-50 text-accent'
                          : 'bg-white/[0.04] border border-white/[0.08] text-white/55 hover:text-white/80'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Meal carousel -- one meal at a time */}
            {!showGroceryList && currentDay && (
              <div className="flex-1 px-5 pb-nav min-h-0 animate-fade-up">
                <CardCarousel>
                  {renderMealCard(currentDay.breakfast, 'Breakfast')}
                  {renderMealCard(currentDay.lunch, 'Lunch')}
                  {renderMealCard(currentDay.dinner, 'Dinner')}
                  {/* Snacks card */}
                  <div className="h-full flex flex-col">
                    <Card className="flex-1">
                      <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Snacks</p>
                      {currentDay.snacks?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {currentDay.snacks.map((s, i) => (
                            <span key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1.5 text-sm text-white/65">{s}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-white/45 text-sm">No snacks planned for today.</p>
                      )}
                    </Card>
                  </div>
                </CardCarousel>
              </div>
            )}

            {/* Grocery list (mobile) */}
            {showGroceryList && plan.groceryList && (
              <div className="flex-1 px-5 pb-nav min-h-0 space-y-3 overflow-y-auto">
                {plan.groceryList.map((cat) => (
                  <Card key={cat.category}>
                    <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">{cat.category}</p>
                    <ul className="space-y-1.5">
                      {cat.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-white/75">
                          <span className="w-3.5 h-3.5 rounded-sm border border-white/20 shrink-0" />
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

            {/* Regenerate & email buttons */}
            <div className="flex-none px-5 pb-nav flex gap-2">
              <Button onClick={generate} loading={generating} variant="outline" className="flex-1">Regenerate</Button>
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
      </div>

      {/* Desktop: original layout */}
      <div className="hidden md:block bg-black">
        <div className="px-6 pt-10 pb-4">
          <button onClick={() => router.back()} className="text-white/45 text-sm mb-4 inline-flex items-center gap-1 hover:text-white transition-colors">
            <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <h1 className="text-2xl font-medium tracking-tight">Your meal plan</h1>
          <p className="text-white/45 text-sm mt-1">Personalised for your gut profile.</p>
        </div>

        {!plan ? (
          <div className="px-6">
            {!limits.mealPlan ? (
              <Card className="text-center py-10 animate-fade-up">
                <UtensilsIcon size={28} className="mx-auto text-white/35 mb-3" />
                <p className="font-medium mb-2">Unlock personalised meal plans</p>
                <p className="text-white/55 text-sm mb-6">Upgrade to Core or Pro to get AI-generated weekly meal plans tailored to your gut profile.</p>
                <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade now <ArrowRightIcon size={14} /></Link>
              </Card>
            ) : (
              <Card className="text-center py-10 animate-fade-up">
                <UtensilsIcon size={28} className="mx-auto text-white/35 mb-3" />
                <p className="font-medium mb-2">No meal plan yet</p>
                <p className="text-white/55 text-sm mb-6">Upload a gut test or log a few days to generate your personalised plan.</p>
                <Button onClick={generate} loading={generating} className="mx-auto">Generate my meal plan</Button>
              </Card>
            )}
            {error && <p className="text-[#E96363] text-sm mt-4 text-center">{error}</p>}
          </div>
        ) : (
          <>
            {planAge >= 7 && (
              <div className="px-6 mb-4">
                <div className="bg-[#E8AE1E]/8 border border-[#E8AE1E]/25 rounded-lg p-3 flex items-center justify-between">
                  <p className="num text-[#E8AE1E] text-sm">This plan is {planAge} days old.</p>
                  <button onClick={generate} disabled={generating} className="text-accent text-sm font-medium hover:text-white transition-colors shrink-0 ml-2">
                    {generating ? 'Generating…' : 'Refresh'}
                  </button>
                </div>
              </div>
            )}

            <div className="px-6 mb-4">
              <Card className="animate-fade-up">
                <p className="text-sm text-white/75 leading-relaxed">{plan.weekSummary}</p>
              </Card>
            </div>

            {/* View toggle: Meals / Grocery List (desktop) */}
            {plan.groceryList && plan.groceryList.length > 0 && (
              <div className="px-6 mb-4">
                <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 max-w-xs">
                  <button
                    onClick={() => setShowGroceryList(false)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${!showGroceryList ? 'bg-white/[0.06] text-white' : 'text-white/45'}`}
                  >
                    Meals
                  </button>
                  <button
                    onClick={() => setShowGroceryList(true)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${showGroceryList ? 'bg-white/[0.06] text-white' : 'text-white/45'}`}
                  >
                    Grocery list
                  </button>
                </div>
              </div>
            )}

            {!showGroceryList && (
              <>
                <div className="px-6 mb-4">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                    {days.map((d, i) => (
                      <button
                        key={d}
                        onClick={() => { setActiveDay(i); haptic.tap() }}
                        className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                          activeDay === i
                            ? 'bg-white/[0.10] text-white border border-white/15'
                            : i === todayIndex
                            ? 'border border-accent-50 text-accent'
                            : 'bg-white/[0.04] border border-white/[0.08] text-white/55 hover:text-white/80'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {currentDay && (
                  <div className="px-6 space-y-3 mb-4">
                    {(['breakfast', 'lunch', 'dinner'] as const).map(meal => {
                      const m = currentDay[meal]
                      return (
                        <Card key={meal} entrance="fade-up">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-0.5 capitalize">{meal}</p>
                              <p className="font-medium tracking-tight">{m.name}</p>
                            </div>
                            <span className="num text-white/40 text-xs shrink-0 ml-2 inline-flex items-center gap-1">
                              <CalendarIcon size={11} /> {m.prepTime}
                            </span>
                          </div>
                          <p className="text-white/55 text-sm mb-2">{m.description}</p>
                          <p className="text-[#3FBE6F] text-xs inline-flex items-center gap-1">
                            <CheckIcon size={11} /> {m.gutBenefits}
                          </p>
                        </Card>
                      )
                    })}

                    {currentDay.snacks?.length > 0 && (
                      <Card>
                        <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Snacks</p>
                        <div className="flex flex-wrap gap-2">
                          {currentDay.snacks.map((s, i) => (
                            <span key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-md px-3 py-1 text-sm text-white/65">{s}</span>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                )}

                {plan.gutTips?.length > 0 && (
                  <div className="px-6 mb-4">
                    <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">This week&apos;s gut tips</p>
                    <div className="space-y-2">
                      {plan.gutTips.map((tip, i) => (
                        <div key={i} className="flex gap-2 text-sm text-white/75">
                          <BulbIcon size={14} className="text-[#E8AE1E] shrink-0 mt-0.5" />{tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Grocery list (desktop) */}
            {showGroceryList && plan.groceryList && (
              <div className="px-6 space-y-3 mb-4">
                {plan.groceryList.map((cat) => (
                  <Card key={cat.category}>
                    <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">{cat.category}</p>
                    <ul className="space-y-1.5">
                      {cat.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-white/75">
                          <span className="w-3.5 h-3.5 rounded-sm border border-white/20 shrink-0" />
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

            <div className="px-6 flex gap-2 flex-wrap">
              <Button onClick={generate} loading={generating} variant="outline" className="flex-1">Regenerate</Button>
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>Print plan</Button>
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
      </div>

      {/* Gut tips bottom sheet */}
      <BottomSheet open={tipsOpen} onClose={() => setTipsOpen(false)} title="This week's gut tips">
        <div className="space-y-3">
          {plan?.gutTips?.map((tip, i) => (
            <div key={i} className="flex gap-2 text-sm text-white/75">
              <BulbIcon size={14} className="text-[#E8AE1E] shrink-0 mt-0.5" />{tip}
            </div>
          ))}
          {plan?.weekSummary && (
            <div className="mt-4 pt-4 hairline border-t">
              <p className="text-white/40 text-[11px] uppercase tracking-wider mb-2">Week summary</p>
              <p className="text-sm text-white/75 leading-relaxed">{plan.weekSummary}</p>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  )
}
