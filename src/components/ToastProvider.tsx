'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { haptic } from '@/lib/haptics'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    // Fire haptic per toast type
    if (type === 'success') haptic.success()
    else if (type === 'error') haptic.error()
    else haptic.tap()
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const colors: Record<ToastType, string> = {
    success: 'from-[#4ADE80]/20 to-[#4ADE80]/5 border-[#4ADE80]/30 text-[#4ADE80]',
    error: 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400',
    info: 'from-[#00B4B4]/20 to-[#00B4B4]/5 border-[#00B4B4]/30 text-[#00B4B4]',
  }

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90vw] max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`bg-gradient-to-r border rounded-xl px-4 py-3 text-sm font-medium backdrop-blur-lg animate-slide-in pointer-events-auto ${colors[t.type]}`}
          >
            <span className="mr-2">{icons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
