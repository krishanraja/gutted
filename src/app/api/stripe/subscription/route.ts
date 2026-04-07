import { NextResponse } from 'next/server'
import { stripe, resolvePlanFromPriceId } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, stripe_subscription_id, stripe_customer_id, subscription_status, current_period_end')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({
        status: null,
        plan: profile?.plan || 'free',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        paymentMethod: null,
      })
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id, {
      expand: ['default_payment_method'],
    })

    const pm = subscription.default_payment_method as Stripe.PaymentMethod | null
    const card = pm?.card

    const subscriptionItem = subscription.items.data[0]
    const priceId = subscriptionItem?.price?.id
    const plan = (priceId ? resolvePlanFromPriceId(priceId) : null) || profile.plan || 'free'

    const subscriptionStatus = subscription.cancel_at_period_end
      ? 'canceling'
      : subscription.status

    const periodEnd = subscriptionItem?.current_period_end

    return NextResponse.json({
      status: subscriptionStatus,
      plan,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod: card ? { brand: card.brand, last4: card.last4 } : null,
    })
  } catch (e: unknown) {
    console.error('Subscription status error:', e)
    return NextResponse.json({ error: 'Could not fetch subscription status' }, { status: 500 })
  }
}
