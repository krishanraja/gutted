import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Redirect legacy routes to new tab structure
  const legacyRedirects: Record<string, string> = {
    '/dashboard/log': '/dashboard?tab=log',
    '/dashboard/history': '/dashboard?tab=history',
    '/dashboard/coach': '/dashboard?tab=coach',
    '/dashboard/meal-plan': '/dashboard/food',
    '/dashboard/upload': '/dashboard/food?tab=upload',
    '/dashboard/food-checker': '/dashboard/food?tab=check',
    '/dashboard/supplements': '/dashboard/food?tab=supplements',
  }
  if (legacyRedirects[pathname]) {
    return NextResponse.redirect(new URL(legacyRedirects[pathname], request.url), 301)
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    if (!user) return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect to onboarding if not completed (only for dashboard routes).
  // Cache result in a cookie to avoid a DB query on every request.
  if (user && pathname.startsWith('/dashboard')) {
    const onboardingCookie = request.cookies.get('onboarding_complete')?.value
    if (onboardingCookie === 'true') {
      // Already verified — skip DB query
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .single()
      if (profile && profile.onboarding_complete === false) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      if (profile?.onboarding_complete) {
        supabaseResponse.cookies.set('onboarding_complete', 'true', {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60, // 1 hour — short enough that a reset elsewhere takes effect quickly
          path: '/',
        })
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|logo.png|manifest.json|api/).*)'],
}
