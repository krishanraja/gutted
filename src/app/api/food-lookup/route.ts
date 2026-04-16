import { NextRequest, NextResponse } from 'next/server'
import { lookupFood } from '@/lib/edamam'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit, truncate } from '@/lib/security'

const CACHE_TTL_DAYS = 30

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { allowed } = rateLimit(`food:${user.id}`, { maxRequests: 5, windowMs: 60_000 })
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 })

    const safeQuery = truncate(query, 200)
    const cacheKey = safeQuery.trim().toLowerCase().replace(/\s+/g, ' ')
    if (!cacheKey) return NextResponse.json({ error: 'No query' }, { status: 400 })

    const cache = createServiceClient()
    const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const { data: cached } = await cache
      .from('food_cache')
      .select('food_data')
      .eq('query_normalized', cacheKey)
      .gte('created_at', cutoff)
      .maybeSingle()

    if (cached) {
      await cache
        .from('food_cache')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('query_normalized', cacheKey)
      return NextResponse.json({ food: cached.food_data })
    }

    const food = await lookupFood(safeQuery)

    if (food) {
      await cache
        .from('food_cache')
        .upsert(
          {
            query_normalized: cacheKey,
            food_data: food,
            created_at: new Date().toISOString(),
            last_accessed_at: new Date().toISOString(),
          },
          { onConflict: 'query_normalized' },
        )
    }

    return NextResponse.json({ food })
  } catch (e: unknown) {
    console.error('Food lookup error:', e)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
