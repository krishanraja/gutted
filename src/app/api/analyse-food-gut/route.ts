import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, truncate } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { allowed } = rateLimit(`foodgut:${user.id}`, { maxRequests: 20, windowMs: 60_000 })
    if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

    const { food } = await req.json()
    if (!food) return NextResponse.json({ error: 'No food data' }, { status: 400 })

    // Fetch gut profile server-side
    const { data: profile } = await supabase.from('profiles').select('gut_profile').eq('id', user.id).single()

    // Sanitize food input
    const safeFood = {
      label: truncate(food.label, 200),
      category: truncate(food.category, 100),
      nutrients: typeof food.nutrients === 'object' ? food.nutrients : {},
    }

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: 'You are a gut health nutrition analyst. Rate foods for gut friendliness based on the user\'s specific gut profile and conditions. Be evidence-based and practical. Never diagnose.',
      messages: [{
        role: 'user',
        content: `Rate this food for gut friendliness for a user with this gut profile:

Food: ${safeFood.label} (${safeFood.category})
Nutrients per 100g: ${JSON.stringify(safeFood.nutrients)}
User gut profile: ${JSON.stringify(profile?.gut_profile || {})}

Return JSON:
{
  "rating": <1-10 gut friendliness score>,
  "explanation": "<2-3 sentences explaining why this rating for their specific profile>",
  "tips": ["<tip for consuming this food>", "<tip 2>"]
}`,
      }],
    })

    const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ rating: 5, explanation: 'Could not analyse', tips: [] })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e: unknown) {
    console.error('Food gut analysis error:', e)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
