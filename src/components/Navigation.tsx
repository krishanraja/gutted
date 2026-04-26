'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DesktopSidebar } from '@/components/DesktopLayout'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { haptic } from '@/lib/haptics'
import { HeartPulseIcon, UtensilsIcon, SettingsIcon } from '@/components/icons'

const navItems = [
  { href: '/dashboard', label: 'Gut', Icon: HeartPulseIcon },
  { href: '/dashboard/food', label: 'Food', Icon: UtensilsIcon },
  { href: '/dashboard/settings', label: 'Settings', Icon: SettingsIcon },
]

export function Navigation() {
  const pathname = usePathname()
  useKeyboardShortcuts()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-xl border-t border-white/[0.06] pb-safe md:hidden">
        <div className="flex items-stretch justify-around px-2 max-w-lg mx-auto" style={{ height: '3.5rem' }}>
          {navItems.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => haptic.tap()}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors duration-150 ${active ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
              >
                <Icon size={20} />
                <span className="text-[11px] font-medium tracking-tight">{label}</span>
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-accent rounded-full" />}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
