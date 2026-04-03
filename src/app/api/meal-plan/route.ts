import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { userProfile, documents, recentLogs } = await req.json()

    const prompt = `You are a gut health nutritionist AI. Create a personalised 7-day meal plan based on the user's gut health profile, test results, and recent logs.

User profile: ${JSON.stringify(userProfile || {})}
Recent gut health test findings: ${JSON.stringify(documents?.slice(0, 3) || [])}
Recent symptom logs: ${JSON.stringify(recentLogs?.slice(0, 5) || [])}

Create a practical, gut-friendly 7-day meal plan. Be specific with meal names and include gut health benefits for each meal.

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
  "gutTips": ["<daily gut health tip 1>", "<tip 2>", "<tip 3>"]
}`

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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
