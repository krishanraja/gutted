import { NextRequest, NextResponse } from 'next/server'
import { lookupFood } from '@/lib/edamam'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'No query' }, { status: 400 })
    const food = await lookupFood(query)
    return NextResponse.json({ food })
  } catch (e: unknown) {
    console.error('Food lookup error:', e)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
