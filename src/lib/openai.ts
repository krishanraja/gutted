import OpenAI from 'openai'
import { lazyClient } from '@/lib/lazy'

// Constructed lazily so importing a route at build time (no env) never throws.
export const openai = lazyClient(
  () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
)
