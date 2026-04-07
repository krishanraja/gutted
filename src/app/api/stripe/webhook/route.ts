import { NextRequest, NextResponse } from 'next/server'
import { stripe, resolvePlanFromPriceId, resolvePlanFromAmount } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret && process.env.NODE_ENV === 'production') {
    console.error('STRIPE_WEBHOOK_SECRET is not set in production')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event
  try {
    event = webhookSecret
      ? stripe.webhooks.constructEvent(body, sig!, webhookSecret)
      : JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gutted.app'

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { userId, plan } = session.metadata || {}
    if (userId && plan) {
      await supabase.from('profiles').update({
        plan,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        subscription_status: 'active',
      }).eq('id', userId)

      // Fetch subscription to store period end
      if (session.subscription) {
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          const periodEnd = sub.items.data[0]?.current_period_end
          if (periodEnd) {
            await supabase.from('profiles').update({
              current_period_end: new Date(periodEnd * 1000).toISOString(),
            }).eq('id', userId)
          }
        } catch (e) {
          console.log('Failed to fetch subscription for period end:', e)
        }
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single()

      if (profile) {
        try {
          await fetch(`${siteUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.SUPABASE_SERVICE_ROLE_KEY || '' },
            body: JSON.stringify({
              type: 'upgrade',
              to: profile.email,
              data: { name: profile.name, plan: plan.charAt(0).toUpperCase() + plan.slice(1) }
            })
          })
        } catch (e) {
          console.log('Upgrade email failed:', e)
        }
      }
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object
    const priceId = sub.items?.data?.[0]?.price?.id
    const amountInCents = sub.items?.data?.[0]?.price?.unit_amount

    // Resolve plan: prefer price ID, fall back to amount matching for legacy subscriptions
    const newPlan = (priceId ? resolvePlanFromPriceId(priceId) : null)
      || (amountInCents ? resolvePlanFromAmount(amountInCents) : null)

    const subscriptionStatus = sub.cancel_at_period_end ? 'canceling' : sub.status
    const periodEnd = sub.items?.data?.[0]?.current_period_end

    const updateData: Record<string, unknown> = {
      subscription_status: subscriptionStatus,
      stripe_subscription_id: sub.id,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    }

    if (newPlan) {
      updateData.plan = newPlan
    }

    await supabase.from('profiles')
      .update(updateData)
      .eq('stripe_customer_id', sub.customer)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    await supabase.from('profiles')
      .update({
        plan: 'free',
        stripe_subscription_id: null,
        subscription_status: 'canceled',
        current_period_end: null,
      })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object
    const customerId = invoice.customer

    // Update subscription status to past_due
    await supabase.from('profiles')
      .update({ subscription_status: 'past_due' })
      .eq('stripe_customer_id', customerId)

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profile) {
      try {
        await fetch(`${siteUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.SUPABASE_SERVICE_ROLE_KEY || '' },
          body: JSON.stringify({
            type: 'payment-failed',
            to: profile.email,
            data: { name: profile.name }
          })
        })
      } catch (e) {
        console.log('Payment failed email failed:', e)
      }
    }
  }

  return NextResponse.json({ received: true })
}
