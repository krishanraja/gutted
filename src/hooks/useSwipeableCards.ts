'use client'
import { useState, useRef, useCallback, TouchEvent } from 'react'
import { haptic } from '@/lib/haptics'

interface UseSwipeableCardsOptions {
  total: number
  loop?: boolean
  threshold?: number
  onSnap?: (index: number) => void
}

export function useSwipeableCards({ total, loop = false, threshold = 60, onSnap }: UseSwipeableCardsOptions) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const touchStart = useRef(0)
  const touchTime = useRef(0)

  const goTo = useCallback((index: number) => {
    let next = index
    if (loop) {
      next = ((index % total) + total) % total
    } else {
      next = Math.max(0, Math.min(total - 1, index))
    }
    if (next !== activeIndex) {
      setDirection(next > activeIndex ? 'left' : 'right')
      setActiveIndex(next)
      haptic.swipe()
      onSnap?.(next)
    }
    setOffsetX(0)
    setIsDragging(false)
  }, [activeIndex, total, loop, onSnap])

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStart.current = e.touches[0].clientX
    touchTime.current = Date.now()
    setIsDragging(true)
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return
    const diff = e.touches[0].clientX - touchStart.current
    setOffsetX(diff)
    // Haptic tick when crossing threshold
    if (Math.abs(diff) >= threshold && Math.abs(diff) < threshold + 10) {
      haptic.tap()
    }
  }, [isDragging, threshold])

  const onTouchEnd = useCallback(() => {
    if (!isDragging) return
    const velocity = Math.abs(offsetX) / (Date.now() - touchTime.current)
    // Snap if past threshold or fast enough swipe
    if (Math.abs(offsetX) > threshold || velocity > 0.5) {
      if (offsetX < 0) {
        goTo(activeIndex + 1)
      } else {
        goTo(activeIndex - 1)
      }
    } else {
      setOffsetX(0)
      setIsDragging(false)
    }
  }, [isDragging, offsetX, threshold, activeIndex, goTo])

  return {
    activeIndex,
    setActiveIndex: goTo,
    offsetX: isDragging ? offsetX : 0,
    isDragging,
    direction,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  }
}
