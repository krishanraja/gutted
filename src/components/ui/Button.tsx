'use client'
import { ReactNode, ButtonHTMLAttributes } from 'react'
import { haptic } from '@/lib/haptics'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gradient' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'gradient', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-5 py-2.5 text-sm', lg: 'px-6 py-3 text-base' }
  const variants = {
    gradient: 'bg-gradient-to-r from-accent to-positive text-black hover:opacity-90 active:scale-[0.98]',
    outline: 'border border-white/15 text-white hover:bg-white/5 active:scale-[0.98]',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5 active:scale-[0.98]',
    danger: 'bg-red-500/10 text-[#E96363] border border-red-500/25 hover:bg-red-500/15 active:scale-[0.98]',
  }
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    haptic.light()
    props.onClick?.(e)
  }

  return (
    <button {...props} onClick={handleClick} disabled={disabled || loading} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
}
