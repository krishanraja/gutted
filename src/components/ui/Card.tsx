import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
}

export function Card({ children, className = '', glow }: CardProps) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 ${glow ? 'shadow-lg shadow-[#00B4B4]/10' : ''} ${className}`}>
      {children}
    </div>
  )
}
