'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    }
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 max-w-md mx-auto">
      <Link href="/" className="mb-10">
        <Image src="/logo.png" alt="gutted." width={120} height={36} className="h-9 w-auto"/>
      </Link>
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-1">Know your gut.</h1>
        <p className="text-white/50 mb-8">Start for free - no card required</p>
        <form onSubmit={signup} className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Your name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4ADE80]/50 transition-colors"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4ADE80]/50 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1.5">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4ADE80]/50 transition-colors"
              placeholder="Min. 8 characters"
            />
          </div>
          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{error}</p>}
          <Button type="submit" loading={loading} className="w-full mt-2">Create free account</Button>
        </form>
        <p className="text-white/30 text-xs text-center mt-4">By signing up you agree to our terms and privacy policy.</p>
        <p className="text-center text-white/40 text-sm mt-4">
          Already have an account? <Link href="/auth/login" className="text-[#4ADE80] hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
