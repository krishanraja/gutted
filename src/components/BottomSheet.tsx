'use client'
import { ReactNode, useEffect, useRef, useCallback, TouchEvent, useState } from 'react'
import { haptic } from '@/lib/haptics'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (open) {
      haptic.medium()
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleClose = useCallback(() => {
    haptic.tap()
    onClose()
  }, [onClose])

  const onTouchStart = useCallback((e: TouchEvent) => {
    dragStart.current = e.touches[0].clientY
    setIsDragging(true)
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return
    const diff = e.touches[0].clientY - dragStart.current
    if (diff > 0) setDragY(diff) // Only allow dragging down
  }, [isDragging])

  const onTouchEnd = useCallback(() => {
    if (dragY > 100) {
      handleClose()
    }
    setDragY(0)
    setIsDragging(false)
  }, [dragY, handleClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`relative w-full max-h-[80vh] bg-[#111] border-t border-white/10 rounded-t-2xl animate-fade-up overflow-hidden ${isDragging ? '' : 'transition-transform duration-300'}`}
        style={{ transform: `translateY(${dragY}px)` }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-8 h-1 rounded-full bg-white/20" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-6 pb-3">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-8 overflow-y-auto max-h-[calc(80vh-60px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
