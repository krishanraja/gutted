'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useUpgrade } from '@/hooks/useUpgrade'
import { useToast } from '@/components/ToastProvider'

interface Profile { name: string; email: string; plan: string; gut_profile?: Record<string, unknown> }

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const { upgrade, upgrading } = useUpgrade()
  const { toast } = useToast()

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

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin"/>
    </div>
  )

  const nextPlan = profile?.plan === 'free' ? 'core' : profile?.plan === 'core' ? 'pro' : null
  const planFeatures: Record<string, string[]> = {
    core: ['Unlimited voice logging', 'Weekly personalised meal plan', 'AI Gut Coach (10 chats/mo)', 'Food compatibility checker'],
    pro: ['Unlimited AI Gut Coach', 'PDF health reports', 'Supplement recommendations', 'Doctor visit summary'],
  }

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="px-6 space-y-4 max-w-lg">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00B4B4] to-[#4ADE80] flex items-center justify-center text-black text-sm font-bold">
              {(profile?.name || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{profile?.name}</p>
              <p className="text-white/40 text-sm truncate">{profile?.email}</p>
            </div>
          </div>
        </Card>

        {/* Plan & Upgrade */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-xs uppercase tracking-wide">Your plan</p>
            <Badge variant={profile?.plan === 'free' ? 'neutral' : 'teal'}>
              {profile?.plan === 'free' ? 'Free' : profile?.plan}
            </Badge>
          </div>

          {nextPlan && (
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border border-[#00B4B4]/20">
              <p className="font-semibold text-sm mb-2">
                Upgrade to {nextPlan === 'core' ? 'Core' : 'Pro'} — ${nextPlan === 'core' ? '14' : '29'}/mo
              </p>
              <ul className="space-y-1.5 mb-3">
                {planFeatures[nextPlan]?.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-white/60">
                    <span className="text-[#4ADE80]">+</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => upgrade(nextPlan)}
                loading={upgrading}
                size="sm"
                className="w-full"
              >
                Upgrade to {nextPlan === 'core' ? 'Core' : 'Pro'}
              </Button>
            </div>
          )}

          {profile?.plan !== 'free' && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/stripe/portal', { method: 'POST' })
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                  else toast('Unable to open subscription management. Please contact support.', 'error')
                } catch {
                  toast('Unable to open subscription management. Please contact support.', 'error')
                }
              }}
              className="text-white/40 text-sm hover:text-white/60 mt-3 transition-colors"
            >
              Manage subscription →
            </button>
          )}
        </Card>

        {/* Preferences */}
        <Card>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Preferences</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Daily check-in email</p>
              <p className="text-white/30 text-xs mt-0.5">
                {profile?.plan === 'free' ? 'Upgrade to Core to enable reminders' : "We'll remind you to log if you haven't today"}
              </p>
            </div>
            <button
              onClick={async () => {
                if (profile?.plan === 'free') return
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
                profile?.plan === 'free'
                  ? 'bg-white/10 cursor-not-allowed'
                  : profile?.gut_profile?.remindersEnabled ? 'bg-[#4ADE80]' : 'bg-white/20'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                profile?.gut_profile?.remindersEnabled && profile?.plan !== 'free' ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </Card>

        {/* Export data */}
        <Card>
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
        <p className="text-white/20 text-xs text-center pt-4 pb-8">
          gutted. is not a medical service. Always consult a healthcare professional for medical advice.
          <br />© 2026 gutted. All rights reserved.
        </p>
      </div>
    </div>
  )
}
