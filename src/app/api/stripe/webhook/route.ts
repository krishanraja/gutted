import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

function resolvePlanFromAmount(amountInCents: number): string | null {
  for (const [key, config] of Object.entries(PLANS)) {
    if (config.price * 100 === amountInCents) return key
  }
  return null
}

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
      }).eq('id', userId)

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
    const amountInCents = sub.items?.data?.[0]?.price?.unit_amount
    const newPlan = resolvePlanFromAmount(amountInCents)

    if (newPlan) {
      await supabase.from('profiles')
        .update({ plan: newPlan, stripe_subscription_id: sub.id })
        .eq('stripe_customer_id', sub.customer)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    await supabase.from('profiles')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object
    const customerId = invoice.customer

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
