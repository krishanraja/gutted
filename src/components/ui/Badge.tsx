import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'green' | 'amber' | 'red' | 'teal' | 'neutral'
}

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const variants = {
    green: 'bg-[#3FBE6F]/12 text-[#3FBE6F]',
    amber: 'bg-[#E8AE1E]/12 text-[#E8AE1E]',
    red: 'bg-[#E96363]/12 text-[#E96363]',
    teal: 'bg-[#00B4B4]/12 text-[#00B4B4]',
    neutral: 'bg-white/8 text-white/70',
  }
  return (
    <span className={`num inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
