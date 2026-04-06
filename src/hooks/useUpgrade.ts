'use client'
import { useState } from 'react'
import { useToast } from '@/components/ToastProvider'

export function useUpgrade() {
  const [upgrading, setUpgrading] = useState(false)
  const { toast } = useToast()

  const upgrade = async (plan: string) => {
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast('Unable to start checkout. Please try again.', 'error')
        setUpgrading(false)
      }
    } catch {
      toast('Unable to start checkout. Please try again.', 'error')
      setUpgrading(false)
    }
  }

  return { upgrade, upgrading }
}
