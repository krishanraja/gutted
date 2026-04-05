'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DesktopSidebar } from '@/components/DesktopLayout'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { haptic } from '@/lib/haptics'

const navItems = [
  { href: '/dashboard', label: 'Gut', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )},
  { href: '/dashboard/food', label: 'Food', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.084 1.837 2.165V19.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 19.5v-1.378c0-1.081.768-2.004 1.837-2.164a47.496 47.496 0 011.163-.16M15 13.12V7.5a.75.75 0 00-.75-.75H9.75a.75.75 0 00-.75.75v5.62m6 0H9" />
    </svg>
  )},
  { href: '/dashboard/settings', label: 'Settings', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
]

export function Navigation() {
  const pathname = usePathname()
  useKeyboardShortcuts()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      // Gut tab is active for /dashboard and all gut-related sub-routes
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/log') || pathname.startsWith('/dashboard/history') || pathname.startsWith('/dashboard/coach')
    }
    if (href === '/dashboard/food') {
      return pathname.startsWith('/dashboard/food') || pathname.startsWith('/dashboard/meal-plan') || pathname.startsWith('/dashboard/upload') || pathname.startsWith('/dashboard/food-checker') || pathname.startsWith('/dashboard/supplements')
    }
    return pathname.startsWith(href)
  }

  return (
    <>
    <DesktopSidebar />
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 pb-safe md:hidden">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => haptic.tap()}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${active ? 'text-[#4ADE80] scale-110' : 'text-white/40 hover:text-white/70 scale-100'} transition-transform duration-200`}
            >
              {icon}
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] -mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
    </>
  )
}
