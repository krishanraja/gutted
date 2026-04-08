'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SectionNav } from '@/components/SectionNav'
import { Card } from '@/components/ui/Card'
import { MealPlanContent } from '@/components/content/MealPlanContent'
import { UploadContent } from '@/components/content/UploadContent'
import { FoodCheckerContent } from '@/components/content/FoodCheckerContent'
import { SupplementsContent } from '@/components/content/SupplementsContent'
import { getUnlockStatus } from '@/lib/unlock-status'

function FoodPageContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'meals'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [logCount, setLogCount] = useState(0)
  const [docCount, setDocCount] = useState(0)
  const [hasRestrictions, setHasRestrictions] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profile }, { count: lc }, { count: dc }] = await Promise.all([
      supabase.from('profiles').select('gut_profile').eq('id', user.id).single(),
      supabase.from('logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    setLogCount(lc || 0)
    setDocCount(dc || 0)
    setHasRestrictions(!!(profile?.gut_profile as Record<string, unknown>)?.restrictions)
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  const unlock = getUnlockStatus(logCount, docCount, hasRestrictions)

  const foodTabs = [
    { key: 'meals', label: 'Meals', locked: !unlock.meals.unlocked, lockMessage: unlock.meals.requirement },
    { key: 'upload', label: 'Upload' },
    { key: 'check', label: 'Food Check', locked: !unlock.check.unlocked, lockMessage: unlock.check.requirement },
    { key: 'supplements', label: 'Supplements', locked: !unlock.supplements.unlocked, lockMessage: unlock.supplements.requirement },
  ]

  const handleTabChange = (key: string) => {
    const tab = foodTabs.find(t => t.key === key)
    if (tab?.locked) return
    setActiveTab(key)
  }

  // If current tab is locked, switch to first unlocked
  const currentLocked = foodTabs.find(t => t.key === activeTab)?.locked

  if (!loaded) return (
    <div className="mobile-viewport bg-black items-center justify-center md:min-h-screen md:static">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin"/>
    </div>
  )

  return (
    <>
      {/* Mobile: viewport-locked no-scroll layout */}
      <div className="mobile-viewport md:hidden">
        <div className="px-6 pt-12 pb-4">
          <h1 className="text-2xl font-bold mb-4">Food</h1>
          <SectionNav tabs={foodTabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <div className="flex-1 overflow-y-auto pb-nav">
          {currentLocked ? (
            <div className="px-6 py-8">
              <Card className="flex flex-col items-center py-8 border-[#00B4B4]/20 bg-gradient-to-b from-[#00B4B4]/5 to-transparent">
                <svg className="w-8 h-8 text-white/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-white/60 text-sm text-center mb-2">
                  {foodTabs.find(t => t.key === activeTab)?.lockMessage}
                </p>
              </Card>
            </div>
          ) : (
            <>
              {activeTab === 'meals' && <MealPlanContent />}
              {activeTab === 'upload' && <UploadContent />}
              {activeTab === 'check' && <FoodCheckerContent />}
              {activeTab === 'supplements' && <SupplementsContent />}
            </>
          )}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block min-h-screen bg-black pb-8 md:ml-60 lg:ml-64">
        <div className="px-6 pt-12 pb-4">
          <h1 className="text-2xl font-bold mb-4">Food</h1>
          <SectionNav tabs={foodTabs} activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        <div>
          {currentLocked ? (
            <div className="px-6 py-8">
              <Card className="flex flex-col items-center py-8 border-[#00B4B4]/20 bg-gradient-to-b from-[#00B4B4]/5 to-transparent">
                <svg className="w-8 h-8 text-white/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <p className="text-white/60 text-sm text-center mb-2">
                  {foodTabs.find(t => t.key === activeTab)?.lockMessage}
                </p>
              </Card>
            </div>
          ) : (
            <>
              {activeTab === 'meals' && <MealPlanContent />}
              {activeTab === 'upload' && <UploadContent />}
              {activeTab === 'check' && <FoodCheckerContent />}
              {activeTab === 'supplements' && <SupplementsContent />}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default function FoodPage() {
  return (
    <Suspense fallback={
      <div className="mobile-viewport bg-black items-center justify-center md:min-h-screen md:static">
        <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin"/>
      </div>
    }>
      <FoodPageContent />
    </Suspense>
  )
}
