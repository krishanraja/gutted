import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const uid = sub.metadata?.supabase_uid
    if (uid) {
      const plan = sub.status === 'active' ? (sub.items.data[0]?.price.unit_amount === 1900 ? 'pro' : 'core') : 'free'
      await supabase.from('profiles').update({ plan, stripe_subscription_id: sub.id }).eq('id', uid)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const uid = sub.metadata?.supabase_uid
    if (uid) await supabase.from('profiles').update({ plan: 'free', stripe_subscription_id: null }).eq('id', uid)
  }

  return NextResponse.json({ received: true })
}
