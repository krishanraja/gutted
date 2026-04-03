'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Badge } from '@/components/ui/Badge'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: '🏠', shortcut: 'D' },
  { href: '/dashboard/log', label: 'Log', icon: '🎤', shortcut: 'N' },
  { href: '/dashboard/upload', label: 'Upload', icon: '📄', shortcut: 'U' },
  { href: '/dashboard/meal-plan', label: 'Meals', icon: '🍽️', shortcut: 'M' },
  { href: '/dashboard/history', label: 'History', icon: '📊', shortcut: 'H' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️', shortcut: 'S' },
]

export function DesktopSidebar() {
  const pathname = usePathname()
  const { profile } = useAuth()

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 md:fixed md:inset-y-0 md:left-0 bg-black border-r border-white/10 z-40">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Image src="/icon.png" alt="gutted." width={28} height={28} className="h-7 w-7" />
        <span className="font-bold text-lg gradient-text">gutted.</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(item => {
          const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-gradient-to-r from-[#00B4B4]/15 to-[#4ADE80]/10 text-[#4ADE80] border border-[#00B4B4]/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}>
                <span className="text-base">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                <kbd className="hidden lg:inline text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded font-mono">{item.shortcut}</kbd>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Plan badge */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B4B4] to-[#4ADE80] flex items-center justify-center text-black text-xs font-bold">
            {(profile?.name || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.name || 'User'}</p>
            <Badge variant={profile?.plan === 'free' ? 'neutral' : 'teal'}>
              {profile?.plan || 'free'}
            </Badge>
          </div>
        </div>
      </div>
    </aside>
  )
}
