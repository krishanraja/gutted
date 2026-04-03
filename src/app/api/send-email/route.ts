import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { emailTemplates } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { type, to, data } = await req.json()
    
    let emailData
    switch (type) {
      case 'welcome':
        emailData = emailTemplates.welcome(data.name)
        break
      case 'weekly-meal-plan':
        emailData = emailTemplates.weeklyMealPlan(data.name, data.mealPlanUrl)
        break
      case 'password-reset':
        emailData = emailTemplates.passwordReset(data.resetUrl)
        break
      case 'upgrade':
        emailData = emailTemplates.upgrade(data.name, data.plan)
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