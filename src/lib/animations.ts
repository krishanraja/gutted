import { CSSProperties } from 'react'

/** Returns inline style for staggered animation delay (80ms base, matching wellwell) */
export const staggerDelay = (index: number, base = 80): CSSProperties => ({
  animationDelay: `${index * base}ms`,
})
