'use client'
/**
 * Reduced-motion-aware motion helpers.
 *
 * A small, dependency-free toolkit so components can add physical-feeling motion
 * (spring settles, elastic presses, content reveals) without each one
 * re-implementing the prefers-reduced-motion check. Everything degrades to a
 * still or near-instant state when the user asks for reduced motion.
 *
 * These pair with the CSS utilities in globals.css:
 *   .animate-spring-settle  .animate-soft-pulse  .skeleton-shimmer
 *   .press-elastic / .is-pressed  .animate-elastic-pop
 */
import { useEffect, useState, CSSProperties } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** True if the user prefers reduced motion. SSR-safe (returns false on server). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches
  } catch {
    return false
  }
}

/**
 * React hook tracking the user's reduced-motion preference live. Starts `false`
 * on the server / first paint to avoid hydration mismatch, then syncs on mount
 * and updates if the OS setting changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(REDUCED_MOTION_QUERY)
    const update = () => setReduced(mq.matches)
    update()
    // addEventListener is the modern API; fall back for older Safari.
    if (mq.addEventListener) {
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    }
    mq.addListener(update)
    return () => mq.removeListener(update)
  }, [])

  return reduced
}

/** The app's signature spring curve (matches GutScore's ease-out-back feel). */
export const SPRING_EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
/** A calm ease for non-springy transitions. */
export const SOFT_EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)'

interface SpringOptions {
  /** Duration in ms when motion is allowed. Default 360. */
  duration?: number
  /** Properties to transition. Default 'transform, opacity'. */
  properties?: string
  /** Use the soft ease instead of the springy one. */
  soft?: boolean
}

/**
 * Build an inline `transition` style that honours reduced motion. Pass the
 * current reduced-motion flag (from useReducedMotion) so the same component
 * re-renders correctly when the preference changes.
 *
 *   const reduced = useReducedMotion()
 *   <div style={springTransition(reduced)} />
 */
export function springTransition(reduced: boolean, opts: SpringOptions = {}): CSSProperties {
  const { duration = 360, properties = 'transform, opacity', soft = false } = opts
  if (reduced) {
    return { transition: `${properties} 0.01ms linear` }
  }
  return { transition: `${properties} ${duration}ms ${soft ? SOFT_EASE : SPRING_EASE}` }
}

/**
 * Pick the right entrance class for an element. Returns the spring-settle
 * entrance normally, and lets globals.css downgrade it to a plain fade under
 * reduced motion (so callers do not need to branch). The optional `delayMs`
 * is returned as a style for staggering.
 */
export function entrance(delayMs?: number): { className: string; style?: CSSProperties } {
  return {
    className: 'animate-spring-settle',
    style: delayMs !== undefined ? { animationDelay: `${delayMs}ms` } : undefined,
  }
}

/**
 * Choose between an animated value and a resting value based on motion
 * preference. Handy for skipping count-up / overshoot logic:
 *
 *   const target = motionValue(reduced, finalScore, animatedScore)
 */
export function motionValue<T>(reduced: boolean, restingValue: T, animatedValue: T): T {
  return reduced ? restingValue : animatedValue
}
