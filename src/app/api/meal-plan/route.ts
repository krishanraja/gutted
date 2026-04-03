import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userProfile, documents } = await req.json()
    const gutProfile = userProfile?.gut_profile || {}

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: `You are a gut health nutritionist AI. Create a personalised 7-day meal plan as JSON.
Return a JSON object with key "days" — an array of 7 objects, each with:
- day (string): e.g. "Monday"
- breakfast, lunch, dinner, snacks — each an object with:
  - name (string)
  - description (string, 1 sentence)
  - gutBenefits (string, 1 sentence about why this is good for gut health)
  - prepTime (string, e.g. "10 min")

User profile: ${JSON.stringify(gutProfile)}
Recent test findings: ${documents?.length ? documents.map((d: Record<string, unknown>) => d.ai_interpretation).join('. ') : 'None uploaded yet'}

Make the meals delicious, practical, and genuinely gut-health optimised for this user's specific profile.
Return ONLY valid JSON.`,
      messages: [{ role: 'user', content: 'Generate my personalised weekly meal plan.' }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const result = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())

    // Save to DB
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
    await supabase.from('meal_plans').upsert({
      user_id: user.id,
      week_start: weekStart.toISOString().split('T')[0],
      plan: result,
      generated_at: new Date().toISOString(),
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('Meal plan error:', err)
    return NextResponse.json({ error: 'Failed to generate meal plan' }, { status: 500 })
  }
}
