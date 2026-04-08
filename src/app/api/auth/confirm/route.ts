import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Email confirmation is handled by Supabase's built-in flow.
// This endpoint only allows authenticated users to re-request confirmation.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Users can only confirm their own email via Supabase's resend flow
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    })

    if (error) return NextResponse.json({ error: 'Could not resend confirmation' }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Confirmation email resent' })
  } catch {
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 })
  }
}
