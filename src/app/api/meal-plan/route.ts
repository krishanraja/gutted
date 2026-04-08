import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'
import { getPlanLimits } from '@/lib/plan-limits'
import { rateLimit, truncate } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('plan, gut_profile').eq('id', user.id).single()
    const limits = getPlanLimits(profile?.plan || 'free')
    if (!limits.mealPlan) return NextResponse.json({ error: 'Upgrade to Core or Pro for meal plans' }, { status: 403 })

    const { allowed } = rateLimit(`meal:${user.id}`, { maxRequests: 5, windowMs: 60_000 })
    if (!allowed) return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })

    // Fetch data server-side instead of trusting client-supplied data
    const [{ data: logs }, { data: documents }] = await Promise.all([
      supabase.from('logs').select('content, gut_score, logged_at').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(5),
      supabase.from('documents').select('type, ai_interpretation, biomarkers, recommendations').eq('user_id', user.id).order('uploaded_at', { ascending: false }).limit(3),
    ])

    const prompt = `You are a gut health nutritionist AI. Create a personalised 7-day meal plan based on the user's gut health profile, test results, and recent logs.

User profile: ${JSON.stringify(profile?.gut_profile || {})}
Recent gut health test findings: ${JSON.stringify((documents || []).map(d => ({ type: d.type, findings: typeof d.ai_interpretation === 'string' ? d.ai_interpretation.slice(0, 300) : '', biomarkers: d.biomarkers })))}
Recent symptom logs: ${JSON.stringify((logs || []).map(l => ({ content: l.content.slice(0, 150), score: l.gut_score })))}

Create a practical, gut-friendly 7-day meal plan. Be specific with meal names and include gut health benefits for each meal. Also generate a consolidated grocery/shopping list for the entire week, grouped by category.

Return exactly this JSON structure:
{
  "weekSummary": "<2-3 sentence overview of the approach this week and why>",
  "days": [
    {
      "day": "Monday",
      "breakfast": { "name": "<meal name>", "description": "<brief description>", "gutBenefits": "<why this is good for their gut>", "prepTime": "<X mins>" },
      "lunch": { "name": "<meal name>", "description": "<brief description>", "gutBenefits": "<why>", "prepTime": "<X mins>" },
      "dinner": { "name": "<meal name>", "description": "<brief description>", "gutBenefits": "<why>", "prepTime": "<X mins>" },
      "snacks": ["<snack 1>", "<snack 2>"]
    }
  ],
  "gutTips": ["<daily gut health tip 1>", "<tip 2>", "<tip 3>"],
  "groceryList": [
    { "category": "<Produce/Protein/Dairy/Grains/Pantry/Other>", "items": ["<item 1 with quantity>", "<item 2 with quantity>"] }
  ]
}`

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid AI response')
    const plan = JSON.parse(jsonMatch[0])

    return NextResponse.json({ plan })
  } catch (e: unknown) {
    console.error('Meal plan error:', e)
    return NextResponse.json({ error: 'Could not generate meal plan' }, { status: 500 })
  }
}
