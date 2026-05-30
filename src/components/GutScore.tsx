'use client'
import { useEffect, useState, useRef } from 'react'
import { haptic } from '@/lib/haptics'

interface GutScoreProps {
  score: number
  size?: 'sm' | 'lg'
  animate?: boolean
  /** Change vs the prior period. Positive shows a green rise, negative a red dip. */
  delta?: number
}

export function GutScore({ score, size = 'lg', animate = true, delta }: GutScoreProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score)
  const [progress, setProgress] = useState(animate ? 0 : score / 10)
  const hapticFired = useRef(false)

  useEffect(() => {
    if (!animate) return
    hapticFired.current = false
    const duration = 900
    const startTime = performance.now()
    const target = score / 10
    // ease-out-back constants: the ring overshoots its target then settles, so a
    // score reveal feels buoyant and physical, not like a progress bar filling.
    const c1 = 1.70158
    const c3 = c1 + 1
    const tick = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const back = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
      setProgress(Math.max(0, back * target))
      // The number counts up clean (never overshoots above the real score).
      const lin = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.min(Math.round(lin * score), score))
      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        setProgress(target)
        setDisplayed(score)
        if (!hapticFired.current && score > 0) {
          hapticFired.current = true
          haptic.scoreReveal()
        }
      }
    }
    requestAnimationFrame(tick)
  }, [score, animate])

  const color = score >= 7 ? '#3FBE6F' : score >= 4 ? '#E8AE1E' : '#E96363'
  const dim = size === 'lg' ? 132 : 60
  const r = size === 'lg' ? 56 : 24
  const strokeW = size === 'lg' ? 4 : 3
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(progress, 1))

  return (
    <div className={`relative inline-flex items-center justify-center ${score >= 7 && animate ? 'animate-breathe' : ''}`}>
      <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} />
        <circle
          cx={dim / 2} cy={dim / 2} r={r} fill="none"
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
      {size === 'lg' && typeof delta === 'number' && delta !== 0 && (
        <span
          className={`num absolute -right-1 top-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
            delta > 0 ? 'text-[#3FBE6F] bg-[#3FBE6F]/12' : 'text-[#E96363] bg-[#E96363]/12'
          }`}
        >
          {delta > 0 ? '▲' : '▼'}{Math.abs(delta)}
        </span>
      )}
    </div>
  )
}
