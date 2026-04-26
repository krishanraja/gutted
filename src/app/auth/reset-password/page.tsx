'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/icon.png" alt="gutted." width={40} height={40} className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-medium tracking-tight text-center mb-2">Set a new password</h1>
        <p className="text-white/45 text-center mb-8 text-sm">Choose a new password for your account.</p>

        <form onSubmit={handleUpdate} className="space-y-4" noValidate>
          <TextInput
            type="password"
            label="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            hint="Minimum 6 characters."
          />
          <TextInput
            type="password"
            label="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            error={error || null}
          />
          <Button type="submit" loading={loading} className="w-full">Update password</Button>
        </form>
      </div>
    </div>
  )
}
