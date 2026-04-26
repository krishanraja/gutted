# Architecture

The system as it actually exists today. Treat this as the source of truth and update it when something material lands. Ephemeral notes belong in [DECISIONS_LOG.md](./DECISIONS_LOG.md) or [SPRINTS.md](./SPRINTS.md).

---

## Overview

gutted. is a single Next.js 16 application deployed on Vercel (Fluid Compute), backed by Supabase (Postgres + Auth + Storage), with a multi-model AI pipeline (Anthropic Claude + OpenAI Whisper) and Stripe for billing.

```
                +-----------------------+
                |  Browser / PWA        |
                |  React 19 · Tailwind 4|
                +-----------+-----------+
                            |
                +-----------+-----------+
                |  Next.js 16 (Vercel)  |
                |  App Router           |
                |  Routing middleware   |
                +-----------+-----------+
                            |
       +--------------------+--------------------+
       |                    |                    |
+------+------+      +------+------+      +------+------+
|  API routes |      |  Supabase   |      |   Stripe    |
|  (functions)|      |  PG + Auth  |      |  Billing +  |
|             |      |  + Storage  |      |  Webhooks   |
+------+------+      +------+------+      +------+------+
       |                    |
+------+------------------+ |
|                         | |
|  Anthropic Claude       | |
|  (text + vision)        | |
|                         | |
|  OpenAI Whisper         | |
|  (audio -> text)        | |
|                         | |
|  Edamam Food Database   | |
|  (cached in Postgres)   |-+
|                         |
|  Resend (email)         |
+-------------------------+
```

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.2 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS (PostCSS plugin) | 4.x |
| Language | TypeScript | 5.x |
| Database | Postgres via Supabase | Managed |
| Auth | Supabase Auth | `@supabase/ssr` 0.10, `@supabase/supabase-js` 2.101 |
| Storage | Supabase Storage (`documents` bucket) | Managed |
| Payments | Stripe | SDK 22.x, API `2026-03-25.dahlia` |
| AI -- text + vision | Anthropic | SDK 0.82, model `claude-sonnet-4-20250514` |
| AI -- audio | OpenAI | SDK 6.33, Whisper |
| Email | Resend | SDK 6.10 |
| Nutrition data | Edamam Food Database API | v2 (server-cached) |
| Hosting | Vercel | Fluid Compute, Node runtime |

---

## Directory layout

```
src/
├── app/
│   ├── layout.tsx              # Root layout, metadata, ServiceWorker, ToastProvider, AuthProvider
│   ├── page.tsx                # Landing page with hero video
│   ├── globals.css             # Tailwind 4 entry + tokens
│   ├── not-found.tsx
│   ├── sitemap.ts              # XML sitemap
│   ├── api/                    # Serverless API routes (see below)
│   ├── auth/                   # /auth/{login,signup,forgot-password,reset-password,callback}
│   ├── onboarding/             # 4-step wizard, gates dashboard access
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Tabs: overview, log, history, coach
│   │   ├── food/page.tsx       # Tabs: meals, upload, check, supplements
│   │   ├── settings/page.tsx
│   │   ├── share/page.tsx
│   │   ├── report/page.tsx
│   │   └── history/[id]/page.tsx
│   └── practitioner/[token]/page.tsx  # token-based read-only view
├── components/
│   ├── AuthProvider.tsx, ToastProvider.tsx, ErrorBoundary.tsx
│   ├── Navigation.tsx, DesktopLayout.tsx, SectionNav.tsx, BottomSheet.tsx
│   ├── HeroVideo.tsx, GutScore.tsx, PhaseView.tsx, CardCarousel.tsx
│   ├── VoiceRecorder.tsx, DocumentUploader.tsx, GuidedLogWizard.tsx
│   ├── content/{Log,History,Coach,FoodChecker,MealPlan,Supplements,Upload}Content.tsx
│   ├── avatars/{BloatBalloon,DashRunner,FiberFriend,GurgleSleuth,ProbioticPal,ZenGuru}.tsx
│   └── ui/{Button,Card,TextInput,Badge,Skeleton}.tsx
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   ├── useSwipeableCards.ts
│   └── useUpgrade.ts
├── lib/
│   ├── anthropic.ts            # Claude client + CLAUDE_MODEL
│   ├── openai.ts               # OpenAI client (Whisper)
│   ├── ai-response.ts          # aiAbort() (25s), extractJsonObject(), isAbortError()
│   ├── stripe.ts               # Stripe client + PLANS + plan resolvers
│   ├── plan-limits.ts          # Per-plan feature gates
│   ├── unlock-status.ts        # Tab unlock thresholds (logs, docs, restrictions)
│   ├── edamam.ts               # Food lookup
│   ├── email-templates.ts      # Resend HTML templates
│   ├── security.ts             # rateLimit, verifyCronSecret, validateFile, escapeHtml, isValidEmail, getAppUrl
│   ├── animations.ts, haptics.ts
│   └── supabase/{client,server}.ts  # browser + auth-aware server + service-role clients
└── middleware.ts               # Auth + onboarding gate + legacy route redirects
supabase/
└── migrations/                 # Versioned SQL migrations (see Database)
```

---

## Routes

### Public
- `/` -- landing page with hero video and pricing.
- `/onboarding` -- 4-step wizard (gates dashboard until complete).
- `/not-found`, `/sitemap.xml`, `/robots.txt`, `/manifest.json`, `/sw.js`.

### Auth
- `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`.
- `/auth/callback` (server route, handles Supabase auth redirects).

### Dashboard (protected; onboarding-gated)
- `/dashboard` -- tabs `overview | log | history | coach`.
- `/dashboard/food` -- tabs `meals | upload | check | supplements`.
- `/dashboard/settings` -- profile, avatar, subscription, practitioner access management.
- `/dashboard/share` -- generate practitioner read-only tokens.
- `/dashboard/report` -- request/download PDF health reports (Pro).
- `/dashboard/history/[id]` -- single log detail.

### Practitioner
- `/practitioner/[token]` -- token-based read-only access (no Supabase session required).

### API routes (`src/app/api/...`)

| Route | Purpose | Notes |
|---|---|---|
| `auth/confirm` | Magic-link / email confirmation | -- |
| `analyse-log` | Claude analyses a gut-health log entry | rate-limited 15/min/user, 25s AI timeout, prompt-injection delimiters, `extractJsonObject` |
| `analyse-photo` | Claude analyses a food photo (Pro) | -- |
| `analyse-document` | Claude extracts biomarkers + recommendations from uploaded docs | -- |
| `analyse-food-gut` | Claude scores a food against the user's gut profile | -- |
| `gut-coach` | Multi-turn coach (5-log unlock; Core 10/mo, Pro unlimited) | -- |
| `daily-insight` | Daily AI tip | -- |
| `transcribe` | Whisper voice transcription | 25 MB cap (Whisper limit) |
| `food-lookup` | Edamam parser; Postgres cache 30-day TTL | service-role read/write |
| `health-data` | Log Apple Health / Fitbit / Oura / manual metrics | -- |
| `patterns` | AI pattern analysis from logs + health data | -- |
| `health-report` | PDF health report (Pro) | -- |
| `meal-plan` | Claude weekly meal plan (Core+) | -- |
| `doctor-summary` | Pro-only doctor visit PDF | -- |
| `weekly-digest`, `monthly-report` | Aggregated email content (cron-driven) | gated by `verifyCronSecret` |
| `supplements` | Pro-only biomarker-based recs | -- |
| `upload-document` | Supabase Storage upload + validation | `validateFile` MIME + extension + size |
| `send-email`, `send-reminder` | Resend transactional + cron reminders | `verifyCronSecret` for cron paths |
| `stripe/checkout`, `stripe/subscription`, `stripe/portal`, `stripe/change-plan`, `stripe/cancel`, `stripe/resume` | Subscription flow | -- |
| `stripe/webhook` | Lifecycle handler (idempotent via `stripe_webhook_events`) | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` |
| `practitioner` | Practitioner token issuance and validation | -- |

---

## Middleware (`src/middleware.ts`)

Runs on every non-static request (excluded: `_next/static`, `_next/image`, `favicon.ico`, `icon.png`, `logo.png`, `manifest.json`, `api/`).

Responsibilities:

1. **Legacy redirects** (HTTP 301): old `/dashboard/log`, `/dashboard/history`, `/dashboard/coach`, `/dashboard/meal-plan`, `/dashboard/upload`, `/dashboard/food-checker`, `/dashboard/supplements` -> the current tabbed structure.
2. **Auth gate**: any `/dashboard/*` or `/onboarding` without a Supabase user -> `/auth/login`.
3. **Logged-in bounce**: authenticated users hitting `/auth/login` or `/auth/signup` -> `/dashboard`.
4. **Onboarding gate**: `/dashboard/*` requires `profiles.onboarding_complete = true`. Result is **cached in an httpOnly cookie for 1 hour** to avoid a DB query on every navigation.

The middleware uses `@supabase/ssr` `createServerClient` with the cookie shim to persist refreshed auth tokens onto the response.

---

## Data flows

### Voice log
```
User taps record -> MediaRecorder (WebM) -> /api/transcribe (Whisper)
-> transcript -> /api/analyse-log (Claude, 25s timeout)
-> {gutScore, summary, insights[], recommendations[], flagged}
-> persisted to logs(user_id, content, gut_score, ai_analysis, logged_at)
```

### Document analysis
```
Drag-drop / camera capture -> /api/upload-document (validateFile)
-> Supabase Storage `documents` bucket (private)
-> /api/analyse-document (Claude vision over the document URL)
-> {biomarkers, recommendations, ai_interpretation}
-> persisted to documents
```

### Meal plan
```
User requests plan -> server fetches profiles.gut_profile + recent logs + uploaded biomarkers
-> /api/meal-plan (Claude) -> 7-day structured plan + grocery list
-> persisted to meal_plans(user_id, week_start, plan, generated_at)
```

### AI Gut Coach
```
Unlock requires logCount >= 5 (see unlock-status.ts).
Plan check: Core 10 chats/mo, Pro unlimited.
Server builds the message with the user's profile + recent logs + last uploads.
Claude streams a response; turn is persisted (not user-visible chat history table today,
context is rebuilt from profile/logs each turn).
```

### Stripe billing
```
/api/stripe/checkout -> Checkout Session w/ metadata.{userId, plan}
-> Stripe redirect -> /dashboard?upgraded=1
-> /api/stripe/webhook receives events
   -> insert event.id into stripe_webhook_events (idempotency, 23505 unique-violation = duplicate)
   -> on checkout.session.completed: profiles.plan, stripe_customer_id, stripe_subscription_id,
      subscription_status='active', current_period_end; send upgrade email
   -> on customer.subscription.updated: resolve plan from price_id or amount, update status
      (cancel_at_period_end -> 'canceling'), store period_end
   -> on customer.subscription.deleted: revert to free, null subscription, status='canceled'
   -> on invoice.payment_failed: status='past_due', send payment-failed email
```

---

## Database

All tables enable Row-Level Security; user-owned tables have `auth.uid() = user_id` policies; server-only tables (`food_cache`, `stripe_webhook_events`) have a deny-all policy and are accessed exclusively via the service-role client.

| Table | Purpose | Notable columns |
|---|---|---|
| `profiles` | One row per auth user | `id (FK auth.users)`, `email`, `name`, `plan`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `current_period_end`, `gut_profile JSONB`, `avatar_id`, `onboarding_complete` |
| `logs` | Voice/text log entries | `user_id`, `type`, `content`, `audio_url`, `gut_score`, `ai_analysis JSONB`, `logged_at` |
| `documents` | Uploaded gut tests / labels | `user_id`, `type`, `file_url`, `file_name`, `ai_interpretation`, `biomarkers JSONB`, `recommendations JSONB`, `uploaded_at` |
| `meal_plans` | Weekly AI plans | `user_id`, `week_start`, `plan JSONB`, `generated_at` |
| `health_data` | Wearable / manual metrics | `user_id`, `source` (`apple_health`/`fitbit`/`oura`/`manual`), `metric`, `value`, `recorded_at` |
| `practitioner_access` | Read-only share tokens | `user_id`, `practitioner_email`, `practitioner_name`, `access_token (unique)`, `is_active`, `last_accessed_at` |
| `food_cache` | Edamam response cache | `query_normalized PK`, `food_data JSONB`, `hit_count`, `created_at`, `last_accessed_at`. **Deny-all RLS, server-only.** |
| `stripe_webhook_events` | Webhook idempotency | `event_id PK`, `event_type`, `processed_at`. **Deny-all RLS, server-only.** |

### Indexes

| Index | Where | Purpose |
|---|---|---|
| `idx_logs_user_date` | `logs(user_id, logged_at DESC)` | Dashboard + history hot path |
| `idx_documents_user_date` | `documents(user_id, uploaded_at DESC)` | Upload + supplements + report queries |
| `idx_health_data_user_date` | `health_data(user_id, recorded_at DESC)` | Recent metrics |
| `idx_practitioner_token` | `practitioner_access(access_token)` | Token lookup |
| `idx_food_cache_created_at` | `food_cache(created_at)` | TTL pruning |
| `idx_stripe_webhook_events_processed_at` | `stripe_webhook_events(processed_at)` | Cleanup queries |

### Cascade behaviour

`logs`, `documents`, `meal_plans`, `health_data`, `practitioner_access` all `ON DELETE CASCADE` from `profiles` -- account deletion is clean.

### Storage

One bucket: `documents`. Private. Authenticated users can read/write under their own UID prefix. Public URLs are not used; the API route signs and serves uploads.

---

## AI architecture

### Models in production

| Task | Model | Why |
|---|---|---|
| Voice transcription | OpenAI Whisper | Best speech-to-text accuracy |
| Log analysis, food/photo analysis, document interpretation, meal plans, coach, daily insights, doctor summary, supplements, patterns, weekly/monthly reports | Anthropic `claude-sonnet-4-20250514` | Strong reasoning, structured-output-friendly, vision-capable |

The Anthropic model id is centralised in `src/lib/anthropic.ts` (`CLAUDE_MODEL`). Update once, propagates everywhere.

### Safety + reliability primitives

- **`aiAbort()`** -- 25-second AbortController timeout on every Anthropic call. Hung calls return `504 Analysis timed out`.
- **`extractJsonObject()`** -- balanced-bracket extraction. Avoids the classic greedy-regex JSON-parse failure when the model wraps JSON in prose.
- **Prompt-injection delimiters** -- every user-data-bearing prompt uses `[BEGIN USER DATA] ... [END USER DATA]` framing with explicit instructions that the bracketed content is data, not instructions.
- **Server-side context** -- analysis routes refetch profile + recent logs from Postgres rather than trusting client payloads.
- **Input truncation** -- `truncate()` caps log text at 2,000 chars, food queries at smaller limits.
- **Rate limiting** -- `rateLimit()` per-instance map, lazy 60s cleanup, e.g. `15/min/user` on log analysis. Suitable for Fluid Compute (instance reuse) but explicitly *not* a global distributed limit -- keep that in mind if you ever scale to many small regions.

### Output contract

Log analysis returns:
```json
{
  "gutScore": 1-10,
  "summary": "2-3 sentence plain English",
  "insights": ["...", "...", "..."],
  "recommendations": ["...", "..."],
  "flagged": true | false
}
```

`flagged: true` is the safety-net that surfaces "see a doctor" guidance in the UI when the model detects red-flag symptoms (blood, severe pain, rapid weight change, inability to eat/drink, gut score <3).

Full safety framework in [LLM_CRITICAL_THINKING_TRAINING.md](./LLM_CRITICAL_THINKING_TRAINING.md).

---

## Auth model

- **Provider:** Supabase Auth -- email + password, magic links, password reset.
- **Session:** SSR cookies via `@supabase/ssr`; refreshed on every request through middleware.
- **Service role:** `SUPABASE_SERVICE_ROLE_KEY` used **only** for server-only paths -- the Stripe webhook (writing `stripe_webhook_events` and updating `profiles`), the food cache, and other RLS-bypass cases.
- **Auto-confirm:** signups are auto-confirmed via `/api/auth/confirm` to remove activation friction. RLS is the data-isolation backstop, so spoofed addresses cannot reach other users' data.
- **Practitioner access:** token-based, no Supabase session. Validated against `practitioner_access(access_token, is_active=true)`; `last_accessed_at` is bumped on each view.

---

## Security model

- **Row-Level Security** on every user table; deny-all policies on server-only tables.
- **Stripe webhooks:** required `STRIPE_WEBHOOK_SECRET`, signature verified with `stripe.webhooks.constructEvent`. Idempotency via primary-key insert into `stripe_webhook_events`; unique-violation -> `200 {duplicate: true}`.
- **Cron secret:** `CRON_SECRET` is constant-time-compared on internal-only routes (`send-email`, `send-reminder`, `weekly-digest`, `monthly-report`) using a Web-API-only comparison (no Node `crypto`, edge-compatible).
- **File validation:** MIME, extension, and size enforced server-side per category (image / document / audio).
- **Open-redirect protection:** all post-auth redirects are validated against an allowlist via `isAllowedOrigin`.
- **Server actions body limit:** 10 MB (`next.config.ts`) for audio uploads.
- **Edge-compatible Web APIs:** no Node `crypto` or `Buffer` in the request hot paths -- runs cleanly on Fluid Compute.
- **Disclaimers:** every AI route avoids diagnostic claims and recommends professional consultation for flagged content (see `LLM_CRITICAL_THINKING_TRAINING.md`).

---

## External services

| Service | Purpose | Caching / cost notes |
|---|---|---|
| Anthropic | All text + vision AI | Capped via `aiAbort` (25s); plan-tiered usage limits gate volume. |
| OpenAI | Whisper transcription | 25 MB per request limit; audio capped client-side. |
| Edamam | Nutrition data | Postgres `food_cache` with 30-day TTL; service-role-only access; `hit_count` tracks reuse. |
| Stripe | Billing | Idempotent webhook; portal for self-serve. |
| Resend | Transactional email | Templates in `lib/email-templates.ts`; cron-triggered routes guarded by `verifyCronSecret`. |
| Supabase | Auth + Postgres + Storage | RLS + service-role separation. |

---

## Performance + reliability

- **Fluid Compute** -- Vercel default; instance reuse means our in-memory rate limiter actually works across requests.
- **DB hot paths indexed** -- logs and documents reads are `(user_id, date desc)` index scans, not seq scans.
- **Edamam cache** -- 30-day TTL on parsed food responses cuts API spend dramatically as repeat queries (e.g. "yogurt", "salmon") dominate.
- **Webhook idempotency** -- Stripe redelivery on transient 5xx no longer doubles emails or rewrites period_end.
- **Hero video** -- MP4 with `faststart`, eager preload, dark overlay; LCP-friendly.
- **AI timeouts** -- 25s ceiling prevents stuck function instances.
- **Service Worker** -- registered in `layout.tsx`; PWA manifest in `public/manifest.json`; standalone display.

---

## Key environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Edamam
EDAMAM_APP_ID=
EDAMAM_APP_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CORE_PRICE_ID=
STRIPE_PRO_PRICE_ID=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Internal
CRON_SECRET=
NEXT_PUBLIC_APP_URL=https://www.gutted.app
```

Setup walkthrough: [DEPLOYMENT.md](./DEPLOYMENT.md). Replication from scratch: [REPLICATION_GUIDE.md](./REPLICATION_GUIDE.md).
