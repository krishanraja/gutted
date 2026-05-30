import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    if (!planConfig.priceId) {
      console.error(`Missing Stripe price ID for plan: ${plan}`)
      return NextResponse.json({ error: `Plan "${plan}" is not configured. Please contact support.` }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, attribution')
      .eq('id', user.id)
      .single()

    const customerParams: Record<string, unknown> = profile?.stripe_customer_id
      ? { customer: profile.stripe_customer_id }
      : { customer_email: user.email }

    // Use hardcoded app URL instead of attacker-controlled Origin header
    const appUrl = getAppUrl()

    // Flatten first-touch attribution onto the checkout so it lands on BOTH the
    // session and the subscription object (revenue_by_campaign keys on the
    // subscription). Commercial fields only: utm set + anonymous id.
    const attribution = (profile?.attribution ?? {}) as {
      utm?: Record<string, string | undefined>
      anonymous_id?: string
    }
    const attribMeta: Record<string, string> = {}
    for (const k of ['source', 'medium', 'campaign', 'content', 'term'] as const) {
      const v = attribution.utm?.[k]
      if (v) attribMeta[`utm_${k}`] = String(v).slice(0, 400)
    }
    if (attribution.anonymous_id) attribMeta.anonymous_id = String(attribution.anonymous_id).slice(0, 100)

    const metadata = { userId: user.id, plan, ...attribMeta }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...customerParams,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      metadata,
      subscription_data: { metadata },
      success_url: `${appUrl}/dashboard?upgraded=1`,
      cancel_url: `${appUrl}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    // Full error stays server-side. Client gets a generic message so Stripe
    // SDK internals (missing price IDs, bad config) don't leak.
    console.error('Checkout error:', e)
    return NextResponse.json({ error: 'Checkout failed. Please try again.' }, { status: 500 })
  }
}
