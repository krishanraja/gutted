'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const signup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, email, name })
      router.push('/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="gutted." width={120} height={40} className="h-10 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Know your gut.</h1>
        <p className="text-white/40 text-center mb-8 text-sm">Free to start - no card needed</p>

        <form onSubmit={signup} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Your name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="Alex"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00B4B4]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00B4B4]/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              placeholder="At least 6 characters"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00B4B4]/50 transition-colors"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">Create account</Button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#4ADE80] hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-white/20 text-xs mt-4">
          By signing up you agree to our terms. gutted. is not a medical service.
        </p>
      </div>
    </div>
  )
}
