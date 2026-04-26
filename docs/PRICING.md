# Pricing

## Current tiers

The plan structure and feature gates are defined in [`src/lib/plan-limits.ts`](../src/lib/plan-limits.ts) and the Stripe-product mapping in [`src/lib/stripe.ts`](../src/lib/stripe.ts). Prices below are the source of truth -- update these together when changing tiers.

| Capability | Free ($0) | Core ($14/mo) | Pro ($29/mo) |
|---|---|---|---|
| Voice + text logs | 3 / day | Unlimited | Unlimited |
| Document uploads | 1 / month | 5 / month | Unlimited |
| Log history | 7 days | Full | Full |
| Gut score per log | Yes | Yes | Yes |
| Weekly meal plan + grocery list | -- | Yes | Yes |
| Food checker (Edamam-backed) | -- | Yes | Yes |
| Pattern detection + trigger foods | -- | Enhanced | Enhanced |
| AI Gut Coach (multi-turn) | -- | 10 chats / mo | Unlimited |
| Daily reminders + weekly digest | -- | Yes | Yes |
| Photo food logging | -- | -- | Yes |
| PDF health reports | -- | -- | Yes |
| Doctor visit summary | -- | -- | Yes |
| Monthly progress reports | -- | -- | Yes |
| Supplement recommendations | -- | -- | Yes |
| Email-delivered meal plans | -- | -- | Yes |
| Health-data integrations (Apple Health / Fitbit / Oura / manual) | -- | -- | Yes |
| Practitioner share (read-only token) | -- | -- | Yes |
| Goal tracking | -- | -- | Yes |

> AI Gut Coach has a **5-log unlock requirement** regardless of plan -- the coach needs context to be useful. See [`src/lib/unlock-status.ts`](../src/lib/unlock-status.ts).

---

## Pricing rationale

### Free at $0

- Demonstrates the AI quality before payment is asked for.
- 3 logs/day + 1 upload is enough to feel the loop, not enough to substitute for a paid plan.
- 7-day history forces a paid upgrade before week 2 if the user is engaged.
- Loses money per user on AI; profitable above ~5-7% D30 conversion to Core.

### Core at $14/mo

The default tier. Justified by replacing or consolidating:
- A symptom tracker ($5-10/mo).
- A meal-planning tool ($10-20/mo).
- Enough nutrition lookups to skip MyFitnessPal premium.
- A modest amount of AI-coach interaction users would otherwise pay $30+/session for.

> Anchor: **"Cheaper than two coffees -- and the only thing in this category that actually reads your body's signals."**

### Pro at $29/mo

Justified by replacing or significantly augmenting:
- Specialist visits between consultations (~$200-300/visit).
- One-off lab interpretations ($50-200 each).
- Practitioner-side admin time (the practitioner-share + doctor-summary loop).
- Wearable-data context (integration table for Apple Health / Fitbit / Oura).
- Photo food logging (replaces calorie-counting apps for users who want gut context, not calories).

> Anchor: **"For less than 10% of one specialist copay you get a year of guidance, an AI coach with memory, and reports your doctor can actually use."**

### Why these specific numbers

- **$14** sits below the psychological threshold of *"another subscription I'll cancel"* (typically $15) and above the cost floor for our AI usage on a daily user.
- **$29** rounds to *"under $1/day"* -- a clean line in sales and ad copy.
- **2x ratio** between Core and Pro is intentional. It funnels indecisive users into Core (the wider plan) while making Pro a clear upgrade rather than a tweak.
- We do not currently sell **annual** -- annual pricing flattens the funnel without solving a real customer problem yet. Revisit when paid churn proves stable below 8% MoM and the cohort is large enough to make discounting worth it.

---

## Feature-gating logic

Where each plan rule is enforced:

| Rule | File | Behaviour |
|---|---|---|
| Daily log limit | API route + `PLAN_LIMITS.maxLogsPerDay` | Free capped at 3/day |
| Monthly upload limit | Upload route + `PLAN_LIMITS.maxUploadsPerMonth` | Free 1, Core 5, Pro unlimited |
| History window | Dashboard query + `PLAN_LIMITS.historyDays` | Free 7-day, Core/Pro full |
| Meal plan / grocery list | `PLAN_LIMITS.mealPlan` / `groceryList` | Core/Pro |
| Food checker | `PLAN_LIMITS.foodChecker` | Core/Pro |
| AI Gut Coach unlock | `unlock-status.ts` (5-log gate) + `PLAN_LIMITS.gutCoachChatsPerMonth` | Core 10/mo, Pro unlimited |
| Photo logging | `PLAN_LIMITS.photoLogging` | Pro |
| PDF reports | `PLAN_LIMITS.pdfReports` | Pro |
| Doctor summary | `PLAN_LIMITS.doctorSummary` | Pro |
| Email meal plans | `PLAN_LIMITS.emailMealPlans` | Pro |
| Supplements | `PLAN_LIMITS.supplements` | Pro |

Plan changes are propagated via the Stripe webhook (`src/app/api/stripe/webhook/route.ts`), which is **idempotent** (event-id dedup table) and updates `profiles.plan`, `subscription_status`, and `current_period_end`.

---

## How a user becomes paid

1. Lands on `/`, sees the hero video and pricing.
2. Signs up -> auto-confirm -> onboarding wizard (4 steps).
3. Completes 3-5 logs, hits a Free limit (logs/day, history window, or upload cap).
4. Clicks upgrade -> `POST /api/stripe/checkout` creates a Stripe Checkout session.
5. Stripe redirects to `/dashboard?upgraded=1`. Webhook flips `plan` to `core` or `pro`, sets `subscription_status=active`, stores `current_period_end`, and triggers an upgrade email via Resend.

Mid-subscription changes are handled through:
- `POST /api/stripe/change-plan` (Core ↔ Pro).
- `POST /api/stripe/cancel` (sets `cancel_at_period_end`, keeps access until period end).
- `POST /api/stripe/resume` (un-cancels).
- `POST /api/stripe/portal` (full Stripe customer portal).

Failed payments (`invoice.payment_failed`) flip `subscription_status` to `past_due` and send a payment-failed email. Subscription deletion reverts the user to Free.

---

## Where to update prices

When changing prices, touch all three locations together:

1. **Stripe dashboard** -- create/update product + recurring price; capture the `STRIPE_CORE_PRICE_ID` / `STRIPE_PRO_PRICE_ID` environment variables.
2. **`src/lib/stripe.ts`** -- adjust the `PLANS` object (`name`, `price`, `features`).
3. **All marketing copy** -- landing page, settings page, ICP/EXECUTIVE_SUMMARY/VALUE_PROP/OUTCOMES docs.

The webhook resolves a plan from the price ID; if a price ID changes without an env-var update, paid subscriptions will silently land back on Free at next billing event. Always update env vars and redeploy together.

---

## Pricing experiments to consider

- **Annual plan at ~16-18% discount** once paid churn is provably <8% MoM.
- **At-home-test bundle**: discounted Pro for users coming from a partner test brand.
- **Practitioner multi-seat tier** ($79-199/mo, 10-25 client seats, white-label option) once practitioner-channel demand crosses the noise floor.
- **Founder-pricing lock** for early Core/Pro cohorts to drive review velocity.
- **Pause subscription** instead of cancel -- meaningful retention lever, mostly recoverable revenue.

---

## Sales-agent positioning

- *"Free tier is the demo. If the AI doesn't help, you've spent ten seconds."*
- *"Core is what most people stay on -- it removes the limits and adds the meal plan and coach."*
- *"Pro is built for two people: someone with real test results to interpret, and someone whose practitioner is going to look at this with them."*
- *"$14 is two coffees. $29 is one fancy lunch. A specialist visit is twenty of either."*
