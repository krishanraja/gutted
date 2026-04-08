import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailTemplates } from '@/lib/email-templates'
import { createClient } from '@/lib/supabase/server'
import { verifyCronSecret, isValidEmail, getAppUrl } from '@/lib/security'

const resend = new Resend(process.env.RESEND_API_KEY)

// Internal-only email types that should never be triggered by regular users
const INTERNAL_ONLY_TYPES = new Set(['welcome', 'upgrade', 'payment-failed'])

export async function POST(req: NextRequest) {
  try {
    const internalSecret = req.headers.get('x-internal-secret')
    const isInternalCall = verifyCronSecret(internalSecret)

    // If not an internal call, require user auth
    let authenticatedEmail: string | undefined
    if (!isInternalCall) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      authenticatedEmail = user.email ?? undefined
    }

    const { type, to, data } = await req.json()

    // Validate recipient email
    if (!to || !isValidEmail(to)) {
      return NextResponse.json({ error: 'Invalid recipient email' }, { status: 400 })
    }

    // Non-internal callers can only send emails to themselves, and cannot use internal-only types
    if (!isInternalCall) {
      if (INTERNAL_ONLY_TYPES.has(type)) {
        return NextResponse.json({ error: 'Unauthorized email type' }, { status: 403 })
      }
      if (to !== authenticatedEmail) {
        return NextResponse.json({ error: 'Can only send emails to your own address' }, { status: 403 })
      }
    }

    const appUrl = getAppUrl()
    let emailData
    switch (type) {
      case 'welcome':
        emailData = emailTemplates.welcome(data.name)
        break
      case 'weekly-meal-plan':
        emailData = emailTemplates.weeklyMealPlan(data.name, data.mealPlanUrl)
        break
      case 'password-reset': {
        // Validate resetUrl is on our domain
        const resetUrl = String(data.resetUrl || '')
        if (!resetUrl.startsWith(appUrl)) {
          return NextResponse.json({ error: 'Invalid reset URL' }, { status: 400 })
        }
        emailData = emailTemplates.passwordReset(resetUrl)
        break
      }
      case 'upgrade':
        emailData = emailTemplates.upgrade(data.name, data.plan)
        break
      case 'payment-failed':
        emailData = emailTemplates['payment-failed'](data.name)
        break
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    const { data: result, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@gutted.app',
      to,
      subject: emailData.subject,
      html: emailData.html,
    })

    if (error) throw error
    return NextResponse.json({ id: result?.id })

  } catch (e: unknown) {
    console.error('Send email error:', e)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
