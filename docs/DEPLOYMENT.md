# Deployment

How gutted. is built, configured, and shipped to production.

---

## Infrastructure overview

| Layer | Provider | Purpose |
|---|---|---|
| Application | Vercel (Fluid Compute, Node runtime) | Next.js 16 hosting, serverless API routes, CDN |
| Database / Auth / Storage | Supabase (Postgres + Auth + Storage) | App data, sessions, file uploads |
| Payments | Stripe | Subscription billing, customer portal, webhooks |
| Email | Resend | Transactional + cron-triggered emails |
| AI -- text + vision | Anthropic Claude | All non-audio AI |
| AI -- audio | OpenAI Whisper | Voice transcription |
| Nutrition | Edamam Food Database API | Cached server-side in Postgres |

Hosting note: Vercel **Fluid Compute** is the default. Functions run on the Node.js runtime (Whisper + the Anthropic SDK do not require edge), with instance reuse so the in-process rate limiter in `src/lib/security.ts` actually amortises.

---

## Environment variables

All required values for production:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>     # server-only, bypasses RLS

# AI
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Edamam
EDAMAM_APP_ID=<app-id>
EDAMAM_APP_KEY=<app-key>

# Stripe
STRIPE_SECRET_KEY=sk_live_...                    # use sk_test_... in preview/staging
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CORE_PRICE_ID=price_...                   # Stripe price object id for Core ($14)
STRIPE_PRO_PRICE_ID=price_...                    # Stripe price object id for Pro  ($29)

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@gutted.app

# Internal
CRON_SECRET=<long-random>                        # constant-time-compared on cron-only routes
NEXT_PUBLIC_APP_URL=https://www.gutted.app
```

Notes:
- `NEXT_PUBLIC_*` values are exposed to the browser -- never put a secret behind that prefix.
- `SUPABASE_SERVICE_ROLE_KEY` is the master key -- it MUST stay server-side. Used only by the Stripe webhook, food cache, and the few other RLS-bypass paths.
- `STRIPE_*_PRICE_ID` env vars and the `PLANS` config in [`src/lib/stripe.ts`](../src/lib/stripe.ts) must agree -- the webhook resolves a plan from the price id (or amount) on `customer.subscription.updated`.

---

## Build & run

| Command | What it does |
|---|---|
| `npm install` | Install deps |
| `npm run dev` | Start the Next dev server on `:3000` |
| `npm run lint` | ESLint (Next.js core-web-vitals + TS rules) over `src/` |
| `npm run typecheck` | `tsc --noEmit` (added to CI) |
| `npm run build` | Production compile + optimisation |
| `npm run start` | Run the production build locally |

CI runs lint + typecheck on every PR (see `.github/workflows/`).

---

## Vercel deployment

1. Connect the GitHub repo to Vercel.
2. Framework preset: **Next.js**. Output dir: `.next` (auto). Node runtime (default).
3. Add every env var from the list above. Mirror across **Production**, **Preview**, and **Development** scopes -- with test Stripe keys on Preview/Development.
4. Push to `main` -> production deploy. PRs -> unique preview URLs.

Production URL: **https://www.gutted.app**.

`next.config.ts` configures:
- `images.remotePatterns` -> the Supabase project hostname for CDN-served document images.
- `experimental.serverActions.bodySizeLimit = '10mb'` -> required for audio uploads from the voice recorder.

---

## Supabase setup

### Create the project

1. New Supabase project -> pick a region close to your users.
2. Save the **Project URL**, **anon key**, and **service-role key** into Vercel env vars.

### Database

Run migrations in `supabase/migrations/` in order. As of today the set is:

```
20240101000001_initial.sql                     -- profiles, logs, documents, meal_plans + RLS
20240101000002_integrations.sql                -- health_data + index
20240101000003_practitioner.sql                -- practitioner_access + token index
20240101000004_subscription_status.sql         -- profiles.subscription_status, current_period_end
20260416000001_food_cache.sql                  -- food_cache (deny-all RLS)
20260422000001_avatar_choice.sql               -- profiles.avatar_id
20260424000001_stripe_webhook_idempotency.sql  -- stripe_webhook_events (deny-all RLS)
20260424000002_logs_documents_indexes.sql      -- hot-path indexes for logs + documents
```

> The earlier file `004_subscription_status.sql` is a non-timestamped duplicate of `20240101000004_subscription_status.sql`. The timestamped version is canonical; both are idempotent (`add column if not exists`) so applying both is safe.

You can run these via the Supabase SQL editor or `supabase db push` if you have the CLI linked.

### Auth

1. Enable **Email + Password**. Disable email confirmation (we auto-confirm via `/api/auth/confirm`).
2. (Optional) enable additional providers if/when needed -- the codebase is provider-agnostic via Supabase Auth.
3. Set redirect URLs:
   - `https://www.gutted.app/auth/callback`
   - `http://localhost:3000/auth/callback`
4. Site URL = the production domain.

### Storage

1. Create a bucket named `documents`. **Private**.
2. Policy: authenticated users can `INSERT` and `SELECT` under `documents/{auth.uid}/*`.
3. The app does not use signed-public URLs externally -- access is server-mediated.

---

## Stripe setup

### Products

In the Stripe Dashboard, create two recurring products:

| Plan | Price | Interval |
|---|---|---|
| Core | $14.00 | monthly |
| Pro | $29.00 | monthly |

Capture each `price_...` id into the matching `STRIPE_*_PRICE_ID` env vars.

### Webhook

1. Endpoint: `https://www.gutted.app/api/stripe/webhook`.
2. Listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
3. Capture the signing secret (`whsec_...`) -> `STRIPE_WEBHOOK_SECRET`.

The webhook handler is **idempotent** -- it dedups by `event.id` via the `stripe_webhook_events` table. Stripe redeliveries on transient 5xx return `200 {duplicate: true}` rather than re-running the side effects.

### Checkout flow

- `/api/stripe/checkout` creates a Checkout Session with `metadata.{userId, plan}`.
- Success URL: `/dashboard?upgraded=1`. Cancel: `/dashboard`.

### Local webhook testing

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` into your local `.env.local`.

---

## Domain + DNS

1. Add the domain in Vercel -> Settings -> Domains.
2. DNS: `A` record to Vercel for the apex, `CNAME` to `cname.vercel-dns.com` for `www`.
3. SSL is provisioned automatically.
4. Set `NEXT_PUBLIC_APP_URL` to the canonical domain (`https://www.gutted.app`).

For email:
1. Verify the sending domain in Resend.
2. Add the SPF / DKIM / DMARC records Resend gives you.
3. Set `RESEND_FROM_EMAIL` to a verified address.

---

## Monitoring + maintenance

- **Vercel** -- automatic health checks, function logs, runtime metrics.
- **Supabase** -- DB metrics, RLS-policy audits, storage usage.
- **Stripe** -- webhook delivery dashboard (failed deliveries are the highest-priority alert).
- **Resend** -- send analytics + bounce reports.
- **AI providers** -- usage and spend dashboards on Anthropic and OpenAI consoles.

### Cron jobs

Vercel cron (or any external scheduler) hits these with the `x-internal-secret: $CRON_SECRET` header:

- `POST /api/send-reminder` -- daily reminder emails to opted-in Core/Pro users.
- `POST /api/weekly-digest` -- weekly score + insight digest.
- `POST /api/monthly-report` -- monthly progress report.

Without `CRON_SECRET`, the route returns 401 (no debug info).

### Cost considerations (rough order of magnitude)

| Service | Free tier | Production budget |
|---|---|---|
| Vercel | Hobby | Pro ($20/mo) once traffic warrants |
| Supabase | Free (500MB DB, 1GB storage, 50K MAU) | Pro ($25/mo) |
| Stripe | -- | 2.9% + $0.30 / transaction |
| Anthropic | Pay-per-token | ~$0.01-0.05 per analysis at typical prompt sizes |
| OpenAI | Pay-per-token | Whisper is cheap (~$0.006/min) |
| Resend | 3,000/mo free | $20/mo at 50K |
| Edamam | 100 calls/day free | Cached -- effectively flat at scale |

Real unit-economics targets are in [OUTCOMES.md](./OUTCOMES.md).

---

## Rollback strategy

- **Code:** every deploy is a Vercel immutable snapshot -- promote a prior deploy from the dashboard for instant rollback.
- **Database:** Supabase point-in-time recovery (Pro tier). Migrations are additive and idempotent (e.g. `add column if not exists`); avoid destructive migrations in the repo.
- **Stripe:** never delete a price id; create a new one and update env vars. The webhook resolves both by id and by amount, so a price change does not lose paid users.

---

## What to verify after a deploy

1. `/auth/signup` round-trips -> onboarding -> dashboard.
2. Voice log -> Whisper -> Claude -> score lands in `logs`.
3. Document upload -> `documents` row + biomarkers populated.
4. Meal plan generation -> `meal_plans` row.
5. Stripe Checkout completes; webhook flips `plan`, `subscription_status='active'`, `current_period_end` set; upgrade email sent.
6. Stripe portal redirect works.
7. Practitioner share token loads `/practitioner/[token]` read-only view.
8. `npm run lint` and `npm run typecheck` pass in CI.

Full troubleshooting reference in [COMMON_ISSUES.md](./COMMON_ISSUES.md). Setting up a fresh environment from zero: [REPLICATION_GUIDE.md](./REPLICATION_GUIDE.md).
