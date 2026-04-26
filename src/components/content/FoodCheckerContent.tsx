'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'
import { SearchIcon, BulbIcon, ArrowRightIcon } from '@/components/icons'

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

export function FoodCheckerContent() {
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

  if (!limits.foodChecker) {
    return (
      <div className="bg-black">
        <div className="px-5 pt-safe pb-5 md:px-6 md:pt-10">
          <button onClick={() => router.back()} className="text-white/45 text-sm mb-4 inline-flex items-center gap-1 pt-3 md:pt-0 hover:text-white transition-colors">
            <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-xl md:text-2xl font-medium tracking-tight">Food checker</h1>
        </div>
        <div className="px-5 md:px-6">
          <Card className="text-center py-10">
            <SearchIcon size={28} className="mx-auto text-white/35 mb-3" />
            <p className="font-medium mb-2">Unlock the food checker</p>
            <p className="text-white/55 text-sm mb-6">Check if any food is gut-friendly for your specific profile before you eat it.</p>
            <Link href="/dashboard/settings" className="inline-flex items-center gap-1 text-accent text-sm font-medium hover:text-white transition-colors">Upgrade to Core <ArrowRightIcon size={14} /></Link>
          </Card>
        </div>
      </div>
    )
  }

  const score = gutAnalysis?.rating ?? 0
  const scoreColor = score >= 7 ? '#3FBE6F' : score >= 4 ? '#E8AE1E' : '#E96363'

  return (
    <div className="bg-black">
      <div className="px-5 pt-safe pb-5 md:px-6 md:pt-10">
        <button onClick={() => router.back()} className="text-white/45 text-sm mb-4 inline-flex items-center gap-1 pt-3 md:pt-0 hover:text-white transition-colors">
          <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-xl md:text-2xl font-medium tracking-tight">Food checker</h1>
        <p className="text-white/45 text-sm mt-1">Check if a food is gut-friendly before you eat it.</p>
      </div>

      {/* Search */}
      <div className="px-5 md:px-6 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search any food…"
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-accent-50 transition-colors"
          />
          <Button onClick={search} loading={searching} size="md">Check</Button>
        </div>
      </div>

      {/* Popular searches */}
      {!food && (
        <div className="px-5 md:px-6 mb-6">
          <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Popular searches</p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); }}
                className="px-3 py-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] text-sm text-white/65 hover:border-white/15 hover:bg-white/[0.06] hover:text-white/85 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="px-5 md:px-6 text-[#E96363] text-sm mb-4">{error}</p>}

      {/* Results */}
      {food && (
        <div className="px-5 md:px-6 space-y-3 mb-6">
          {/* Food info */}
          <Card>
            <div className="flex items-start gap-4">
              {food.image && (
                <Image src={food.image} alt={food.label} width={64} height={64} className="w-16 h-16 rounded-lg object-cover" unoptimized />
              )}
              <div className="flex-1">
                <p className="font-medium text-lg tracking-tight">{food.label}</p>
                <p className="text-white/45 text-sm capitalize">{food.category}</p>
              </div>
            </div>
          </Card>

          {/* Nutrition */}
          <Card>
            <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Nutrition (per 100g)</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories', value: food.nutrients.ENERC_KCAL, unit: 'kcal' },
                { label: 'Protein', value: food.nutrients.PROCNT, unit: 'g' },
                { label: 'Fat', value: food.nutrients.FAT, unit: 'g' },
                { label: 'Carbs', value: food.nutrients.CHOCDF, unit: 'g' },
                { label: 'Fibre', value: food.nutrients.FIBTG, unit: 'g' },
              ].filter(n => n.value != null).map(n => (
                <div key={n.label} className="flex justify-between items-center">
                  <span className="text-white/55 text-sm">{n.label}</span>
                  <span className="num text-white/80 text-sm font-medium">{Math.round(n.value!)}{n.unit}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Gut-friendliness */}
          {analysing && (
            <Card className="text-center py-6">
              <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-white/55 text-sm">Analysing gut friendliness…</p>
            </Card>
          )}

          {gutAnalysis && (
            <>
              <Card>
                <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Gut friendliness</p>
                <div className="flex items-center gap-4 mb-3">
                  <div className="num text-4xl font-semibold tracking-tight" style={{ color: scoreColor }}>
                    {gutAnalysis.rating}<span className="text-lg text-white/35">/10</span>
                  </div>
                  <Badge variant={gutAnalysis.rating >= 7 ? 'green' : gutAnalysis.rating >= 4 ? 'amber' : 'red'}>
                    {gutAnalysis.rating >= 7 ? 'Gut-friendly' : gutAnalysis.rating >= 4 ? 'Moderate' : 'Caution'}
                  </Badge>
                </div>
                <p className="text-white/65 text-sm leading-relaxed">{gutAnalysis.explanation}</p>
              </Card>

              {gutAnalysis.tips.length > 0 && (
                <Card>
                  <p className="text-white/40 text-[11px] uppercase tracking-wider mb-3">Tips</p>
                  <ul className="space-y-2">
                    {gutAnalysis.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-sm text-white/75">
                        <BulbIcon size={14} className="text-[#E8AE1E] shrink-0 mt-0.5" />{tip}
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
    </div>
  )
}
