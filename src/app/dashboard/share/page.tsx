'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getPlanLimits } from '@/lib/plan-limits'
import Link from 'next/link'

interface Share {
  id: string; practitioner_email: string; practitioner_name: string | null
  access_token: string; is_active: boolean; created_at: string; last_accessed_at: string | null
}

export default function SharePage() {
  const router = useRouter()
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)
  const [shares, setShares] = useState<Share[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [error, setError] = useState('')

  const limits = getPlanLimits(plan)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
      setPlan(profile?.plan || 'free')

      if (profile?.plan === 'pro') {
        const res = await fetch('/api/practitioner')
        const data = await res.json()
        if (data.shares) setShares(data.shares)
      }
      setLoading(false)
    }
    load()
  }, [router])

  const createShare = async () => {
    if (!email.trim()) return
    setCreating(true)
    setError('')
    setShareUrl('')
    try {
      const res = await fetch('/api/practitioner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practitionerEmail: email, practitionerName: name }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setShareUrl(data.shareUrl)
      setEmail('')
      setName('')
      // Refresh shares
      const sharesRes = await fetch('/api/practitioner')
      const sharesData = await sharesRes.json()
      if (sharesData.shares) setShares(sharesData.shares)
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  const revokeShare = async (id: string) => {
    await fetch('/api/practitioner', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setShares(prev => prev.filter(s => s.id !== id))
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#00B4B4] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-8 md:ml-60 lg:ml-64">
      <div className="px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/40 text-sm mb-4 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <h1 className="text-2xl font-bold">Share with Practitioner</h1>
        <p className="text-white/40 text-sm mt-1">Give your doctor or nutritionist read-only access to your data</p>
      </div>

      {!limits.pdfReports ? (
        <div className="px-6">
          <Card className="text-center py-10">
            <div className="text-4xl mb-4">👩‍⚕️</div>
            <p className="font-semibold mb-2">Unlock practitioner sharing</p>
            <p className="text-white/40 text-sm mb-6">Upgrade to Pro to share your gut health data with your doctor or nutritionist via a secure link.</p>
            <Link href="/dashboard/settings" className="text-[#4ADE80] text-sm font-medium hover:underline">Upgrade to Pro →</Link>
          </Card>
        </div>
      ) : (
        <div className="px-6 space-y-4 mb-6">
          {/* Create new share */}
          <Card>
            <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Invite a practitioner</p>
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Practitioner name (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#00B4B4]/50"
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Practitioner email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#00B4B4]/50"
              />
              <Button onClick={createShare} loading={creating} className="w-full" disabled={!email.trim()}>
                Send invitation
              </Button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            {shareUrl && (
              <div className="mt-3 bg-[#4ADE80]/10 border border-[#4ADE80]/20 rounded-xl p-3">
                <p className="text-[#4ADE80] text-sm mb-2">Invitation sent! Share link:</p>
                <div className="flex gap-2">
                  <input type="text" readOnly value={shareUrl} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/60 text-xs" />
                  <button
                    onClick={() => { navigator.clipboard.writeText(shareUrl) }}
                    className="text-[#4ADE80] text-xs font-medium shrink-0"
                  >Copy</button>
                </div>
              </div>
            )}
          </Card>

          {/* Existing shares */}
          {shares.length > 0 && (
            <Card>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">Active shares</p>
              <div className="space-y-3">
                {shares.map(s => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">{s.practitioner_name || s.practitioner_email}</p>
                      {s.practitioner_name && <p className="text-white/30 text-xs">{s.practitioner_email}</p>}
                      <p className="text-white/20 text-xs mt-0.5">
                        {s.last_accessed_at
                          ? `Last viewed ${new Date(s.last_accessed_at).toLocaleDateString()}`
                          : 'Not yet viewed'}
                      </p>
                    </div>
                    <button onClick={() => revokeShare(s.id)} className="text-red-400 text-xs hover:underline">Revoke</button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Info */}
          <Card className="bg-white/5">
            <p className="text-white/30 text-xs leading-relaxed">
              Practitioners receive read-only access to your last 30 days of logs, test results, and patterns. They cannot modify your data. You can revoke access at any time.
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
