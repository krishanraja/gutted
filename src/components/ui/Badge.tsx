import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'green' | 'amber' | 'red' | 'teal' | 'neutral'
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const variants = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    teal: 'bg-[#00B4B4]/20 text-[#00B4B4] border-[#00B4B4]/30',
    neutral: 'bg-white/10 text-white/70 border-white/20',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
      {children}
    </span>
  )
}
