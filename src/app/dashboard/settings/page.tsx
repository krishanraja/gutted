'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Navigation } from '@/components/Navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface Profile { name: string; email: string; plan: string }

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('name, email, plan').eq('id', user.id).single()
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
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin"/>
    </div>
  )

  return (
    <div className="min-h-screen bg-black pb-24">
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
              <button onClick={() => upgrade('core')} className="text-[#4ADE80] text-sm font-medium hover:underline">
                Upgrade →
              </button>
            )}
          </div>
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
