'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  name: string
  email: string
  plan: string
  gut_profile: Record<string, unknown> | null
  onboarding_complete: boolean
  avatar_id: string | null
}

interface AuthContextType {
  user: { id: string; email: string } | null
  profile: Profile | null
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }
    setUser({ id: u.id, email: u.email || '' })
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
    if (p) setProfile(p as Profile)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(audit-#19): mount-time data load. Migrate to React 19 `use()` + Suspense as part of file split.
  useEffect(() => { load() }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, refresh: load }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
