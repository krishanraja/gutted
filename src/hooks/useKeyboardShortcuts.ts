'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const shortcuts: Record<string, string> = {
  d: '/dashboard',
  n: '/dashboard/log',
  u: '/dashboard/upload',
  m: '/dashboard/meal-plan',
  h: '/dashboard/history',
  s: '/dashboard/settings',
}

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const route = shortcuts[e.key.toLowerCase()]
      if (route) {
        e.preventDefault()
        router.push(route)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])
}
