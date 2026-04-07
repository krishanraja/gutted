import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)

    if (!subscription.cancel_at_period_end) {
      return NextResponse.json({ error: 'Subscription is not scheduled for cancellation' }, { status: 400 })
    }

    const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    const periodEnd = updated.items.data[0]?.current_period_end
    await supabase.from('profiles').update({
      subscription_status: updated.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    }).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('Resume subscription error:', e)
    return NextResponse.json({ error: 'Could not resume subscription' }, { status: 500 })
  }
}
