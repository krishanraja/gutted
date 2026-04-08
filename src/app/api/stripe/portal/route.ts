import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/security'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Fallback: if no customer ID but we have a subscription ID, look it up
    if (!customerId && profile?.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
        customerId = sub.customer as string
        // Backfill the missing customer ID
        if (customerId) {
          await supabase.from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', user.id)
        }
      } catch {
        // Subscription lookup failed
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No billing account found. If you recently subscribed, please try again in a moment.' },
        { status: 400 }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    console.error('Stripe portal error:', e)
    return NextResponse.json({ error: 'Could not open billing portal' }, { status: 500 })
  }
}
