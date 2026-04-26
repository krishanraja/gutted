'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'

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
            <p className="text-white/40 text-center mb-8 text-sm">Enter your email and we&apos;ll send you a reset link</p>

            <form onSubmit={handleReset} className="space-y-4" noValidate>
              <TextInput
                type="email"
                label="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                error={error || null}
              />
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
