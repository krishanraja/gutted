'use client'
import { useEffect } from 'react'
import { captureFirstTouch } from '@/lib/attribution-client'

const LANDED_FLAG = 'gutted_landed'

function hasLandedFlag(): boolean {
  return document.cookie.includes(`${LANDED_FLAG}=1`)
}

function setLandedFlag() {
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString()
  document.cookie = `${LANDED_FLAG}=1; expires=${expires}; path=/; SameSite=Lax`
}

// Mounted app-wide. Captures first-touch UTM/referrer into a first-party cookie
// and fires a single `landed` event per anonymous id. No-ops on every subsequent
// page (internal navigation, authed pages), so it is safe in the root layout.
export function AttributionCapture() {
  useEffect(() => {
    try {
      const attrib = captureFirstTouch()
      if (hasLandedFlag()) return
      setLandedFlag()
      fetch('/api/attribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'landed',
          anonymous_id: attrib.anonymous_id,
          utm: attrib.utm,
          referrer: attrib.referrer,
          landing_path: attrib.landing_path,
          idempotency_key: `landed:${attrib.anonymous_id}`,
        }),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // capture is best-effort; never disturb the page
    }
  }, [])

  return null
}
