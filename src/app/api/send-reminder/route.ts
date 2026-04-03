import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailTemplates } from '@/lib/email-templates'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

// Called by a cron job (e.g., Vercel Cron) to send daily reminders
export async function POST(req: NextRequest) {
  try {
    // Verify internal secret for cron calls
    const internalSecret = req.headers.get('x-internal-secret')
    if (internalSecret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all users who have reminders enabled and haven't logged today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, gut_profile, plan')
      .neq('plan', 'free')

    if (!profiles?.length) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const profile of profiles) {
      // Check if reminders are enabled
      const gutProfile = (profile.gut_profile || {}) as Record<string, unknown>
      if (!gutProfile.remindersEnabled) continue

      // Check if they already logged today
      const { count } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .gte('logged_at', todayStart.toISOString())

      if ((count || 0) > 0) continue

      // Send reminder
      const emailData = emailTemplates.dailyReminder(profile.name || 'there')
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'hello@gutted.app',
        to: profile.email,
        subject: emailData.subject,
        html: emailData.html,
      })
      sent++
    }

    return NextResponse.json({ sent })
  } catch (e: unknown) {
    console.error('Send reminder error:', e)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}
