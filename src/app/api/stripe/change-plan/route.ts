import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS, resolvePlanFromPriceId } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const planConfig = PLANS[plan as keyof typeof PLANS]
    if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id, plan')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription. Please use checkout to subscribe.' },
        { status: 400 }
      )
    }

    if (profile.plan === plan) {
      return NextResponse.json({ error: 'You are already on this plan' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) {
      return NextResponse.json({ error: 'Subscription has no items' }, { status: 500 })
    }

    // Determine if this is an upgrade or downgrade for proration
    const currentPriceId = subscription.items.data[0]?.price?.id
    const currentPlan = currentPriceId ? resolvePlanFromPriceId(currentPriceId) : profile.plan
    const currentPrice = currentPlan && currentPlan in PLANS
      ? PLANS[currentPlan as keyof typeof PLANS].price
      : 0
    const isUpgrade = planConfig.price > currentPrice

    const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [{ id: itemId, price: planConfig.priceId }],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
      payment_behavior: isUpgrade ? 'error_if_incomplete' : 'default_incomplete',
    })

    // Update profile immediately
    const periodEnd = updated.items.data[0]?.current_period_end
    await supabase.from('profiles').update({
      plan,
      subscription_status: updated.cancel_at_period_end ? 'canceling' : updated.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    }).eq('id', user.id)

    return NextResponse.json({ success: true, plan })
  } catch (e: unknown) {
    console.error('Change plan error:', e)
    // Return generic error — don't leak Stripe internals
    return NextResponse.json({ error: 'Could not change plan' }, { status: 500 })
  }
}
