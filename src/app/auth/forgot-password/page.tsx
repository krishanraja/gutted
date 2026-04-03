'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/icon.png" alt="gutted." width={40} height={40} className="h-10 w-10" />
        </div>

        {sent ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-white/40 text-sm mb-8">We sent a password reset link to <span className="text-white/70">{email}</span></p>
            <Link href="/auth/login" className="text-[#4ADE80] text-sm hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-2">Reset your password</h1>
            <p className="text-white/40 text-center mb-8 text-sm">Enter your email and we'll send you a reset link</p>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00B4B4]/50 transition-colors"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" loading={loading} className="w-full">Send reset link</Button>
            </form>

            <p className="text-center text-white/40 text-sm mt-6">
              <Link href="/auth/login" className="text-[#4ADE80] hover:underline">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
