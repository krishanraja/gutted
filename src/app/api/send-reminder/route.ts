import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailTemplates } from '@/lib/email-templates'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyCronSecret } from '@/lib/security'

const resend = new Resend(process.env.RESEND_API_KEY)

// Called by a cron job (e.g., Vercel Cron) to send daily reminders
export async function POST(req: NextRequest) {
  try {
    if (!verifyCronSecret(req.headers.get('x-internal-secret'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Use UTC for consistent timezone handling across deployments
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, gut_profile, plan')
      .neq('plan', 'free')

    if (!profiles?.length) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const profile of profiles) {
      try {
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
      } catch (e) {
        console.error(`Reminder failed for user ${profile.id}:`, e)
      }
    }

    return NextResponse.json({ sent })
  } catch (e: unknown) {
    console.error('Send reminder error:', e)
    return NextResponse.json({ error: 'Failed to send reminders' }, { status: 500 })
  }
}
