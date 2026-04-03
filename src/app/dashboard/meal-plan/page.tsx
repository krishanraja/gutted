'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Meal { name: string; description: string; gutBenefits: string; prepTime: string }
interface Day { day: string; breakfast: Meal; lunch: Meal; dinner: Meal; snacks: Meal }
interface MealPlan { days: Day[] }

function MealCard({ meal, emoji }: { meal: Meal; emoji: string }) {
  return (
    <div className="border-b border-white/5 last:border-0 py-3">
      <div className="flex items-start gap-2">
        <span>{emoji}</span>
        <div>
          <p className="font-medium text-sm text-white">{meal.name}</p>
          <p className="text-white/50 text-xs mt-0.5">{meal.description}</p>
          <p className="text-[#4ADE80] text-xs mt-1">{meal.gutBenefits}</p>
          <p className="text-white/30 text-xs mt-0.5">{meal.prepTime}</p>
        </div>
      </div>
    </div>
  )
}

export default function MealPlanPage() {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('meal_plans').select('plan').eq('user_id', user.id).order('generated_at', { ascending: false }).limit(1).single()
      if (data?.plan) setPlan(data.plan as MealPlan)
      setLoading(false)
    }
    load()
  }, [])

  const generate = async () => {
    setGenerating(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: profile }, { data: docs }] = await Promise.all([
      supabase.from('profiles').select('gut_profile').eq('id', user?.id || '').single(),
      supabase.from('documents').select('ai_interpretation').eq('user_id', user?.id || '').limit(3),
    ])
    try {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile: profile, documents: docs }),
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      setPlan(result)
    } catch {
      setError('Failed to generate meal plan. Please try again.')
    }
    setGenerating(false)
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="min-h-screen pb-24 max-w-md mx-auto">
      <div className="px-5 pt-12 pb-6">
        <Link href="/dashboard" className="text-white/50 text-sm flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meal plan</h1>
            <p className="text-white/50 text-sm mt-1">Personalised for your gut</p>
          </div>
          <Button size="sm" variant="outline" onClick={generate} loading={generating}>Regenerate</Button>
        </div>
      </div>

      {error && <div className="mx-5 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"><p className="text-red-400 text-sm">{error}</p></div>}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#4ADE80] border-t-transparent rounded-full animate-spin"/>
        </div>
      )}

      {!loading && !plan && (
        <div className="px-5">
          <Card className="text-center py-10">
            <p className="text-4xl mb-4">🍽️</p>
            <h2 className="font-bold mb-2">No meal plan yet</h2>
            <p className="text-white/50 text-sm mb-6">Generate a personalised 7-day plan based on your gut profile and test results.</p>
            <Button onClick={generate} loading={generating} className="w-full">Generate my meal plan</Button>
          </Card>
        </div>
      )}

      {plan?.days && (
        <>
          {/* Day tabs */}
          <div className="px-5 mb-4">
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {plan.days.map((d, i) => (
                <button key={i} onClick={() => setSelectedDay(i)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium transition-all ${selectedDay === i ? 'bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] text-black' : 'bg-white/5 text-white/60'}`}>
                  {days[i]}
                </button>
              ))}
            </div>
          </div>

          {/* Day plan */}
          {plan.days[selectedDay] && (
            <div className="px-5 space-y-3">
              <h2 className="font-bold text-lg">{plan.days[selectedDay].day}</h2>
              <Card>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Meals</p>
                <MealCard meal={plan.days[selectedDay].breakfast} emoji="🌅"/>
                <MealCard meal={plan.days[selectedDay].lunch} emoji="☀️"/>
                <MealCard meal={plan.days[selectedDay].dinner} emoji="🌙"/>
                {plan.days[selectedDay].snacks && <MealCard meal={plan.days[selectedDay].snacks} emoji="🍎"/>}
              </Card>
            </div>
          )}
        </>
      )}

      <Navigation/>
    </div>
  )
}
