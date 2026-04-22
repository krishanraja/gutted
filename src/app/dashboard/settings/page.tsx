'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { BottomSheet } from '@/components/BottomSheet'
import { Avatar } from '@/components/Avatar'
import { AVATAR_OPTIONS } from '@/components/avatars'
import { useUpgrade } from '@/hooks/useUpgrade'
import { useToast } from '@/components/ToastProvider'

interface Profile {
  name: string
  email: string
  plan: string
  gut_profile?: Record<string, unknown>
  subscription_status?: string | null
  current_period_end?: string | null
  created_at?: string
  avatar_id?: string | null
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
    'Unlimited voice logging & food checker',
    '5 doc uploads + enhanced pattern detection',
    'Weekly meal plan & grocery list',
    'AI Gut Coach (10 chats/mo) + reminders',
  ],
  pro: [
    'Everything in Core, unlimited',
    'Photo food logging + unlimited uploads',
    'PDF reports & doctor visit summary',
    'Monthly progress + supplement recs',
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
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false)
  const [showManageSheet, setShowManageSheet] = useState(false)
  const [showAvatarSheet, setShowAvatarSheet] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState<string | null>(null)
  const [logCount, setLogCount] = useState(0)
  const [docCount, setDocCount] = useState(0)
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

      const [{ data }, { count: lc }, { count: dc }] = await Promise.all([
        supabase.from('profiles').select('name, email, plan, gut_profile, subscription_status, current_period_end, created_at, avatar_id').eq('id', user.id).single(),
        supabase.from('logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      setProfile(data)
      setLogCount(lc || 0)
      setDocCount(dc || 0)
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
        setShowManageSheet(false)
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
        setShowManageSheet(false)
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
        setShowManageSheet(false)
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

  const handleSelectAvatar = async (avatarId: string) => {
    setSavingAvatar(avatarId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingAvatar(null); return }
    const previous = profile?.avatar_id ?? null
    setProfile(prev => prev ? { ...prev, avatar_id: avatarId } : prev)
    const { error } = await supabase.from('profiles').update({ avatar_id: avatarId }).eq('id', user.id)
    setSavingAvatar(null)
    if (error) {
      setProfile(prev => prev ? { ...prev, avatar_id: previous } : prev)
      toast('Could not save your avatar. Please try again.', 'error')
      return
    }
    setShowAvatarSheet(false)
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
    <div className="mobile-viewport bg-black items-center justify-center md:static md:min-h-screen md:flex">
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

  const formatShortDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const gutProfile = profile?.gut_profile || {}
  const goals = (gutProfile.goals as string[]) || []
  const restrictions = (gutProfile.restrictions as string[]) || []
  const conditions = (gutProfile.conditions as string[]) || []

  return (
    <div className="mobile-viewport bg-black md:ml-60 lg:ml-64">
      <div className="flex-1 overflow-y-auto pb-nav md:overflow-visible md:pb-8">
      <div className="px-6 pt-12 pb-6 max-w-lg">

        {/* ── Profile Hero ── */}
        <div className="flex flex-col items-center text-center mb-8">
          <button
            onClick={() => setShowAvatarSheet(true)}
            aria-label="Change avatar"
            className="mb-3 rounded-full transition-transform active:scale-95 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50"
          >
            <Avatar name={profile?.name} email={profile?.email} avatarId={profile?.avatar_id} size="lg" />
          </button>
          <h1 className="text-xl font-bold">{profile?.name || 'Your Profile'}</h1>
          <p className="text-white/40 text-sm mt-0.5">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={currentPlan === 'free' ? 'neutral' : 'teal'}>
              {currentPlan === 'free' ? 'Free' : currentPlan === 'core' ? 'Core' : 'Pro'}
            </Badge>
            {isCanceling && <Badge variant="amber">Canceling</Badge>}
            {isPastDue && <Badge variant="red">Past due</Badge>}
          </div>
          {profile?.created_at && (
            <p className="text-white/25 text-xs mt-2">Member since {formatShortDate(profile.created_at)}</p>
          )}
        </div>
      </div>

      <div className="px-6 space-y-4 max-w-lg">

        {/* ── Quick Stats ── */}
        <Card entrance="fade-up">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold">{logCount}</p>
              <p className="text-white/40 text-xs">Logs</p>
            </div>
            <div>
              <p className="text-lg font-bold">{docCount}</p>
              <p className="text-white/40 text-xs">Documents</p>
            </div>
            <div>
              <p className="text-lg font-bold">
                {profile?.created_at
                  ? Math.max(1, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)))
                  : '—'}
              </p>
              <p className="text-white/40 text-xs">Days</p>
            </div>
          </div>
        </Card>

        {/* ── Past Due Warning ── */}
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

        {/* ── Canceling Banner ── */}
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

        {/* ── Subscription & Plan ── */}
        <Card entrance="fade-up" delay={80}>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Subscription</p>

          <div className="space-y-3">
            {/* Plan row */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Plan</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {currentPlan === 'free' ? 'Free' : currentPlan === 'core' ? 'Core' : 'Pro'}
                </span>
                {currentPlan !== 'free' && (
                  <span className="text-white/40 text-sm">${currentPlan === 'core' ? '14' : '29'}/mo</span>
                )}
              </div>
            </div>

            {/* Billing date for paid users */}
            {currentPlan !== 'free' && periodEnd && !isCanceling && !subLoading && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Next billing</span>
                <span className="text-sm text-white/70">{formatDate(periodEnd)}</span>
              </div>
            )}

            {/* Payment method */}
            {subInfo?.paymentMethod && !subLoading && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Payment</span>
                <span className="text-sm text-white/70 capitalize">
                  {subInfo.paymentMethod.brand} **** {subInfo.paymentMethod.last4}
                </span>
              </div>
            )}

            {subLoading && currentPlan !== 'free' && (
              <div className="h-8 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4 pt-3 border-t border-white/5">
            {currentPlan === 'free' ? (
              <Button
                size="sm"
                onClick={() => setShowUpgradeSheet(true)}
                className="w-full"
              >
                Upgrade plan
              </Button>
            ) : (
              <>
                {!isCanceling && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowManageSheet(true)}
                    className="flex-1"
                  >
                    Manage
                  </Button>
                )}
                {currentPlan === 'core' && !isCanceling && (
                  <Button
                    size="sm"
                    onClick={() => setShowUpgradeSheet(true)}
                    className="flex-1"
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </>
            )}
          </div>
        </Card>

        {/* ── Gut Health Profile ── */}
        <Card entrance="fade-up" delay={160}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-xs uppercase tracking-wide">Gut Health Profile</p>
            <Link
              href="/onboarding"
              className="text-[#4ADE80] text-xs font-medium hover:underline"
            >
              Edit
            </Link>
          </div>

          {goals.length > 0 && (
            <div className="mb-3">
              <p className="text-white/50 text-xs mb-1.5">Goals</p>
              <div className="flex flex-wrap gap-1.5">
                {goals.map(g => (
                  <span key={g} className="bg-white/10 rounded-full px-3 py-1 text-xs text-white/70">{g}</span>
                ))}
              </div>
            </div>
          )}

          {restrictions.length > 0 && restrictions[0] !== 'None' && (
            <div className="mb-3">
              <p className="text-white/50 text-xs mb-1.5">Dietary restrictions</p>
              <div className="flex flex-wrap gap-1.5">
                {restrictions.map(r => (
                  <span key={r} className="bg-white/10 rounded-full px-3 py-1 text-xs text-white/70">{r}</span>
                ))}
              </div>
            </div>
          )}

          {conditions.length > 0 && conditions[0] !== 'None' && conditions[0] !== 'Prefer not to say' && (
            <div>
              <p className="text-white/50 text-xs mb-1.5">Conditions</p>
              <div className="flex flex-wrap gap-1.5">
                {conditions.map(c => (
                  <span key={c} className="bg-white/10 rounded-full px-3 py-1 text-xs text-white/70">{c}</span>
                ))}
              </div>
            </div>
          )}

          {goals.length === 0 && restrictions.length === 0 && conditions.length === 0 && (
            <p className="text-white/30 text-sm">
              No profile data yet.{' '}
              <Link href="/onboarding" className="text-[#4ADE80] hover:underline">Complete your profile</Link>
            </p>
          )}
        </Card>

        {/* ── Preferences ── */}
        <Card entrance="fade-up" delay={240}>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Preferences</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <div>
                <p className="text-sm">Daily check-in reminder</p>
                <p className="text-white/30 text-xs mt-0.5">
                  {currentPlan === 'free' ? 'Available on Core & Pro' : "We'll remind you to log daily"}
                </p>
              </div>
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
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                currentPlan === 'free'
                  ? 'bg-white/10 cursor-not-allowed'
                  : profile?.gut_profile?.remindersEnabled ? 'bg-[#4ADE80]' : 'bg-white/20'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                profile?.gut_profile?.remindersEnabled && currentPlan !== 'free' ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </Card>

        {/* ── Data & Privacy ── */}
        <Card entrance="fade-up" delay={320}>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Data & Privacy</p>

          {/* Export data */}
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
            className="flex items-center gap-3 w-full py-3 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm group-hover:text-white/90 transition-colors">Export all my data</p>
              <p className="text-white/30 text-xs">Download as JSON file</p>
            </div>
            <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <div className="border-t border-white/5" />

          {/* Integrations */}
          <Link
            href="/dashboard/integrations"
            className="flex items-center gap-3 w-full py-3 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm group-hover:text-white/90 transition-colors">Connected apps</p>
              <p className="text-white/30 text-xs">Health integrations & tracking</p>
            </div>
            <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </Card>

        {/* ── Support & About ── */}
        <Card entrance="fade-up" delay={400}>
          <p className="text-white/40 text-xs uppercase tracking-wide mb-2">About</p>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-white/60">App version</span>
            <span className="text-sm text-white/30">1.0.0</span>
          </div>

          <div className="border-t border-white/5" />

          <button
            onClick={() => window.open('mailto:support@gutted.app', '_blank')}
            className="flex items-center gap-3 w-full py-3 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm group-hover:text-white/90 transition-colors">Help & support</p>
            </div>
            <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </Card>

        {/* ── Sign Out ── */}
        <Button onClick={signOut} loading={signingOut} variant="outline" className="w-full">
          Sign out
        </Button>

        {/* ── Legal ── */}
        <p className="text-white/20 text-xs text-center pt-4 pb-8">
          gutted. is not a medical service. Always consult a healthcare professional for medical advice.
          <br />© 2026 gutted. All rights reserved.
        </p>
      </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BottomSheet: Upgrade Plans                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      <BottomSheet
        open={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        title="Choose a plan"
      >
        <div className="space-y-2">
          {(['core', 'pro'] as const).map(plan => {
            const isCurrentPlan = currentPlan === plan
            return (
              <div
                key={plan}
                className={`p-3 rounded-xl border ${
                  isCurrentPlan
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gradient-to-r from-[#00B4B4]/10 to-[#4ADE80]/10 border-[#00B4B4]/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm">
                    {plan === 'core' ? 'Core' : 'Pro'}
                  </p>
                  <span className="text-white/70 text-sm font-medium">
                    ${plan === 'core' ? '14' : '29'}/mo
                  </span>
                </div>
                <ul className="space-y-1 mb-3">
                  {PLAN_FEATURES[plan].map(feature => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-white/60">
                      <span className="text-[#4ADE80]">+</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <p className="text-center text-white/30 text-xs py-2">Current plan</p>
                ) : currentPlan !== 'free' ? (
                  <Button
                    onClick={() => handleChangePlan(plan)}
                    loading={actionLoading === 'change-plan'}
                    size="sm"
                    className="w-full"
                    variant={plan === 'core' ? 'outline' : 'gradient'}
                  >
                    {plan === 'core' ? 'Switch to Core' : 'Upgrade to Pro'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => upgrade(plan)}
                    loading={upgrading}
                    size="sm"
                    className="w-full"
                  >
                    Get {plan === 'core' ? 'Core' : 'Pro'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </BottomSheet>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BottomSheet: Manage Subscription                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      <BottomSheet
        open={showManageSheet}
        onClose={() => { setShowManageSheet(false); setShowCancelConfirm(false); setShowDowngradeConfirm(false) }}
        title="Manage subscription"
      >
        <div className="space-y-4">
          {/* Current plan info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/50">
              <span>Plan</span>
              <span className="text-white/70 font-medium">{currentPlan === 'core' ? 'Core' : 'Pro'} - ${currentPlan === 'core' ? '14' : '29'}/mo</span>
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

          <div className="border-t border-white/10" />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUpdatePayment}
              loading={actionLoading === 'portal'}
              className="w-full"
            >
              Update payment method
            </Button>

            {currentPlan === 'pro' && !isCanceling && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDowngradeConfirm(true)}
                className="w-full border border-white/10"
              >
                Switch to Core ($14/mo)
              </Button>
            )}

            {currentPlan === 'core' && !isCanceling && (
              <Button
                size="sm"
                onClick={() => { setShowManageSheet(false); setShowUpgradeSheet(true) }}
                className="w-full"
              >
                Upgrade to Pro
              </Button>
            )}

            {isCanceling ? (
              <Button
                size="sm"
                onClick={handleResume}
                loading={actionLoading === 'resume'}
                className="w-full"
              >
                Resume subscription
              </Button>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-red-400/60 text-sm hover:text-red-400 transition-colors w-full text-center py-2"
              >
                Cancel subscription
              </button>
            )}
          </div>

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/30">
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
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Downgrade Confirmation */}
          {showDowngradeConfirm && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30">
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
            </div>
          )}
        </div>
      </BottomSheet>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* BottomSheet: Pick Avatar                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <BottomSheet
        open={showAvatarSheet}
        onClose={() => setShowAvatarSheet(false)}
        title="Pick your gut"
      >
        <p className="text-white/40 text-xs mb-4">A little personality for your profile.</p>
        <div className="grid grid-cols-3 gap-3">
          {AVATAR_OPTIONS.map(opt => {
            const selected = profile?.avatar_id === opt.id
            const saving = savingAvatar === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectAvatar(opt.id)}
                disabled={savingAvatar !== null}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                  selected
                    ? 'bg-white/10 border-[#4ADE80]/60'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                } ${savingAvatar !== null && !saving ? 'opacity-50' : ''}`}
              >
                <div className={`w-16 h-16 rounded-full ${opt.gradient} flex items-center justify-center overflow-hidden ${saving ? 'animate-pulse' : ''}`}>
                  <opt.Component />
                </div>
                <span className="text-[11px] text-white/70 leading-tight text-center">{opt.name}</span>
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </div>
  )
}
