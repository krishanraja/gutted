'use client'
import { useState } from 'react'

export function useUpgrade() {
  const [upgrading, setUpgrading] = useState(false)

  const upgrade = async (plan: string) => {
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
      else setUpgrading(false)
    } catch {
      setUpgrading(false)
    }
  }

  return { upgrade, upgrading }
}
