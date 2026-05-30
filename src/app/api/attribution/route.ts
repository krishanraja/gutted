import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emitAttributionEvent } from '@/lib/attribution'
import { rateLimit } from '@/lib/security'

// Front door for FRONTEND lifecycle events (landed, signed_up, activated). The
// client posts here so the ingest secret stays server-side and the authenticated
// user_id (an opaque Supabase uuid) is attached server-side, never trusted from
// the client. Purchase/refund/churn events fire from the signature-verified
// Stripe webhook instead. By policy this accepts commercial fields only.
const FRONTEND_EVENTS = new Set(['landed', 'signed_up', 'activated'])

export async function POST(req: NextRequest) {
  try {
    const input = await req.json().catch(() => null)
    if (!input || !FRONTEND_EVENTS.has(input.event_name)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const { allowed } = rateLimit(`attrib:${input.anonymous_id || 'anon'}`, {
      maxRequests: 20,
      windowMs: 60_000,
    })
    if (!allowed) return NextResponse.json({ ok: false }, { status: 429 })

    // Attach the authenticated user_id server-side when a session exists.
    let userId: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      // anonymous (pre-signup) is expected for `landed`
    }

    await emitAttributionEvent({
      event_name: input.event_name,
      anonymous_id: typeof input.anonymous_id === 'string' ? input.anonymous_id : null,
      user_id: userId,
      utm: input.utm && typeof input.utm === 'object' ? input.utm : null,
      referrer: typeof input.referrer === 'string' ? input.referrer : null,
      landing_path: typeof input.landing_path === 'string' ? input.landing_path : null,
      idempotency_key: typeof input.idempotency_key === 'string' ? input.idempotency_key : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Never block the client on attribution.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
