# Pricing Strategy

## Current Tiers

| Feature | Free ($0) | Core ($14/mo) | Pro ($29/mo) |
|---------|-----------|---------------|--------------|
| Voice logs | 3/day | Unlimited | Unlimited |
| Doc uploads | 1/month | 5/month | Unlimited |
| History | 7 days | Full | Full |
| Meal plans | -- | Weekly + grocery list | Weekly + grocery list |
| Food checker | -- | Yes | Yes |
| Pattern detection | -- | Enhanced + trigger foods | Enhanced + trigger foods |
| AI Gut Coach (chat) | -- | 10 chats/mo | Unlimited |
| Reminders | -- | Yes | Yes |
| Weekly digest | -- | Yes | Yes |
| Photo food logging | -- | -- | Yes |
| PDF reports | -- | -- | Monthly |
| Doctor visit summary | -- | -- | Yes |
| Supplement recs | -- | -- | Yes |
| Email delivery | -- | -- | Yes |
| Health integrations | -- | -- | Yes |
| Practitioner sharing | -- | -- | Yes |
| Goal tracking | -- | -- | Yes |

## Pricing Rationale

**Core at $14/mo** is justified by the AI Gut Coach, food checker, grocery lists, and enhanced pattern detection -- features users would otherwise need separate apps for (food trackers at $10-20/mo, health coaching at $30+/mo).

**Pro at $29/mo** is justified by photo logging, practitioner sharing, health integrations, supplement recommendations, and comprehensive reporting -- creating a complete gut health management system that replaces multiple point solutions.

## Key Files

- `src/lib/plan-limits.ts` -- Central feature gating
- `src/lib/stripe.ts` -- Stripe price IDs and plan definitions (update IDs after creating products in Stripe dashboard)
