import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    const url = new URL('https://api.edamam.com/api/food-database/v2/parser')
    url.searchParams.set('app_id', process.env.EDAMAM_APP_ID!)
    url.searchParams.set('app_key', process.env.EDAMAM_APP_KEY!)
    url.searchParams.set('ingr', query)

    const res = await fetch(url.toString())
    if (!res.ok) return NextResponse.json({ error: 'Food lookup failed' }, { status: 500 })
    const data = await res.json()
    const food = data.hints?.[0]?.food
    if (!food) return NextResponse.json({ error: 'Food not found' }, { status: 404 })
    return NextResponse.json({ food })
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
