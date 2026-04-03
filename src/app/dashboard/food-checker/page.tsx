'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import { anthropic } from '@/lib/anthropic'
import Link from 'next/link'

interface FoodResult {
  label: string
  nutrients: { ENERC_KCAL?: number; PROCNT?: number; FAT?: number; CHOCDF?: number; FIBTG?: number }
  category: string
  image?: string
}

interface GutAnalysis {
  rating: number
  explanation: string
  tips: string[]
}

export default function FoodCheckerPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [food, setFood] = useState<FoodResult | null>(null)
  const [gutAnalysis, setGutAnalysis] = useState<GutAnalysis | null>(null)
  const [analysing, setAnalysing] = useState(false)
  const [plan, setPlan] = useState('free')
  const [error, setError] = useState('')

  const limits = getPlanLimits(plan)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      setPlan(profile?.plan || 'free')
    }
    load()
  }, [router])

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    setError('')
    setFood(null)
    setGutAnalysis(null)
    try {
      const res = await fetch('/api/food-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.food) throw new Error('Food not found. Try a different search term.')
      setFood(data.food)
      analyseGutFriendliness(data.food)
    } catch (e: unknown) {
      setError((e as Error).message || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const analyseGutFriendliness = async (foodData: FoodResult) => {
    setAnalysing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('gut_profile').eq('id', user.id).single()

      const res = await fetch('/api/analyse-food-gut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food: foodData, gutProfile: profile?.gut_profile }),
      })
      const data = await res.json()
      if (data.rating) setGutAnalysis(data)
    } catch {
      // Non-critical, food data still shown
    } finally {
      setAnalysing(false)
    }
  }

  const popularSearches = ['Yogurt', 'Kimchi', 'Banana', 'Oats', 'Salmon', 'Broccoli', 'Almonds', 'Ginger']

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Food Checker</h1>
        <p className="text-white/40 text-sm mt-1">Check if a food is gut-friendly before you eat it</p>
      </div>

      {/* Search */}
      <div className="px-6 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search any food..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00B4B4]/50 transition-colors"
          />
          <Button onClick={search} loading={searching} size="md">Check</Button>
        </div>
      </div>

      {/* Popular searches */}
      {!food && (
        <div className="px-6 mb-6">
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-sm text-white/50 hover:border-[#00B4B4]/30 hover:text-white/70 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="px-6 text-red-400 text-sm mb-4">{error}</p>}

      {/* Results */}
      {food && (
        <div className="px-6 space-y-4 mb-6">
          {/* Food info */}
          <Card glow>
            <div className="flex items-start gap-4">
              {food.image && (
                <img src={food.image} alt={food.label} className="w-16 h-16 rounded-xl object-cover" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-lg">{food.label}</p>
                <p className="text-white/40 text-sm capitalize">{food.category}</p>
              </div>
            </div>
          </Card>

          {/* Nutrition */}
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Nutrition (per 100g)</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories', value: food.nutrients.ENERC_KCAL, unit: 'kcal' },
                { label: 'Protein', value: food.nutrients.PROCNT, unit: 'g' },
                { label: 'Fat', value: food.nutrients.FAT, unit: 'g' },
                { label: 'Carbs', value: food.nutrients.CHOCDF, unit: 'g' },
                { label: 'Fibre', value: food.nutrients.FIBTG, unit: 'g' },
              ].filter(n => n.value != null).map(n => (
                <div key={n.label} className="flex justify-between items-center">
                  <span className="text-white/50 text-sm">{n.label}</span>
                  <span className="text-white/80 text-sm font-medium">{Math.round(n.value!)}{n.unit}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Gut-friendliness */}
          {analysing && (
            <Card className="text-center py-6">
              <div className="w-6 h-6 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-white/50 text-sm">Analysing gut friendliness...</p>
            </Card>
          )}

          {gutAnalysis && (
            <>
              <Card>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Gut friendliness</p>
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-4xl font-bold gradient-text">{gutAnalysis.rating}/10</div>
                  <Badge variant={gutAnalysis.rating >= 7 ? 'green' : gutAnalysis.rating >= 4 ? 'amber' : 'red'}>
                    {gutAnalysis.rating >= 7 ? 'Gut-friendly' : gutAnalysis.rating >= 4 ? 'Moderate' : 'Caution'}
                  </Badge>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{gutAnalysis.explanation}</p>
              </Card>

              {gutAnalysis.tips.length > 0 && (
                <Card>
                  <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Tips</p>
                  <ul className="space-y-2">
                    {gutAnalysis.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white/70">
                        <span className="text-[#4ADE80] shrink-0">💡</span>{tip}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          )}

          <Button onClick={() => { setFood(null); setGutAnalysis(null); setQuery('') }} variant="outline" className="w-full">
            Search another food
          </Button>
        </div>
      )}

      <Navigation />
    </div>
  )
}
