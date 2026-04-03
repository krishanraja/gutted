import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailTemplates } from '@/lib/email-templates'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

// Called by a weekly cron job to send digest emails
export async function POST(req: NextRequest) {
  try {
    const internalSecret = req.headers.get('x-internal-secret')
    if (internalSecret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, plan')
      .neq('plan', 'free')

    if (!profiles?.length) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const profile of profiles) {
      const { data: logs } = await supabase
        .from('logs')
        .select('gut_score, logged_at')
        .eq('user_id', profile.id)
        .gte('logged_at', sevenDaysAgo.toISOString())
        .order('logged_at', { ascending: false })

      const scores = (logs || []).filter(l => l.gut_score > 0).map(l => l.gut_score)
      const avgScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
      const logCount = (logs || []).length

      // Get previous week for comparison
      const fourteenDaysAgo = new Date()
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      const { data: prevLogs } = await supabase
        .from('logs')
        .select('gut_score')
        .eq('user_id', profile.id)
        .gte('logged_at', fourteenDaysAgo.toISOString())
        .lt('logged_at', sevenDaysAgo.toISOString())

      const prevScores = (prevLogs || []).filter(l => l.gut_score > 0).map(l => l.gut_score)
      const prevAvg = prevScores.length ? Math.round((prevScores.reduce((a, b) => a + b, 0) / prevScores.length) * 10) / 10 : 0

      const trend = prevAvg > 0 ? (avgScore > prevAvg ? 'up' : avgScore < prevAvg ? 'down' : 'stable') : 'new'
      const change = prevAvg > 0 ? Math.abs(Math.round((avgScore - prevAvg) * 10) / 10) : 0

      const emailData = emailTemplates.weeklyDigest(profile.name || 'there', avgScore, logCount, trend, change)
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
    console.error('Weekly digest error:', e)
    return NextResponse.json({ error: 'Failed to send digests' }, { status: 500 })
  }
}
