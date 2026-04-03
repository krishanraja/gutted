import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { food, gutProfile } = await req.json()
    if (!food) return NextResponse.json({ error: 'No food data' }, { status: 400 })

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      system: 'You are a gut health nutrition analyst. Rate foods for gut friendliness based on the user\'s specific gut profile and conditions. Be evidence-based and practical. Never diagnose.',
      messages: [{
        role: 'user',
        content: `Rate this food for gut friendliness for a user with this gut profile:

Food: ${food.label} (${food.category})
Nutrients per 100g: ${JSON.stringify(food.nutrients)}
User gut profile: ${JSON.stringify(gutProfile || {})}

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
