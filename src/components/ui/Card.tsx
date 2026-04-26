import { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
  entrance?: 'fade-up' | 'scale-in' | 'fade-in'
  delay?: number
}

export function Card({ children, className = '', glow, entrance, delay }: CardProps) {
  const animClass = entrance ? `animate-${entrance}` : ''
  const style: CSSProperties | undefined = delay !== undefined ? { animationDelay: `${delay}ms` } : undefined

  return (
    <div
      className={`bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 ${glow ? 'bg-white/[0.06] border-white/15' : ''} ${animClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
