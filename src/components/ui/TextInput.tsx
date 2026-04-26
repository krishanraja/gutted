'use client'
import { forwardRef, useId, InputHTMLAttributes, ReactNode } from 'react'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: ReactNode
  error?: string | null
  /** Optional helper text shown below the input when there's no error. */
  hint?: ReactNode
  /** Visual container class override. */
  containerClassName?: string
}

const baseInputClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 ' +
  'transition-colors ' +
  // Keyboard focus ring replaces bare `outline-none` so keyboard users always
  // see where focus is, while mouse clicks (which don't fire :focus-visible)
  // keep the calmer look.
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:border-accent/60'

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, error, hint, containerClassName, className, ...props },
  ref,
) {
  const reactId = useId()
  const inputId = `input-${reactId}`
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  const describedBy = error ? errorId : hint ? hintId : undefined

  return (
    <div className={containerClassName}>
      <label htmlFor={inputId} className="block text-sm text-white/60 mb-1.5">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${baseInputClass} ${error ? 'border-red-400/60' : ''} ${className || ''}`}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-red-400 text-sm mt-1.5">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-white/40 text-xs mt-1.5">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
