import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailTemplates } from '@/lib/email-templates'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

// Called by monthly cron job to send progress reports to Pro users
export async function POST(req: NextRequest) {
  try {
    const internalSecret = req.headers.get('x-internal-secret')
    if (internalSecret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, plan, gut_profile')
      .eq('plan', 'pro')

    if (!profiles?.length) return NextResponse.json({ sent: 0 })

    let sent = 0
    for (const profile of profiles) {
      // Current month logs
      const { data: currentLogs } = await supabase
        .from('logs')
        .select('content, gut_score, logged_at')
        .eq('user_id', profile.id)
        .gte('logged_at', thirtyDaysAgo.toISOString())
        .order('logged_at', { ascending: false })

      // Previous month logs for comparison
      const { data: prevLogs } = await supabase
        .from('logs')
        .select('gut_score')
        .eq('user_id', profile.id)
        .gte('logged_at', sixtyDaysAgo.toISOString())
        .lt('logged_at', thirtyDaysAgo.toISOString())

      const current = currentLogs || []
      const currentScores = current.filter(l => l.gut_score > 0).map(l => l.gut_score)
      const currentAvg = currentScores.length ? Math.round((currentScores.reduce((a, b) => a + b, 0) / currentScores.length) * 10) / 10 : 0

      const prev = prevLogs || []
      const prevScores = prev.filter(l => l.gut_score > 0).map(l => l.gut_score)
      const prevAvg = prevScores.length ? Math.round((prevScores.reduce((a, b) => a + b, 0) / prevScores.length) * 10) / 10 : 0

      // Get AI summary
      let highlights = ''
      if (current.length >= 3) {
        const msg = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 512,
          messages: [{
            role: 'user',
            content: `Write 3 short bullet-point highlights for a monthly gut health report. Be specific and encouraging.
Avg score this month: ${currentAvg}/10 (vs ${prevAvg}/10 last month)
Total logs: ${current.length}
Recent entries: ${JSON.stringify(current.slice(0, 8).map(l => ({ content: l.content.slice(0, 80), score: l.gut_score })))}
Return only the 3 bullet points as plain text, one per line.`,
          }],
        })
        highlights = msg.content[0].type === 'text' ? msg.content[0].text : ''
      }

      const emailData = emailTemplates.monthlyReport(
        profile.name || 'there',
        currentAvg,
        prevAvg,
        current.length,
        highlights
      )

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
    console.error('Monthly report error:', e)
    return NextResponse.json({ error: 'Failed to send reports' }, { status: 500 })
  }
}
