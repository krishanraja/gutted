'use client'
/**
 * Content-shaped loading skeletons.
 *
 * Instead of a bare spinner, these render the SHAPE of the content that is
 * about to arrive (a card, a list row, a score ring, a stat tile) using the
 * accent-tinted `.skeleton-shimmer` sweep from globals.css. When real content
 * loads, the layout barely shifts, so the screen feels like it is settling into
 * focus rather than popping in.
 *
 * All pieces are self-contained and reduced-motion-aware (the shimmer sweep is
 * disabled under prefers-reduced-motion via globals.css; a calm static block
 * remains). Nothing here imports app data or framework APIs, so any component
 * can adopt these freely.
 */
import { CSSProperties } from 'react'

interface ShimmerBlockProps {
  className?: string
  /** Optional inline style (e.g. exact width/height) for fine layout matching. */
  style?: CSSProperties
  /** Round to a pill/circle. Defaults to the app's rounded-xl card radius. */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Stagger entrance index (0-4) so groups of blocks settle in sequence. */
  delayIndex?: number
}

const ROUND: Record<NonNullable<ShimmerBlockProps['rounded']>, string> = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
}

/**
 * The atomic building block: a single shimmering surface. Compose these to
 * mirror any layout. Width/height come from className (Tailwind) or style.
 */
export function ShimmerBlock({ className = '', style, rounded = 'lg', delayIndex }: ShimmerBlockProps) {
  const delayStyle: CSSProperties | undefined =
    delayIndex !== undefined ? { animationDelay: `${60 * delayIndex}ms` } : undefined
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer animate-soft-pulse ${ROUND[rounded]} ${className}`}
      style={{ ...delayStyle, ...style }}
    />
  )
}

/**
 * A card-shaped skeleton matching the app's bg-white/[0.04] border rounded-xl
 * card. Renders a title line, two body lines, and an optional trailing accent
 * chip, so a loading card occupies the same footprint as the real one.
 */
export function CardSkeleton({ className = '', lines = 2 }: { className?: string; lines?: number }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 animate-spring-settle ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <ShimmerBlock className="h-4 w-2/5" rounded="sm" />
        <ShimmerBlock className="h-4 w-10" rounded="full" />
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
          <ShimmerBlock
            key={i}
            className={`h-3 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
            rounded="sm"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * A list-row skeleton: leading icon/avatar shape, a title line and a subtitle
 * line, and a trailing value. Stack several for a feed or history list.
 */
export function ListItemSkeleton({ className = '', delayIndex }: { className?: string; delayIndex?: number }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 animate-spring-settle ${className}`}
      style={delayIndex !== undefined ? { animationDelay: `${60 * delayIndex}ms` } : undefined}
    >
      <ShimmerBlock className="h-10 w-10 shrink-0" rounded="full" />
      <div className="flex-1 space-y-2">
        <ShimmerBlock className="h-3.5 w-1/2" rounded="sm" />
        <ShimmerBlock className="h-3 w-3/4" rounded="sm" />
      </div>
      <ShimmerBlock className="h-6 w-10 shrink-0" rounded="md" />
    </div>
  )
}

/**
 * A list of `count` row skeletons with a soft sequential settle, so the list
 * appears to cascade into place. Defaults to 4 rows.
 */
export function ListSkeleton({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div aria-hidden="true" aria-busy="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} delayIndex={Math.min(i, 4)} />
      ))}
    </div>
  )
}

/**
 * A score-ring skeleton matching GutScore's circular footprint. Renders a faint
 * ring plus a centered value placeholder, so the score area holds its space
 * while the real ring animates in.
 */
export function ScoreSkeleton({ size = 'lg', className = '' }: { size?: 'sm' | 'lg'; className?: string }) {
  const dim = size === 'lg' ? 132 : 60
  return (
    <div
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center animate-spring-settle ${className}`}
      style={{ width: dim, height: dim }}
    >
      <div
        className="absolute inset-0 rounded-full animate-soft-pulse"
        style={{ border: `${size === 'lg' ? 4 : 3}px solid rgba(255,255,255,0.06)` }}
      />
      <ShimmerBlock
        className={size === 'lg' ? 'h-12 w-14' : 'h-5 w-7'}
        rounded="md"
      />
    </div>
  )
}

/**
 * A stat-tile grid skeleton (e.g. the three small metric tiles on the
 * dashboard). Mirrors a `grid-cols-3` block of square-ish tiles.
 */
export function StatGridSkeleton({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`grid grid-cols-3 gap-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 h-20 flex flex-col justify-between animate-spring-settle"
          style={{ animationDelay: `${60 * Math.min(i, 4)}ms` }}
        >
          <ShimmerBlock className="h-3 w-2/3" rounded="sm" />
          <ShimmerBlock className="h-5 w-1/2" rounded="sm" />
        </div>
      ))}
    </div>
  )
}
