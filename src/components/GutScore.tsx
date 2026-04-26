'use client'
import { useEffect, useState, useRef } from 'react'
import { haptic } from '@/lib/haptics'

interface GutScoreProps {
  score: number
  size?: 'sm' | 'lg'
  animate?: boolean
}

export function GutScore({ score, size = 'lg', animate = true }: GutScoreProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score)
  const [progress, setProgress] = useState(animate ? 0 : score / 10)
  const hapticFired = useRef(false)

  useEffect(() => {
    if (!animate) return
    hapticFired.current = false
    const duration = 800
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      // Ease-out cubic — clean, no overshoot
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(eased * score)
      setDisplayed(Math.min(current, score))
      setProgress(Math.min(eased, 1) * (score / 10))
      if (t < 1) {
        requestAnimationFrame(tick)
      } else if (!hapticFired.current && score > 0) {
        hapticFired.current = true
        haptic.scoreReveal()
      }
    }
    requestAnimationFrame(tick)
  }, [score, animate])

  const color = score >= 7 ? '#3FBE6F' : score >= 4 ? '#E8AE1E' : '#E96363'
  const dim = size === 'lg' ? 132 : 60
  const r = size === 'lg' ? 56 : 24
  const strokeW = size === 'lg' ? 4 : 3
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={dim/2} cy={dim/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW}/>
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
        <span
          className={`num font-semibold leading-none tracking-tight ${size === 'lg' ? 'text-5xl' : 'text-lg'}`}
          style={{ color }}
        >
          {displayed}
        </span>
        {size === 'lg' && (
          <span className="num text-xs text-white/35 mt-1.5 tracking-wide">/ 10</span>
        )}
      </div>
    </div>
  )
}
