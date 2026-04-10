'use client'

function emailToHue(email: string): number {
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

const SIZE = {
  sm: 'w-8 h-8 text-xs',
  lg: 'w-16 h-16 text-2xl',
} as const

interface AvatarProps {
  name?: string | null
  email?: string | null
  size?: 'sm' | 'lg'
}

export function Avatar({ name, email, size = 'lg' }: AvatarProps) {
  const sizeClass = SIZE[size]

  // Case 1: Name exists — show initial in brand gradient
  if (name && name.trim()) {
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-[#00B4B4] to-[#4ADE80] flex items-center justify-center text-black font-bold shrink-0`}>
        {name.trim()[0].toUpperCase()}
      </div>
    )
  }

  // Case 2: No name but email exists — show email initial with deterministic color
  if (email) {
    const hue = emailToHue(email)
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
        style={{ backgroundColor: `hsl(${hue}, 55%, 40%)` }}
      >
        {email[0].toUpperCase()}
      </div>
    )
  }

  // Case 3: No name or email — generic user silhouette
  return (
    <div className={`${sizeClass} rounded-full bg-white/10 flex items-center justify-center shrink-0`}>
      <svg
        className={size === 'sm' ? 'w-4 h-4' : 'w-8 h-8'}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          className="text-white/40"
        />
      </svg>
    </div>
  )
}
