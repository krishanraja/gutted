'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useUpgrade } from '@/hooks/useUpgrade'
import { useToast } from '@/components/ToastProvider'

interface Profile {
  name: string
  email: string
  plan: string
  gut_profile?: Record<string, unknown>
  subscription_status?: string | null
  current_period_end?: string | null
}

interface SubscriptionInfo {
  status: string | null
  plan: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  paymentMethod: { brand: string; last4: string } | null
}

const PLAN_FEATURES: Record<string, string[]> = {
  core: [
    'Unlimited voice logging',
    '5 document uploads/mo',
    'Weekly meal plan + grocery list',
    'AI Gut Coach (10 chats/mo)',
    'Food checker',
    'Enhanced pattern detection',
    'Daily reminders & weekly digest',
  ],
  pro: [
    'Everything in Core',
    'Unlimited document uploads',
    'Unlimited AI Gut Coach',
    'Photo food logging',
    'PDF health reports',
    'Doctor visit summary',
    'Monthly progress reports',
    'Supplement recommendations',
  ],
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null)
  const [subLoading, setSubLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false)
  const { upgrade, upgrading } = useUpgrade()
  const { toast } = useToast()

  const fetchSubscription = useCallback(async () => {
    setSubLoading(true)
    try {
      const res = await fetch('/api/stripe/subscription')
      if (res.ok) {
        const data = await res.json()
        setSubInfo(data)
      }
    } catch {
      // Silent fail -- profile data is the fallback
    } finally {
      setSubLoading(false)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('name, email, plan, gut_profile, subscription_status, current_period_end').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    if (profile && profile.plan !== 'free') {
      fetchSubscription()
    }
  }, [profile, fetchSubscription])

  const signOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleChangePlan = async (plan: string) => {
    setActionLoading('change-plan')
    try {
      const res = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setProfile(prev => prev ? { ...prev, plan } : prev)
        toast(`Switched to ${plan === 'core' ? 'Core' : 'Pro'} plan successfully!`, 'success')
        setShowDowngradeConfirm(false)
        fetchSubscription()
      } else {
        toast(data.error || 'Could not change plan. Please try again.', 'error')
      }
    } catch {
      toast('Could not change plan. Please try again.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async () => {
    setActionLoading('cancel')
    try {
      const res = await fetch('/api/stripe/cancel', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast('Subscription will cancel at the end of your billing period.', 'success')
        setShowCancelConfirm(false)
        setProfile(prev => prev ? { ...prev, subscription_status: 'canceling' } : prev)
        fetchSubscription()
      } else {
        toast(data.error || 'Could not cancel subscription.', 'error')
      }
    } catch {
      toast('Could not cancel subscription. Please try again.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResume = async () => {
    setActionLoading('resume')
    try {
      const res = await fetch('/api/stripe/resume', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast('Subscription resumed! You won\'t lose your features.', 'success')
        setProfile(prev => prev ? { ...prev, subscription_status: 'active' } : prev)
        fetchSubscription()
      } else {
        toast(data.error || 'Could not resume subscription.', 'error')
      }
    } catch {
      toast('Could not resume subscription. Please try again.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdatePayment = async () => {
    setActionLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast(data.error || 'Unable to open billing portal. Please contact support.', 'error')
      }
    } catch {
      toast('Unable to open billing portal. Please contact support.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin"/>
    </div>
  )

  const currentPlan = subInfo?.plan || profile?.plan || 'free'
  const isCanceling = subInfo?.cancelAtPeriodEnd || profile?.subscription_status === 'canceling'
  const isPastDue = subInfo?.status === 'past_due' || profile?.subscription_status === 'past_due'
  const periodEnd = subInfo?.currentPeriodEnd || profile?.current_period_end

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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

        {/* Past Due Warning */}
        {isPastDue && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm font-semibold mb-1">Payment failed</p>
            <p className="text-white/50 text-xs mb-3">
              Update your payment method to keep your premium features active.
            </p>
            <Button
              size="sm"
              variant="danger"
              onClick={handleUpdatePayment}
              loading={actionLoading === 'portal'}
            >
              Update payment method
            </Button>
          </div>
        )}

        {/* Canceling Banner */}
        {isCanceling && !isPastDue && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-amber-400 text-sm font-semibold mb-1">Subscription ending</p>
            <p className="text-white/50 text-xs mb-3">
              Your {currentPlan === 'core' ? 'Core' : 'Pro'} plan will end
              {periodEnd ? ` on ${formatDate(periodEnd)}` : ' at the end of your billing period'}.
              You&apos;ll lose access to premium features after that.
            </p>
            <Button
              size="sm"
              onClick={handleResume}
              loading={actionLoading === 'resume'}
            >
              Resume subscription
            </Button>
          </div>
        )}

        {/* Plan & Subscription Management */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-xs uppercase tracking-wide">Your plan</p>
            <div className="flex items-center gap-2">
              {isCanceling && <Badge variant="amber">Canceling</Badge>}
              {isPastDue && <Badge variant="red">Past due</Badge>}
              <Badge variant={currentPlan === 'free' ? 'neutral' : 'teal'}>
                {currentPlan === 'free' ? 'Free' : currentPlan === 'core' ? 'Core' : 'Pro'}
              </Badge>
            </div>
          </div>

          {/* Billing info for paid users */}
          {currentPlan !== 'free' && !subLoading && (
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-white/50">
                <span>Amount</span>
                <span className="text-white/70">${currentPlan === 'core' ? '14' : '29'}/mo</span>
              </div>
              {periodEnd && !isCanceling && (
                <div className="flex justify-between text-white/50">
                  <span>Next billing date</span>
                  <span className="text-white/70">{formatDate(periodEnd)}</span>
                </div>
              )}
              {subInfo?.paymentMethod && (
                <div className="flex justify-between text-white/50">
                  <span>Payment method</span>
                  <span className="text-white/70 capitalize">
                    {subInfo.paymentMethod.brand} **** {subInfo.paymentMethod.last4}
                  </span>
                </div>
              )}
            </div>
          )}

          {subLoading && currentPlan !== 'free' && (
            <div className="h-16 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin" />
            </div>
          )}

          {/* Free user: show both plans */}
          {currentPlan === 'free' && (
            <div className="space-y-3 mt-3">
              {(['core', 'pro'] as const).map(plan => (
                <div key={plan} className="p-3 rounded-xl bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border border-[#00B4B4]/20">
                  <p className="font-semibold text-sm mb-2">
                    {plan === 'core' ? 'Core' : 'Pro'} - ${plan === 'core' ? '14' : '29'}/mo
                  </p>
                  <ul className="space-y-1.5 mb-3">
                    {PLAN_FEATURES[plan].map(feature => (
                      <li key={feature} className="flex items-center gap-2 text-xs text-white/60">
                        <span className="text-[#4ADE80]">+</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => upgrade(plan)}
                    loading={upgrading}
                    size="sm"
                    className="w-full"
                  >
                    Upgrade to {plan === 'core' ? 'Core' : 'Pro'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Core user: show upgrade to Pro */}
          {currentPlan === 'core' && !isCanceling && (
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border border-[#00B4B4]/20">
              <p className="font-semibold text-sm mb-2">
                Upgrade to Pro - $29/mo
              </p>
              <ul className="space-y-1.5 mb-3">
                {PLAN_FEATURES.pro.map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-white/60">
                    <span className="text-[#4ADE80]">+</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleChangePlan('pro')}
                loading={actionLoading === 'change-plan'}
                size="sm"
                className="w-full"
              >
                Upgrade to Pro
              </Button>
            </div>
          )}

          {/* Pro user: show downgrade to Core */}
          {currentPlan === 'pro' && !isCanceling && (
            <button
              onClick={() => setShowDowngradeConfirm(true)}
              className="text-white/30 text-xs hover:text-white/50 mt-3 transition-colors"
            >
              Switch to Core ($14/mo) →
            </button>
          )}

          {/* Cancel / Manage buttons for paid users */}
          {currentPlan !== 'free' && !isCanceling && (
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
              <button
                onClick={handleUpdatePayment}
                className="text-white/40 text-sm hover:text-white/60 transition-colors"
              >
                Update payment method
              </button>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-red-400/60 text-sm hover:text-red-400 transition-colors ml-auto"
              >
                Cancel subscription
              </button>
            </div>
          )}
        </Card>

        {/* Cancel Confirmation Dialog */}
        {showCancelConfirm && (
          <Card className="border-red-500/30 bg-red-500/5">
            <p className="font-semibold text-sm mb-2">Cancel your subscription?</p>
            <p className="text-white/50 text-xs mb-2">
              Your {currentPlan === 'core' ? 'Core' : 'Pro'} features will remain active until
              {periodEnd ? ` ${formatDate(periodEnd)}` : ' the end of your billing period'}.
              After that, your account will switch to the Free plan.
            </p>
            <p className="text-white/30 text-xs mb-4">
              You can reactivate anytime before your billing period ends. Your data will not be deleted.
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1"
              >
                Keep subscription
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleCancel}
                loading={actionLoading === 'cancel'}
                className="flex-1"
              >
                Cancel subscription
              </Button>
            </div>
          </Card>
        )}

        {/* Downgrade Confirmation Dialog */}
        {showDowngradeConfirm && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <p className="font-semibold text-sm mb-2">Switch to Core?</p>
            <p className="text-white/50 text-xs mb-2">
              You&apos;ll lose access to these Pro features:
            </p>
            <ul className="space-y-1 mb-3">
              {['Unlimited AI Gut Coach', 'PDF health reports', 'Doctor visit summary', 'Photo food logging', 'Supplement recommendations'].map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-white/40">
                  <span className="text-red-400">-</span>
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-white/30 text-xs mb-4">
              Your bill will be reduced to $14/mo. A prorated credit will be applied to your next invoice.
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDowngradeConfirm(false)}
                className="flex-1"
              >
                Keep Pro
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleChangePlan('core')}
                loading={actionLoading === 'change-plan'}
                className="flex-1 border border-white/10"
              >
                Switch to Core
              </Button>
            </div>
          </Card>
        )}

        {/* Preferences */}
        <Card>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Preferences</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Daily check-in email</p>
              <p className="text-white/30 text-xs mt-0.5">
                {currentPlan === 'free' ? 'Upgrade to Core to enable reminders' : "We'll remind you to log if you haven't today"}
              </p>
            </div>
            <button
              onClick={async () => {
                if (currentPlan === 'free') return
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
                currentPlan === 'free'
                  ? 'bg-white/10 cursor-not-allowed'
                  : profile?.gut_profile?.remindersEnabled ? 'bg-[#4ADE80]' : 'bg-white/20'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                profile?.gut_profile?.remindersEnabled && currentPlan !== 'free' ? 'translate-x-6' : 'translate-x-0.5'
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
