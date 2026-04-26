'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'password' | 'magic-link'>('password')

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  const loginWithGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  const loginWithMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Please enter your email'); return }
    setMagicLinkLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setMagicLinkLoading(false) }
    else { setMagicLinkSent(true); setMagicLinkLoading(false) }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/icon.png" alt="gutted." width={40} height={40} className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-center mb-2">Welcome back</h1>
        <p className="text-white/45 text-center mb-8 text-sm">Sign in to your gut health dashboard.</p>

        <button
          onClick={loginWithGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs uppercase">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {magicLinkSent ? (
          <div className="text-center py-4">
            <p className="text-accent font-medium mb-2">Check your email</p>
            <p className="text-white/40 text-sm">We sent a sign-in link to <span className="text-white/60">{email}</span></p>
            <button onClick={() => setMagicLinkSent(false)} className="text-accent text-sm mt-4 hover:underline">
              Try a different method
            </button>
          </div>
        ) : mode === 'password' ? (
          <>
            <form onSubmit={login} className="space-y-4" noValidate>
              <TextInput
                type="email"
                label="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
              <TextInput
                type="password"
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                error={error || null}
              />
              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-accent text-sm hover:underline">Forgot password?</Link>
              </div>
              <Button type="submit" loading={loading} className="w-full">Sign in</Button>
            </form>
            <button onClick={() => { setMode('magic-link'); setError('') }} className="w-full text-center text-white/40 text-sm mt-4 hover:text-white/60 transition-colors">
              Sign in with magic link instead
            </button>
          </>
        ) : (
          <>
            <form onSubmit={loginWithMagicLink} className="space-y-4" noValidate>
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
              <Button type="submit" loading={magicLinkLoading} className="w-full">Send magic link</Button>
            </form>
            <button onClick={() => { setMode('password'); setError('') }} className="w-full text-center text-white/40 text-sm mt-4 hover:text-white/60 transition-colors">
              Sign in with password instead
            </button>
          </>
        )}

        <p className="text-center text-white/40 text-sm mt-6">
          No account?{' '}
          <Link href="/auth/signup" className="text-accent hover:underline">Start free</Link>
        </p>
      </div>
    </div>
  )
}
