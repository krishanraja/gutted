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
  const base = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' }
  const variants = {
    gradient: 'bg-gradient-to-r from-[#00B4B4] to-[#4ADE80] text-black hover:opacity-90 active:scale-95',
    outline: 'border border-white/20 text-white hover:bg-white/10 active:scale-95',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5 active:scale-95',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 active:scale-95',
  }
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'gradient') haptic.light()
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
