'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Profile { name: string; email: string; plan: string; gut_profile?: Record<string, unknown> }

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('name, email, plan, gut_profile').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [router])

  const signOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const upgrade = async (plan: string) => {
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
      else setUpgrading(false)
    } catch {
      setUpgrading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="px-6 space-y-4">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-4">
            <Image src="/icon.png" alt="gutted." width={40} height={40} className="h-10 w-10 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{profile?.name}</p>
              <p className="text-white/40 text-sm truncate">{profile?.email}</p>
            </div>
          </div>
        </Card>

        {/* Plan */}
        <Card>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Current plan</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={profile?.plan === 'free' ? 'neutral' : 'teal'}>
                {profile?.plan === 'free' ? 'Free' : profile?.plan}
              </Badge>
            </div>
            {profile?.plan === 'free' && (
              <button onClick={() => upgrade('core')} disabled={upgrading} className="text-[#4ADE80] text-sm font-medium hover:underline disabled:opacity-50">
                {upgrading ? 'Redirecting...' : 'Upgrade to Core →'}
              </button>
            )}
            {profile?.plan === 'core' && (
              <button onClick={() => upgrade('pro')} disabled={upgrading} className="text-[#4ADE80] text-sm font-medium hover:underline disabled:opacity-50">
                {upgrading ? 'Redirecting...' : 'Upgrade to Pro →'}
              </button>
            )}
          </div>
          {profile?.plan !== 'free' && (
            <button
              onClick={async () => {
                const res = await fetch('/api/stripe/portal', { method: 'POST' })
                const { url } = await res.json()
                if (url) window.location.href = url
              }}
              className="text-white/40 text-sm hover:text-white/60 mt-3 transition-colors"
            >
              Manage subscription →
            </button>
          )}
        </Card>

        {/* Gut Score Goal */}
        <Card>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Gut score goal</p>
          <p className="text-white/50 text-xs mb-3">Set a target 7-day average gut score to work toward.</p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={(profile?.gut_profile?.scoreGoal as number) || 7}
              onChange={async (e) => {
                const goal = parseInt(e.target.value)
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                await supabase.from('profiles').update({
                  gut_profile: { ...profile?.gut_profile, scoreGoal: goal }
                }).eq('id', user.id)
                setProfile(prev => prev ? { ...prev, gut_profile: { ...prev.gut_profile, scoreGoal: goal } } : prev)
              }}
              className="flex-1 accent-[#4ADE80]"
            />
            <span className="text-2xl font-bold gradient-text w-12 text-center">
              {(profile?.gut_profile?.scoreGoal as number) || 7}
            </span>
          </div>
        </Card>

        {/* Daily Reminders */}
        {profile?.plan !== 'free' && (
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Daily reminders</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Get a daily check-in email</p>
                <p className="text-white/30 text-xs mt-0.5">We'll remind you to log if you haven't today</p>
              </div>
              <button
                onClick={async () => {
                  const supabase = createClient()
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return
                  const newValue = !profile?.gut_profile?.remindersEnabled
                  await supabase.from('profiles').update({
                    gut_profile: { ...profile?.gut_profile, remindersEnabled: newValue }
                  }).eq('id', user.id)
                  setProfile(prev => prev ? { ...prev, gut_profile: { ...prev.gut_profile, remindersEnabled: newValue } } : prev)
                }}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  profile?.gut_profile?.remindersEnabled ? 'bg-[#4ADE80]' : 'bg-white/20'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  profile?.gut_profile?.remindersEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </Card>
        )}

        {/* Export data (desktop) */}
        <Card className="hidden md:block">
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Your data</p>
          <button
            onClick={async () => {
              const supabase = createClient()
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return
              const [{ data: logs }, { data: docs }, { data: plans }] = await Promise.all([
                supabase.from('logs').select('*').eq('user_id', user.id),
                supabase.from('documents').select('*').eq('user_id', user.id),
                supabase.from('meal_plans').select('*').eq('user_id', user.id),
              ])
              const exportData = { profile, logs, documents: docs, mealPlans: plans, exportedAt: new Date().toISOString() }
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `gutted-export-${new Date().toISOString().split('T')[0]}.json`
              a.click()
            }}
            className="text-[#4ADE80] text-sm font-medium hover:underline"
          >
            Export all my data (JSON)
          </button>
        </Card>

        {/* Sign out */}
        <Button onClick={signOut} loading={signingOut} variant="outline" className="w-full">Sign out</Button>

        {/* Legal */}
        <p className="text-white/20 text-xs text-center pt-4">
          gutted. is not a medical service. Always consult a healthcare professional for medical advice.
          <br />© 2026 gutted. All rights reserved.
        </p>
      </div>

      <Navigation />
    </div>
  )
}
