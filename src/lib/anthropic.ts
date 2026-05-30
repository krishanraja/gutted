import Anthropic from '@anthropic-ai/sdk'
import { lazyClient } from '@/lib/lazy'

// Constructed lazily so importing a route at build time (no env) never throws.
export const anthropic = lazyClient(
  () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
)

export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
