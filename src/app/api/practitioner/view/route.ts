import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Practitioner views patient data via token (no auth required)
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 })

    const supabase = await createClient()

    // Look up access record
    const { data: access } = await supabase
      .from('practitioner_access')
      .select('*')
      .eq('access_token', token)
      .eq('is_active', true)
      .single()

    if (!access) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })

    // Update last accessed
    await supabase.from('practitioner_access').update({ last_accessed_at: new Date().toISOString() }).eq('id', access.id)

    const userId = access.user_id
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Fetch patient data
    const [{ data: profile }, { data: logs }, { data: documents }] = await Promise.all([
      supabase.from('profiles').select('name, gut_profile, created_at').eq('id', userId).single(),
      supabase.from('logs').select('content, gut_score, logged_at, ai_analysis').eq('user_id', userId).gte('logged_at', thirtyDaysAgo.toISOString()).order('logged_at', { ascending: false }),
      supabase.from('documents').select('type, ai_interpretation, biomarkers, recommendations, uploaded_at').eq('user_id', userId).order('uploaded_at', { ascending: false }).limit(5),
    ])

    const allLogs = logs || []
    const scores = allLogs.filter(l => l.gut_score > 0).map(l => l.gut_score)
    const avgScore = scores.length ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0

    return NextResponse.json({
      patient: {
        name: profile?.name,
        gutProfile: profile?.gut_profile,
        memberSince: profile?.created_at,
      },
      stats: {
        avgScore,
        totalLogs: allLogs.length,
        highestScore: scores.length ? Math.max(...scores) : 0,
        lowestScore: scores.length ? Math.min(...scores) : 0,
      },
      recentLogs: allLogs.slice(0, 20).map(l => ({
        content: l.content,
        score: l.gut_score,
        date: l.logged_at,
        analysis: l.ai_analysis,
      })),
      documents: (documents || []).map(d => ({
        type: d.type,
        interpretation: d.ai_interpretation,
        biomarkers: d.biomarkers,
        recommendations: d.recommendations,
        uploadedAt: d.uploaded_at,
      })),
    })
  } catch (e: unknown) {
    console.error('Practitioner view error:', e)
    return NextResponse.json({ error: 'Failed to load patient data' }, { status: 500 })
  }
}
