'use client'
import { ReactNode } from 'react'
import { useSwipeableCards } from '@/hooks/useSwipeableCards'

interface CardCarouselProps {
  children: ReactNode[]
  className?: string
  onIndexChange?: (index: number) => void
}

export function CardCarousel({ children, className = '', onIndexChange }: CardCarouselProps) {
  const total = children.length
  const { activeIndex, setActiveIndex, offsetX, isDragging, handlers } = useSwipeableCards({
    total,
    onSnap: onIndexChange,
  })

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Card container */}
      <div
        className="relative flex-1 overflow-hidden"
        {...handlers}
      >
        {children.map((child, i) => {
          const isActive = i === activeIndex
          const isPrev = i < activeIndex
          let transform = isPrev ? 'translateX(-100%)' : i > activeIndex ? 'translateX(100%)' : 'translateX(0)'

          // Live drag feedback for active card
          if (isActive && isDragging) {
            transform = `translateX(${offsetX}px)`
          }
          // Show adjacent card peeking during drag
          if (isDragging && i === activeIndex + 1 && offsetX < 0) {
            transform = `translateX(calc(100% + ${offsetX}px))`
          }
          if (isDragging && i === activeIndex - 1 && offsetX > 0) {
            transform = `translateX(calc(-100% + ${offsetX}px))`
          }

          return (
            <div
              key={i}
              className={`absolute inset-0 transition-all ${isDragging ? 'duration-0' : 'duration-300 ease-out'}`}
              style={{
                transform,
                opacity: isActive || (isDragging && Math.abs(i - activeIndex) === 1) ? 1 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
              }}
            >
              {child}
            </div>
          )
        })}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-3">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex
                  ? 'w-4 h-1.5 bg-gradient-to-r from-[#00B4B4] to-[#4ADE80]'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
