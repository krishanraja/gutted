import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan-limits'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST: Create a practitioner share link
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('plan, name').eq('id', user.id).single()
    const limits = getPlanLimits(profile?.plan || 'free')
    if (!limits.pdfReports) return NextResponse.json({ error: 'Upgrade to Pro for practitioner sharing' }, { status: 403 })

    const { practitionerEmail, practitionerName } = await req.json()
    if (!practitionerEmail) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const accessToken = crypto.randomBytes(32).toString('hex')

    const { error } = await supabase.from('practitioner_access').insert({
      user_id: user.id,
      practitioner_email: practitionerEmail,
      practitioner_name: practitionerName || null,
      access_token: accessToken,
    })
    if (error) throw error

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://gutted.app'}/practitioner/${accessToken}`

    // Send invitation email
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'hello@gutted.app',
      to: practitionerEmail,
      subject: `${profile?.name || 'A patient'} shared their gut health data with you`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Patient Data Shared</title></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:Inter,system-ui,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://gutted.app/icon.png" alt="gutted." style="height:40px;">
    </div>
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#ffffff;font-size:24px;margin:0 0 8px 0;">${profile?.name || 'Your patient'} shared their gut health data</h1>
      <p style="color:#a3a3a3;font-size:16px;">They've given you read-only access to their gut health logs, scores, patterns, and test results via gutted.</p>
    </div>
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${shareUrl}" style="background:linear-gradient(to right, #00B4B4, #4ADE80);color:#000000;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;display:inline-block;">
        View Patient Dashboard →
      </a>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;">
      <p style="color:#525252;font-size:12px;">This is patient-reported data from a consumer health tracking app. It should be considered alongside clinical examination.</p>
    </div>
  </div>
</body>
</html>`,
    })

    return NextResponse.json({ shareUrl, accessToken })
  } catch (e: unknown) {
    console.error('Practitioner share error:', e)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

// GET: List practitioner shares
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data } = await supabase
      .from('practitioner_access')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ shares: data || [] })
  } catch (e: unknown) {
    console.error('Practitioner list error:', e)
    return NextResponse.json({ error: 'Failed to list shares' }, { status: 500 })
  }
}

// DELETE: Revoke practitioner access
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { id } = await req.json()
    await supabase.from('practitioner_access').delete().eq('id', id).eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('Practitioner revoke error:', e)
    return NextResponse.json({ error: 'Failed to revoke access' }, { status: 500 })
  }
}
