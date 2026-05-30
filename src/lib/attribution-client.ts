// Client-side, first-party attribution capture. Runs in the browser only
// (imported by client components). Stores a first-touch UTM record and a stable
// anonymous id in first-party cookies so the journey can be stitched
// landing -> signup -> Stripe -> warehouse. Captures commercial fields only.

export const ATTRIB_COOKIE = 'gutted_attrib'
export const ANON_COOKIE = 'gutted_aid'

export type StoredAttribution = {
  utm: { source?: string; medium?: string; campaign?: string; content?: string; term?: string }
  referrer: string | null
  landing_path: string | null
  anonymous_id: string
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

export function ensureAnonymousId(): string {
  let aid = getCookie(ANON_COOKIE)
  if (!aid) {
    aid = crypto.randomUUID()
    setCookie(ANON_COOKIE, aid, 365)
  }
  return aid
}

function parseStored(raw: string | null): Omit<StoredAttribution, 'anonymous_id'> | null {
  if (!raw) return null
  try {
    const r = JSON.parse(raw)
    return { utm: r.utm || {}, referrer: r.referrer ?? null, landing_path: r.landing_path ?? null }
  } catch {
    return null
  }
}

// Capture first-touch on the landing page. Only writes the cookie if absent
// (first-touch wins) and only if there is a real source (utm or referrer).
export function captureFirstTouch(): StoredAttribution {
  const aid = ensureAnonymousId()
  const existing = parseStored(getCookie(ATTRIB_COOKIE))
  if (existing) return { ...existing, anonymous_id: aid }

  const params = new URLSearchParams(window.location.search)
  const utm = {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    content: params.get('utm_content') || undefined,
    term: params.get('utm_term') || undefined,
  }
  const referrer = document.referrer || null
  const landing_path = window.location.pathname + window.location.search

  if (Object.values(utm).some(Boolean) || referrer) {
    setCookie(ATTRIB_COOKIE, JSON.stringify({ utm, referrer, landing_path }), 90)
  }
  return { utm, referrer, landing_path, anonymous_id: aid }
}

export function readStoredAttribution(): StoredAttribution {
  const aid = ensureAnonymousId()
  const existing = parseStored(getCookie(ATTRIB_COOKIE))
  if (existing) return { ...existing, anonymous_id: aid }
  return { utm: {}, referrer: null, landing_path: null, anonymous_id: aid }
}
