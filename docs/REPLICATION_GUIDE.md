# Replication Guide

How to stand up a working copy of gutted. from scratch -- local dev to production deploy.

---

## Prerequisites

- **Node.js 20+** and **npm 9+**.
- **Git**.
- Accounts:
  - [Supabase](https://supabase.com) (free tier is fine for dev).
  - [Stripe](https://stripe.com) (test mode for dev).
  - [Anthropic](https://console.anthropic.com) (Claude Sonnet 4 access).
  - [OpenAI](https://platform.openai.com) (Whisper access).
  - [Resend](https://resend.com) (free tier -- 3,000 emails/mo).
  - [Edamam](https://developer.edamam.com) (free Food Database tier).
  - [Vercel](https://vercel.com) (Hobby tier for deploys).

---

## 1. Clone and install

```bash
git clone <repository-url>
cd gutted
npm install
```

Quick sanity:

```bash
npm run lint
npm run typecheck
```

Both should pass on a fresh clone.

---

## 2. Supabase

### Create the project

1. New project -> region close to your users -> strong DB password.
2. Note **Project URL**, **anon key**, **service-role key** (`Settings -> API`).

### Run migrations

Apply every file in `supabase/migrations/` in name order. Either:
- Paste each SQL file into the Supabase SQL editor and run, or
- `supabase db push` if you have the Supabase CLI linked to the project.

The current set covers: core schema (`profiles`, `logs`, `documents`, `meal_plans`), health-data integration, practitioner access tokens, subscription-status columns, food-cache, avatar id, Stripe webhook idempotency, and hot-path indexes on logs + documents. RLS is enabled inside the migrations.

### Auth

1. `Authentication -> Providers`: enable **Email + Password**. **Disable email confirmation** -- the app auto-confirms via `/api/auth/confirm`.
2. `Authentication -> URL Configuration`:
   - Site URL: your dev URL (e.g. `http://localhost:3000`) for local; the production domain in production env.
   - Redirect URLs: add `http://localhost:3000/auth/callback` and your production `*/auth/callback`.

### Storage

1. `Storage -> New bucket` named `documents`, **private**.
2. Policy: authenticated users can `INSERT` and `SELECT` under `documents/{auth.uid}/*`.

---

## 3. Stripe

### Products

Create two recurring products in the Stripe dashboard:

- **Core** -- $14/month.
- **Pro** -- $29/month.

Capture each `price_...` id.

### Code wiring

The plan-feature mapping lives in [`src/lib/stripe.ts`](../src/lib/stripe.ts). The price ids are read from environment variables (`STRIPE_CORE_PRICE_ID`, `STRIPE_PRO_PRICE_ID`) -- you usually won't need to edit code, just env vars.

### Webhook

1. `Developers -> Webhooks -> Add endpoint`. URL `https://<your-domain>/api/stripe/webhook`.
2. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
3. Capture the signing secret -> `STRIPE_WEBHOOK_SECRET`.

For local development, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the printed `whsec_...` as your local `STRIPE_WEBHOOK_SECRET`.

---

## 4. AI keys

### Anthropic
- Generate a key in the Anthropic console; ensure your account can access `claude-sonnet-4-20250514` (the model id in [`src/lib/anthropic.ts`](../src/lib/anthropic.ts)).
- `ANTHROPIC_API_KEY=sk-ant-...`.

### OpenAI
- Generate a key with Whisper access (transcription is the only OpenAI usage).
- `OPENAI_API_KEY=sk-...`.

---

## 5. Other services

### Resend
- Generate an API key.
- (Optional but recommended) verify the sending domain and add the SPF/DKIM/DMARC records in DNS.
- `RESEND_API_KEY=re_...`, `RESEND_FROM_EMAIL=hello@<your-domain>`.

### Edamam
- Sign up for the **Food Database API**; capture **App ID** + **App Key**.
- `EDAMAM_APP_ID=...`, `EDAMAM_APP_KEY=...`.

### Cron secret
- Generate any long random string. This guards the cron-only routes (`send-reminder`, `weekly-digest`, `monthly-report`, etc.).
- `CRON_SECRET=<long-random>`.

---

## 6. Environment file

Create `.env.local` at the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Edamam
EDAMAM_APP_ID=...
EDAMAM_APP_KEY=...

# Stripe (test mode locally)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CORE_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@yourdomain.com

# Internal
CRON_SECRET=<long-random>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In production, mirror the same set into Vercel project env vars (with live Stripe keys + production domain).

---

## 7. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Smoke test the loop

1. Sign up with email + password -> auto-confirm -> onboarding wizard.
2. Complete onboarding (4 steps) -> dashboard.
3. Voice-log a symptom -> transcript -> AI score and insights.
4. Upload a sample image (a clear food label or a screenshot of a lab report) -> AI interpretation.
5. With dietary restrictions set, generate a meal plan -> 7-day plan + grocery list.
6. Click upgrade -> Stripe Checkout (use test card `4242 4242 4242 4242`) -> back to dashboard with Core/Pro features unlocked.
7. Stripe CLI shows `checkout.session.completed`; profile row reflects `plan`, `subscription_status='active'`, and `current_period_end`.

---

## 8. Deploy to production

1. Push to GitHub.
2. Import the repo into Vercel; framework auto-detects as Next.js.
3. Add **all** env vars from your `.env.local` -- with live Stripe keys, the production Supabase project, and `NEXT_PUBLIC_APP_URL=https://www.gutted.app`.
4. Deploy.

### After first deploy

1. Add the production webhook endpoint (`https://www.gutted.app/api/stripe/webhook`) in the Stripe dashboard and grab the new `whsec_...` -> `STRIPE_WEBHOOK_SECRET`.
2. Update Supabase Auth redirect URLs to include the production domain.
3. Confirm Resend sending domain is verified.
4. Configure cron schedules to hit `send-reminder`, `weekly-digest`, `monthly-report` with the `x-internal-secret: $CRON_SECRET` header.
5. Run the smoke test on the production URL.

---

## Project structure (reference)

```
gutted/
├── public/                   # Static assets (logo, icon, hero MP4, manifest, sw.js)
├── src/
│   ├── app/                  # Next.js App Router (pages + API routes)
│   ├── components/           # React components (UI, content, avatars)
│   ├── hooks/
│   ├── lib/                  # Clients, helpers, plan limits, security, AI helpers
│   └── middleware.ts
├── supabase/
│   └── migrations/           # SQL migrations (apply in name order)
├── docs/                     # Project documentation (this folder)
├── .github/workflows/        # CI (lint + typecheck)
├── package.json
├── next.config.ts
├── tsconfig.json
└── .env.local                # Your environment (never committed)
```

---

## Common setup gotchas

| Issue | Fix |
|---|---|
| `NEXT_PUBLIC_*` vars seem missing | They're inlined at build time -- restart `next dev` after editing `.env.local`. |
| Supabase queries return empty / RLS errors | Run all migrations in order; confirm RLS policies attached to tables (`profiles`, `logs`, `documents`, `meal_plans`, `health_data`, `practitioner_access`). |
| Whisper transcription fails | Audio capped at 25 MB; OpenAI key must have Whisper access; voice recorder records WebM. |
| Document analysis fails | Bucket `documents` must exist; upload returns a URL; Claude vision call has a 25s timeout. |
| Stripe webhook 400 locally | Use the `whsec_` printed by `stripe listen`, not the dashboard one. |
| Plan doesn't update after upgrade | The webhook is required -- without it `checkout.session.completed` never reaches the app. Check Stripe dashboard webhook deliveries. |
| Onboarding loop | The middleware caches `onboarding_complete` in an httpOnly cookie for 1 hour -- if you flip the flag manually in the DB, clear cookies before testing. |
| Daily reminder / digest never sends | Cron route returns 401 unless `x-internal-secret: $CRON_SECRET` is sent. |

For deeper troubleshooting: [COMMON_ISSUES.md](./COMMON_ISSUES.md). Architectural detail: [ARCHITECTURE.md](./ARCHITECTURE.md). What lives where in code: [FEATURES.md](./FEATURES.md).
