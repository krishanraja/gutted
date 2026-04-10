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

      if (!res.ok) {
        console.error('Checkout failed:', res.status, data)
        toast(data.error || `Checkout failed (${res.status})`, 'error')
        setUpgrading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout response missing URL:', data)
        toast('Checkout session created but no redirect URL returned.', 'error')
        setUpgrading(false)
      }
    } catch (err) {
      console.error('Checkout network error:', err)
      toast('Unable to connect. Please check your internet and try again.', 'error')
      setUpgrading(false)
    }
  }

  return { upgrade, upgrading }
}
