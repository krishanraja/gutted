'use client'
import { useEffect, useState } from 'react'

interface GutScoreProps {
  score: number
  size?: 'sm' | 'lg'
  animate?: boolean
}

export function GutScore({ score, size = 'lg', animate = true }: GutScoreProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score)
  const [progress, setProgress] = useState(animate ? 0 : score / 10)

  useEffect(() => {
    if (!animate) return
    let start = 0
    const duration = 1200
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(eased * score)
      setDisplayed(current)
      setProgress(eased * (score / 10))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [score, animate])

  const color = score >= 7 ? '#4ADE80' : score >= 4 ? '#FBBF24' : '#F87171'
  const dim = size === 'lg' ? 120 : 60
  const r = size === 'lg' ? 48 : 24
  const strokeW = size === 'lg' ? 6 : 4
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeW}/>
        <circle
          cx={dim/2} cy={dim/2} r={r} fill="none"
          stroke={color} strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-bold leading-none ${size === 'lg' ? 'text-3xl' : 'text-lg'}`} style={{ color }}>
          {displayed}
        </span>
        {size === 'lg' && <span className="text-xs text-white/40 mt-0.5">/ 10</span>}
      </div>
    </div>
  )
}
