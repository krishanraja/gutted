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
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    const periodEnd = subscription.items.data[0]?.current_period_end

    await supabase.from('profiles').update({
      subscription_status: 'canceling',
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    }).eq('id', user.id)

    return NextResponse.json({
      success: true,
      cancelAt: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
  } catch (e: unknown) {
    console.error('Cancel subscription error:', e)
    return NextResponse.json({ error: 'Could not cancel subscription' }, { status: 500 })
  }
}
