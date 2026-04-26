import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Only accept same-origin relative paths. Reject absolute URLs, protocol-relative
// `//evil.com`, and backslash tricks `/\evil.com` that some browsers resolve to
// a different origin.
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/')) return '/dashboard'
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/dashboard'
  return raw
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = safeNext(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=Authentication failed`)
    }

    // Ensure a profile exists for OAuth / magic-link users
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existing) {
        const name =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          ''
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          name,
        })
        // New user - send to onboarding
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
      }
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}