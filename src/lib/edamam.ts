const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID!
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY!

export async function lookupFood(query: string) {
  const url = new URL('https://api.edamam.com/api/food-database/v2/parser')
  url.searchParams.set('app_id', EDAMAM_APP_ID)
  url.searchParams.set('app_key', EDAMAM_APP_KEY)
  url.searchParams.set('ingr', query)
  url.searchParams.set('nutrition-type', 'cooking')

  const res = await fetch(url.toString())
  if (!res.ok) return null
  const data = await res.json()
  return data.hints?.[0]?.food || null
}
