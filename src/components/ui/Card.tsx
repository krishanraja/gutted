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
      className={`bg-white/5 border border-white/10 rounded-2xl p-4 ${glow ? 'shadow-lg shadow-[#00B4B4]/10 animate-glow-pulse' : ''} ${animClass} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
