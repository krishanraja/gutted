import { NextRequest, NextResponse } from 'next/server'
import { lookupFood } from '@/lib/edamam'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, truncate } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { allowed } = rateLimit(`food:${user.id}`, { maxRequests: 30, windowMs: 60_000 })
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 })

    const safeQuery = truncate(query, 200)
    const food = await lookupFood(safeQuery)
    return NextResponse.json({ food })
  } catch (e: unknown) {
    console.error('Food lookup error:', e)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
