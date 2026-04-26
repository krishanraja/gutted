'use client'
import { ReactNode, useEffect, useId, useRef, useCallback, TouchEvent, useState } from 'react'
import { haptic } from '@/lib/haptics'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}

export function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const dragStart = useRef(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (open) {
      haptic.medium()
      document.body.style.overflow = 'hidden'
      // Remember whoever was focused so we can restore on close.
      previouslyFocused.current = document.activeElement as HTMLElement | null
      // Focus the sheet itself so keyboard users start inside it.
      sheetRef.current?.focus()
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleClose = useCallback(() => {
    haptic.tap()
    onClose()
    // Return focus to whatever opened the sheet. Guarded because the element
    // may have unmounted between open and close.
    const target = previouslyFocused.current
    if (target && typeof target.focus === 'function' && document.contains(target)) {
      target.focus()
    }
  }, [onClose])

  // Esc-to-close. Attached at window scope so it fires even if focus has left
  // the sheet (e.g. a screen reader virtual cursor outside the element).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, handleClose])

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
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`relative w-full max-h-[80vh] bg-[#0d0d0d] border-t border-white/[0.08] rounded-t-2xl animate-fade-up overflow-hidden focus:outline-none ${isDragging ? '' : 'transition-transform duration-300'}`}
        style={{ transform: `translateY(${dragY}px)` }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-8 h-1 rounded-full bg-white/15" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-5 md:px-6 pb-3">
            <h3 id={titleId} className="text-base font-medium tracking-tight">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div className="px-5 md:px-6 pb-8 overflow-y-auto max-h-[calc(80vh-60px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
