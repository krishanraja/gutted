// Revenue-only attribution emit for the Mindmaker OS warehouse.
//
// gutted. is a YMYL health app. This module is the ONLY path by which gutted
// sends events to the fleet warehouse, and it ships ONLY commercial, non-PHI
// fields. The allowlist below is deny-by-default: a caller can pass anything,
// but only whitelisted keys are serialized, so no symptom, gut score, condition,
// biomarker, email, or name can ever leave the app, even by accident.
//
// Transport: a single POST to the OS `ingest-attribution` edge function, guarded
// by the shared `x-attribution-secret`. The secret lives ONLY on the server
// (never shipped to the client). Until both env vars exist, emit is a safe no-op,
// so this ships dark and switches on with config alone, no code change.

const SCHEMA_VERSION = 'attribution.events/1'
const APP = 'gutted'
const STRIPE_ACCOUNT = 'mindmaker_llc'

export type UtmSet = {
  source?: string | null
  medium?: string | null
  campaign?: string | null
  content?: string | null
  term?: string | null
}

export type AttributionEventName =
  | 'landed'
  | 'signed_up'
  | 'activated'
  | 'purchased'
  | 'refunded'
  | 'churned'

export type AttributionEventInput = {
  event_name: AttributionEventName
  anonymous_id?: string | null
  user_id?: string | null
  utm?: UtmSet | null
  referrer?: string | null
  landing_path?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  value_cents?: number | null
  currency?: string | null
  idempotency_key?: string | null
}

function clampStr(v: unknown, max = 256): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

function serializeUtm(utm?: UtmSet | null): UtmSet {
  const out: UtmSet = {}
  if (!utm || typeof utm !== 'object') return out
  for (const k of ['source', 'medium', 'campaign', 'content', 'term'] as const) {
    const v = clampStr((utm as Record<string, unknown>)[k], 200)
    if (v) out[k] = v
  }
  return out
}

// The complete set of fields that ever leave gutted. Anything not built here is
// dropped by construction.
export function buildAttributionEvent(input: AttributionEventInput, occurredAtIso: string) {
  return {
    schema_version: SCHEMA_VERSION,
    app: APP,
    stripe_account: STRIPE_ACCOUNT,
    event_name: input.event_name,
    occurred_at: occurredAtIso,
    idempotency_key: clampStr(input.idempotency_key, 200),
    anonymous_id: clampStr(input.anonymous_id, 100),
    user_id: clampStr(input.user_id, 100), // opaque Supabase uuid only, never email/name
    utm: serializeUtm(input.utm),
    referrer: clampStr(input.referrer, 512),
    landing_path: clampStr(input.landing_path, 512),
    stripe_customer_id: clampStr(input.stripe_customer_id, 100),
    stripe_subscription_id: clampStr(input.stripe_subscription_id, 100),
    value_cents: typeof input.value_cents === 'number' ? Math.round(input.value_cents) : null,
    currency: clampStr(input.currency, 8),
  }
}

export async function emitAttributionEvent(input: AttributionEventInput): Promise<void> {
  const url = process.env.ATTRIBUTION_INGEST_URL
  const secret = process.env.ATTRIBUTION_INGEST_SECRET
  // Feature flag: dark until the OS ingest endpoint and shared secret are set.
  if (!url || !secret) return

  const payload = buildAttributionEvent(input, new Date().toISOString())

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-attribution-secret': secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) {
      console.warn(`Attribution emit ${input.event_name} returned ${res.status}`)
    }
  } catch (e) {
    // Attribution must NEVER break a purchase, signup, or page load. Swallow.
    console.warn('Attribution emit failed (non-fatal):', (e as Error)?.message)
  }
}
