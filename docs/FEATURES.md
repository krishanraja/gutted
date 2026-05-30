# Features

Complete inventory of what gutted. does today, organised the way the dashboard is organised, plus the cross-cutting infrastructure that makes it all work.

Plan availability is shown for each feature -- the source of truth is [`src/lib/plan-limits.ts`](../src/lib/plan-limits.ts) and the unlock thresholds in [`src/lib/unlock-status.ts`](../src/lib/unlock-status.ts).

---

## Dashboard tabs

The main dashboard is a tabbed interface with progressive unlocks based on logging behaviour and dietary-restriction setup.

### Overview (unlocks after 1st log)

- Personalised greeting (time-of-day aware).
- Current 1-10 gut score with animated reveal.
- 7-day rolling average score.
- Quick-action shortcuts (Log, Upload, Coach, Meals).
- Recent logs feed with score badges and timestamps.
- Onboarding nudge if profile is incomplete.

### Log (always unlocked)

**Voice-first** primary input, **text fallback** secondary.

- One-tap recording with a 20-bar live frequency visualiser.
- Whisper transcription on submit (`/api/transcribe`).
- Quick-tag chips (bloating, cramps, nausea, heartburn, etc.) for instant logging.
- Text input fallback with the same analysis pipeline.
- After submit: gut score, summary, insights, recommendations, plus a `flagged` safety surface for red-flag symptoms.
- Persisted to `logs` with the full AI analysis JSON.

### History (unlocks after 3rd log)

- Chronological feed of all logs with score badges.
- 7-day rolling average headline.
- Color-coded entries (`>=7` green, `4-6` amber, `<4` red).
- Tap-through to a detail view (`/dashboard/history/[id]`) with the full analysis.

### Coach (unlocks after 5th log; **Core 10 chats/mo, Pro unlimited**)

- Multi-turn AI Gut Coach conversation.
- **Token-by-token streaming.** `/api/gut-coach` uses `anthropic.messages.stream` piped through a `ReadableStream`; `CoachContent.tsx` reads the response body and renders tokens as they arrive (`text/plain`, `Cache-Control: no-store`, `X-Accel-Buffering: no`). It genuinely streams now -- earlier it buffered the full reply via `messages.create` before showing anything.
- Graceful mid-stream failure: once streaming starts the status is already 200, so a mid-stream error ends the stream and the client keeps and softly flags whatever partial text arrived (no dead end, no raw error dumped). A 60s abort caps a stalled call, and a client disconnect aborts the upstream model call so we stop paying for unread tokens.
- Each turn is grounded server-side in the user's profile, recent logs, uploaded documents, and dietary restrictions.
- User data is wrapped in `[BEGIN USER DATA]`/`[END USER DATA]` delimiters in a leading user-role message so an injection payload in a log or document cannot rewrite the static system guardrails.
- Same safety framework as log analysis -- no diagnoses, flagged symptoms route the user to professional care.

---

## Food tab (`/dashboard/food`)

Sub-tabs for the food-side of the loop.

### Meals (Core+ -- requires dietary restrictions set)

- AI-generated **7-day meal plan** + **grocery list**.
- Built from the user's gut profile, restrictions, conditions, recent symptom pattern, and any uploaded biomarkers.
- Daily breakdown: breakfast, lunch, dinner, snacks.
- Weekly tips and rationale.
- Pro: weekly **emailed** meal-plan delivery via Resend.

### Upload (always unlocked)

- Drag-drop or camera capture for documents.
- Supported MIME: JPEG, PNG, WebP, HEIC, HEIF, PDF.
- 20 MB cap, validated server-side (`validateFile`).
- Storage: Supabase Storage `documents` bucket (private; per-user prefix).
- Claude vision analysis returns biomarkers, plain-English interpretation, prioritised recommendations.
- Supported test types include Viome, GI-MAP, Thryve, SIBO breath tests, food-sensitivity panels, plus food labels.

### Check (Core+ -- unlocks after 1st log)

- Enter or scan a food name -> Edamam parser returns nutrition data (cached 30 days in `food_cache`).
- Claude analyses the food against the user's gut profile and returns a 1-10 gut-friendliness score, called-out helpful and problematic ingredients, and a personal recommendation.

### Supplements (Pro -- unlocks after 1st document upload)

- Recommendations grounded in uploaded biomarker data and recent symptoms.
- Claude returns a list with rationale per supplement.
- Conservative -- no specific brands, always pairs with "discuss with your doctor."

---

## Reports & sharing

### Doctor visit summary (Pro)

- Pulls the user's recent logs, score trend, top patterns, uploaded documents.
- Claude composes a structured PDF the user can hand to a clinician.
- Designed for the 15-minute slot the average specialist gives.

### PDF health reports (Pro)

- Monthly progress reports with score charts, trends, top triggers, plan-adherence summary.
- Available on demand via `/dashboard/report` and emailed monthly.

### Practitioner share (Pro)

- Generate a unique read-only token (`/dashboard/share`).
- Share the token URL with a clinician -- no Supabase login required on their side.
- Practitioner sees a curated read-only view at `/practitioner/[token]`.
- Tokens are revocable (`is_active = false`); `last_accessed_at` is tracked.

---

## Settings (`/dashboard/settings`)

Redesigned as a profile admin dashboard.

- Profile: name, email, avatar selection (six gut-themed avatars).
- Plan: current plan badge, upgrade/downgrade flow, Stripe customer portal link.
- Subscription: cancel / resume, current period end, status (`active`, `canceling`, `past_due`).
- Practitioner access: list, revoke, regenerate.
- Sign out.

### Avatars

Six on-brand options selectable by the user, persisted as a plain-text id (`profiles.avatar_id`):

`bloat-balloon`, `dash-runner`, `fiber-friend`, `gurgle-sleuth`, `probiotic-pal`, `zen-guru`.

The registry lives in `src/components/avatars/` so adding new avatars never requires a database migration.

---

## Onboarding (`/onboarding`)

A four-step wizard, gated by the middleware until complete.

1. **Health goals** -- what the user wants to improve.
2. **Dietary restrictions** -- allergies, intolerances, preferences.
3. **Existing conditions** -- IBS, GERD, Crohn's, celiac, SIBO, etc.
4. **Initial gut score** -- baseline 1-10 self-assessment.

Output is persisted to `profiles.gut_profile` as JSONB and `profiles.onboarding_complete = true`. The middleware caches that flag for 1 hour to avoid querying it on every dashboard navigation.

---

## Authentication (`/auth/*`)

- Email + password (auto-confirmed on signup).
- Magic links for password-less return.
- Password-reset flow.
- Supabase callback at `/auth/callback`.
- Logged-in users hitting `/auth/login` or `/auth/signup` are bounced to `/dashboard`.

---

## Email & notifications

Powered by Resend; templates in `src/lib/email-templates.ts`.

| Email | Trigger | Plan |
|---|---|---|
| Welcome | New signup | All |
| Password reset | Forgot password | All |
| Daily reminder | Cron (`/api/send-reminder`) | Core, Pro |
| Weekly digest | Cron (`/api/weekly-digest`) | Core, Pro |
| Weekly meal plan | Cron, after plan generation | Pro |
| Monthly report | Cron (`/api/monthly-report`) | Pro |
| Upgrade confirmation | Stripe `checkout.session.completed` | Core, Pro |
| Payment failed | Stripe `invoice.payment_failed` | Core, Pro |

All cron-triggered routes are guarded by a constant-time `CRON_SECRET` check.

---

## Mobile / PWA

- Mobile-first, max-width-`sm` dashboard layout (384px) with a desktop variant.
- Pure-black OLED-friendly theme, no light mode.
- PWA manifest (`/manifest.json`) -- standalone display, theme color `#000000`.
- Service worker registered in `layout.tsx`.
- Safe-area padding on the bottom navigation for notched devices.
- `viewport-fit=cover`, `maximumScale: 1` to prevent input zoom on iOS.
- Hero video uses MP4 faststart and eager preload for fast LCP.

---

## Billing (Stripe)

- Three plans: Free / Core $14 / Pro $29 (monthly).
- Stripe Checkout for new subscriptions.
- Stripe customer portal for payment-method updates.
- In-app self-serve cancel, resume, and change-plan flows.
- Idempotent webhook handler covering `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- `subscription_status`, `current_period_end`, and `plan` mirrored on `profiles`.

Full pricing detail in [PRICING.md](./PRICING.md).

---

## Agent surface (product truth for crawlers and the fleet)

gutted. exposes a machine-readable description of itself so agents, crawlers, and the Mindmaker fleet all sell the same accurate, current pitch with no re-brief, and never invent a health claim.

### `GET /api/product-truth`

- Versioned, capability-only JSON (`schema_version: "gutted.product-truth/1"`; bump on any contract change).
- One source of truth for product positioning, ICP and anti-ICP, channels, outcomes, an agent briefing (`claims_policy`, `how_to_describe`, `never_claim`, objection handling), and disclaimers.
- Pricing and price IDs are read from the authoritative `PLANS` object in `src/lib/stripe.ts`, so price and `priceId` can never drift from Stripe.
- Capability-only by policy: it describes what gutted does, never a health outcome or efficacy claim (gutted is YMYL).
- Cacheable at the edge (`Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`).

### `/llms.txt`

- Discovery file at the site root pointing agents to `/api/product-truth` first, plus a plain-language product summary, pricing, key pages, and an explicit claims policy for agents.

### robots carve-out

- `public/robots.txt` keeps `/api` disallowed in general but carves out `Allow: /api/product-truth`, `Allow: /llms.txt`, and `Allow: /.well-known/` so the agent surfaces stay crawlable. `/dashboard`, `/onboarding`, and `/auth` remain disallowed.

---

## SEO & structured data

- **JSON-LD** in `src/app/layout.tsx`: `SoftwareApplication` + `Organization` + `FAQPage`, emitted as an `application/ld+json` script.
- **Open Graph + Twitter cards** in the root metadata.
- **Branded dynamic OG image** (`src/app/opengraph-image.tsx`): teal (`#00B4B4`) to green (`#3FBE6F`) wordmark on black.
- The app is already server-rendered (SSR/SSG), so crawlers see fully rendered markup.

---

## Revenue-only attribution

First-party attribution that stitches landing -> signup -> Stripe -> warehouse while sending the fleet **commercial fields only**. gutted is YMYL: no PHI ever leaves the app.

- **Storage:** `profiles.attribution` jsonb column (additive migration, RLS intact).
- **First-party capture** (`src/lib/attribution-client.ts` + `src/components/AttributionCapture.tsx`): first-touch UTM set, referrer, and landing path plus a stable anonymous id, all in first-party cookies (`gutted_attrib` 90 days, `gutted_aid` 365 days). First-touch wins.
- **Persistence:** the captured record is written to `profiles.attribution` at email signup and at the OAuth callback.
- **Stripe stamping:** checkout stamps `utm_*` and `anonymous_id` onto both the Checkout Session and the subscription metadata.
- **Frontend lifecycle events** (`landed`, `signed_up`, `activated`) post to `/api/attribution`, which keeps the ingest secret server-side and attaches the opaque Supabase `user_id` (never trusted from the client).
- **Commercial lifecycle events** (`purchased`, `refunded`, `churned`) fire from the signature-verified Stripe webhook (a `charge.refunded` handler was added).
- **Deny-by-default serializer** (`src/lib/attribution.ts`): only an opaque uuid, the UTM set, and a plan-derived `value_cents` ever leave gutted. NEVER email, name, symptom, gut score, condition, or biomarker. A caller can pass anything; only allowlisted keys are serialized.
- **Ships dark:** emit is a safe no-op until `ATTRIBUTION_INGEST_URL` and `ATTRIBUTION_INGEST_SECRET` are set (the Mindmaker OS warehouse owns the `ingest-attribution` function and the shared `x-attribution-secret`). It switches on with config alone, no code change. Attribution never blocks a purchase, signup, or page load.

---

## Cross-cutting infrastructure

| Capability | Where it lives |
|---|---|
| AI request timeout (25s) | `src/lib/ai-response.ts` `aiAbort()` |
| Safe JSON extraction | `src/lib/ai-response.ts` `extractJsonObject()` |
| Per-user rate limiting | `src/lib/security.ts` `rateLimit()` |
| Cron secret verification (edge-safe) | `src/lib/security.ts` `verifyCronSecret()` |
| File upload validation | `src/lib/security.ts` `validateFile()` |
| Open-redirect allowlist | `src/lib/security.ts` `isAllowedOrigin()` |
| Plan limits | `src/lib/plan-limits.ts` |
| Tab unlock thresholds | `src/lib/unlock-status.ts` |
| Stripe plan resolvers | `src/lib/stripe.ts` |
| Edamam cache (Postgres) | `food_cache` table + `src/app/api/food-lookup/route.ts` |
| Webhook idempotency | `stripe_webhook_events` table + webhook handler |
| Haptics on mobile | `src/lib/haptics.ts` |
| Keyboard shortcuts | `src/hooks/useKeyboardShortcuts.ts` |
| Swipeable cards | `src/hooks/useSwipeableCards.ts` |
| Upgrade flow | `src/hooks/useUpgrade.ts` |
| Lazy AI/billing/email clients (no build-time env) | `src/lib/lazy.ts` |
| Revenue-only attribution serializer (deny-by-default) | `src/lib/attribution.ts` |
| First-party attribution capture | `src/lib/attribution-client.ts` + `src/components/AttributionCapture.tsx` |
| Machine-readable product truth | `src/app/api/product-truth/route.ts` + `public/llms.txt` |

---

## Security highlights

- RLS on every user table; deny-all on `food_cache` and `stripe_webhook_events`.
- Server-side context fetching for AI prompts (no client-supplied profile/log payloads).
- Prompt-injection delimiters around all user-data inputs.
- Stripe webhook signature verification + event-id idempotency.
- Open-redirect protection on auth/post-checkout redirects.
- Edge-compatible Web APIs (no Node `crypto` / `Buffer` in hot paths).
- Comprehensive API-route hardening landed in recent work (rate limits, error-surface tightening, validation everywhere).

Full architecture context: [ARCHITECTURE.md](./ARCHITECTURE.md). AI safety framework: [LLM_CRITICAL_THINKING_TRAINING.md](./LLM_CRITICAL_THINKING_TRAINING.md). Roadmap and what's next: [SPRINTS.md](./SPRINTS.md).
