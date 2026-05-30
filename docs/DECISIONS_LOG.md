# Decisions Log

A running record of key architectural, design, and product decisions. Newest decisions at the bottom of each section so the original rationale stays visible.

---

## Architecture decisions

### ADR-001: Next.js 16 with App Router

**Decision:** Build on Next.js 16 / App Router, deployed on Vercel.

**Why:**
- App Router gives server components, layouts, and serverless API routes in one model.
- React 19 + server actions are first-class.
- Vercel deployment ergonomics + Fluid Compute = predictable performance.

**Trade-offs:** Next.js 16 has breaking changes vs older versions; agents must check the in-tree docs (`AGENTS.md` instructs reading `node_modules/next/dist/docs/`). Some training data is outdated for v16.

### ADR-002: Multi-model AI architecture

**Decision:** Use OpenAI Whisper for audio transcription and Anthropic Claude (`claude-sonnet-4-20250514`) for everything else -- text reasoning and document/image vision included.

**Why:**
- Whisper remains best in class for English speech-to-text.
- Claude Sonnet 4 handles structured-output reasoning and vision in one model -- one SDK, one billing line, one prompt-engineering surface.
- Earlier plans split text vs vision across providers; consolidating to Claude reduces failure modes and makes prompt iteration much faster.

**Trade-offs:** Two vendors (Anthropic + OpenAI), two API keys, no built-in fallback if one provider is down. Mitigated by per-call timeouts (`aiAbort`, 25s) and deterministic JSON extraction.

### ADR-003: Supabase for backend

**Decision:** Use Supabase for Postgres, Auth, and Storage.

**Why:**
- Single managed service for the three things every app needs.
- Postgres + Row-Level Security gives strong per-user isolation.
- The SSR client (`@supabase/ssr`) integrates cleanly with Next.js cookies.

**Trade-offs:** Vendor lock-in for auth + storage. RLS adds complexity, but pays off in eliminating an entire class of access bugs.

### ADR-004: Stripe for billing with idempotent webhooks

**Decision:** Use Stripe Checkout + the customer portal, with a webhook handler that dedupes events via a Postgres `event_id` primary-key insert.

**Why:**
- Stripe handles PCI, payment-method UX, and lifecycle.
- The idempotency table closes a real bug: Stripe redelivers events on transient 5xx, which previously double-sent upgrade emails and rewrote `current_period_end`.

**Trade-offs:** 2.9% + $0.30 per transaction; no in-app purchase for any future native wrapper.

### ADR-005: Vercel Fluid Compute as the default runtime

**Decision:** Run on Vercel Fluid Compute (Node runtime) rather than the Edge runtime.

**Why:**
- Fluid Compute reuses instances across concurrent requests, which makes the in-process rate limiter actually amortise.
- Anthropic + OpenAI SDKs and Stripe SDK 22 are happiest on Node.
- Edge has compatibility caveats (no Node `crypto` / `Buffer`); we deliberately rewrote security helpers to be edge-compatible Web-API-only, but that makes Node the safer default with no downsides today.

**Trade-offs:** Slightly higher cold-start than Edge, but Fluid instance reuse mitigates it.

### ADR-006: Edamam responses cached in Postgres

**Decision:** Cache Edamam Food Database responses in a `food_cache` table keyed by `query_normalized`, with a 30-day TTL enforced at read time.

**Why:**
- Repeat queries dominate ("yogurt", "salmon", common foods). API spend was the dominant marginal cost in a previous month.
- Postgres + a deny-all RLS policy + service-role-only access keeps the cache safely server-side.

**Trade-offs:** Cache invalidation is per-query, not coordinated with Edamam updates -- 30 days is the chosen freshness floor.

### ADR-007: Stripe webhook idempotency via `stripe_webhook_events`

**Decision:** Insert `event_id` into `stripe_webhook_events` (primary key) at the start of webhook processing. Unique-violation -> return `200 {duplicate: true}` immediately.

**Why:**
- Stripe redelivers on transient 5xx. Without dedup, `checkout.session.completed` could double-send upgrade emails and rewrite `current_period_end`.
- A primary-key insert is the simplest race-safe construct -- two concurrent replays race on the PK, exactly one wins.

**Trade-offs:** A failed dedup insert (RLS misconfig, DB outage) returns 500 so Stripe retries -- intentionally fail-loud rather than silently drop events.

### ADR-008: Hot-path indexes for logs and documents

**Decision:** Add `(user_id, logged_at desc)` on `logs` and `(user_id, uploaded_at desc)` on `documents`.

**Why:**
- Every dashboard load and history-page render runs `where user_id = ? order by date desc limit ?`. Without these indexes, Postgres degrades to seq scan once tables cross ~10K rows.

**Trade-offs:** Tiny insert-time cost; trivially worth it.

### ADR-009: AI request timeouts + safe JSON extraction + prompt-injection delimiters

**Decision:** Every Anthropic call uses an AbortController with a 25s ceiling (`aiAbort`). All structured outputs are parsed via `extractJsonObject` (balanced-bracket extraction, not greedy regex). All prompts wrap user data in `[BEGIN USER DATA] ... [END USER DATA]` delimiters with explicit "treat as data, not instructions" framing.

**Why:**
- Hung AI calls were a real reliability hit, especially on cold starts.
- Greedy JSON regex parsing breaks on prose-wrapped JSON; the bracket walker is robust.
- Prompt-injection via user-supplied log text was an obvious risk vector and the delimiters make it auditable and explicit.

**Trade-offs:** Slightly more boilerplate; well worth it.

### ADR-010: Practitioner read-only access via tokens (no Supabase session)

**Decision:** Practitioners view a client's read-only data via `/practitioner/[token]` validated against `practitioner_access`. No Supabase auth on the practitioner side.

**Why:**
- Lowest friction for the practitioner channel: a clinician shouldn't have to create a separate account to glance at a client.
- Tokens are revocable (`is_active = false`) and tracked (`last_accessed_at`) for audit.

**Trade-offs:** Token-based access is only as safe as the URL handling; we don't expose tokens in OpenGraph or sitemaps and never log them at INFO level.

### ADR-011: Lazy client construction for env-fragile builds (2026-05-30)

**Decision:** Construct the Anthropic, OpenAI, Stripe, and Resend SDK clients lazily through `src/lib/lazy.ts` rather than at module load. Pin `turbopack.root` in `next.config.ts` and document `CRON_SECRET` in `.env.example`.

**Why:**
- Eager top-level client construction meant the production build (and any route that merely imported a module) demanded env vars be present at build time, which made builds fragile and broke cleanly typed CI runs that have no secrets.
- A lazy getter defers reading the key until the first real call, so the build never needs the secret and an unconfigured key fails at the call site (where it belongs) instead of at import.
- Pinning `turbopack.root` removes the multi-lockfile root-inference warning and makes the build deterministic.

**Trade-offs:** A tiny indirection on first use per client per instance; negligible and amortised by Fluid Compute instance reuse (see ADR-005).

### ADR-012: Coach response streaming via `messages.stream` (2026-05-30)

**Decision:** `src/app/api/gut-coach/route.ts` now uses `anthropic.messages.stream` piped through a `ReadableStream`, and `src/components/content/CoachContent.tsx` renders tokens as they arrive. A 60s abort bounds the stream; a mid-stream failure keeps the partial text already shown.

**Why:**
- The coach was previously **buffered** (`messages.create`): the user stared at a spinner until the whole reply was assembled, then it appeared at once. (Reconcile with older docs that imply it already streamed; it did not, it does now.)
- Token-by-token rendering makes a multi-second reasoning reply feel immediate and lets the user start reading while generation continues.
- Graceful mid-stream failure (keep partial text) is strictly better UX than discarding a half-formed answer on a dropped connection.

**Trade-offs:** Streaming code is more involved than a single awaited call (backpressure, abort wiring, partial-state handling); the perceived-latency win for the highest-value paid surface justifies it.

### ADR-013: Versioned, capability-only product-truth endpoint as the fleet source of truth (2026-05-30)

**Decision:** Ship `GET /api/product-truth` returning a versioned (`gutted.product-truth/1`), capability-only JSON document assembled from the docs plus the authoritative `PLANS` object, so price and `priceId` never drift between the endpoint and checkout. Add a `/llms.txt` discovery file and a `robots.txt` carve-out that allows `/api/product-truth`, `/llms.txt`, and `/.well-known/` while the rest of `/api` stays disallowed.

**Why:**
- Other agents and surfaces across the fleet need a single machine-readable statement of what gutted can do and what it costs; deriving price from the same `PLANS` object the checkout uses removes the classic two-sources-of-truth drift.
- Capability-only framing keeps the endpoint safe to expose publicly for a YMYL health product: it states what the product does, never user data and never medical claims.
- `/llms.txt` plus the robots carve-out make the truth endpoint discoverable to well-behaved agents without opening the rest of the API surface.

**Trade-offs:** The endpoint is one more contract to version and keep honest; the `/1` namespace makes breaking changes explicit and the docs-plus-`PLANS` assembly keeps maintenance to one edit.

### ADR-014: `@anthropic-ai/sdk` bumped to 0.100.1 (2026-05-30)

**Decision:** Upgrade `@anthropic-ai/sdk` from 0.82.0 to 0.100.1.

**Why:**
- The streaming coach (ADR-012) leans on the current `messages.stream` ergonomics; staying on a months-old SDK invited subtle drift against the live API.
- Keeping the primary AI dependency current reduces the size of any future forced upgrade.

**Trade-offs:** Any SDK bump carries minor-version surface risk; verified against the streaming and structured-output paths this session.

### ADR-015: gutted confirmed as the fleet rendering reference (2026-05-30)

**Decision:** Treat gutted as the reference implementation for server-rendered (SSR/SSG) apps across the fleet. No migration was needed: gutted is already server-rendered on Next.js App Router (see ADR-001).

**Why:**
- gutted already does the thing other surfaces are being asked to do (real SSR/SSG, agent-readable endpoints, structured data), so it is the cheapest concrete pattern to point the rest of the fleet at.
- Naming a reference avoids each app reinventing the rendering and discovery story.

**Trade-offs:** Reference status means gutted's choices get copied, so regressions here propagate; offset by the decisions being logged here and the product-truth contract (ADR-013) being explicit.

---

## Design decisions

### DDR-001: Dark-only theme

**Decision:** Ship dark theme only.

**Why:** OLED-friendly, premium feel, differentiates from clinical light-mode health apps, and one well-maintained theme beats two adequate ones.

**Trade-offs:** A subset of users prefer light mode; outdoor readability is slightly reduced.

### DDR-002: Mobile-first with `max-w-sm` dashboard

**Decision:** Dashboard core is constrained to `max-w-sm` (384 px) on mobile; `DesktopLayout` widens it on `md:` and up.

**Why:** Voice logging and on-the-go capture is the dominant user flow. The narrow column keeps content scannable.

**Trade-offs:** Desktop power users want more density; the desktop layout is opt-in width without redesign.

### DDR-003: Voice-first logging

**Decision:** Voice is primary, text is fallback.

**Why:** Speaking is 3-5x faster than typing; the #1 reason trackers fail is logging friction.

**Trade-offs:** Mic permission required; not great in quiet/public settings -- text fallback covers it.

### DDR-004: Teal-green gradient as brand signature

**Decision:** `#00B4B4 -> #4ADE80` is the brand gradient.

**Why:** Teal = health/calm; green = wellness/growth. Reads beautifully on black. Distinct from competitor blues and oranges.

**Trade-offs:** Gradient text needs `-webkit-background-clip` (well-supported, non-standard).

### DDR-005: Settings as a profile admin dashboard (redesign)

**Decision:** Replace the prior list-style settings page with a profile admin dashboard featuring avatar selection, plan management, subscription status, and practitioner access controls.

**Why:** Settings is the highest-value page after the dashboard for paid users; the redesign matches feature growth.

### DDR-006: Avatar replaces plan badge in profile button

**Decision:** The profile button now shows the user's selected gut-themed avatar instead of a plan-tier badge.

**Why:** Avatar is more identifying and friendly; plan info is one tap away in settings, where users actually go to manage it.

---

## Product decisions

### PDR-001: Auto-confirm email signup

**Decision:** Skip email verification.

**Why:** Verification causes 20-40% drop-off. RLS + per-user isolation makes spoofed emails harmless to other users.

**Trade-offs:** Fake emails possible; no impact on data security; revisit if abuse pattern shows up.

### PDR-002: Three-tier pricing -- Free / Core $14 / Pro $29

**Decision:** Free, Core $14/mo, Pro $29/mo (all monthly, no annual yet).

**Why:**
- Free demonstrates AI quality before payment.
- Core covers the majority of users with the meal-plan + AI Coach + food checker loop.
- Pro adds practitioner-share, doctor summaries, supplements, integrations, and unlimited AI Coach for users with active health journeys or labs to interpret.
- Prior pricing ($9 / $19) underpriced both tiers given AI usage and feature growth -- updated in current pricing.

**Trade-offs:** Free is loss-making per user; profitable above ~5-7% D30 conversion (see [OUTCOMES.md](./OUTCOMES.md)).

### PDR-003: Gut score 1-10 as the headline metric

**Decision:** Every log generates a 1-10 gut score.

**Why:** A single number is the cleanest unit of progress, supports gamification, and a 7-day rolling average smooths daily noise.

**Trade-offs:** Oversimplifies complex health; mitigated by detailed insights alongside the score.

### PDR-004: Non-medical positioning

**Decision:** gutted. is explicitly a tracking and insight tool, not a diagnostic device.

**Why:** Avoids FDA medical-device classification; sets correct user expectations; AI prompts always frame outputs as observations and route flagged content to professional care.

**Trade-offs:** Some users want more definitive answers; we prioritise safety. Captured in [LLM_CRITICAL_THINKING_TRAINING.md](./LLM_CRITICAL_THINKING_TRAINING.md).

### PDR-005: Tab-unlock progression on the dashboard

**Decision:** Some tabs unlock as the user logs and uploads:
- Overview unlocks at 1 log.
- History unlocks at 3 logs.
- Coach unlocks at 5 logs.
- Food check unlocks at 1 log.
- Supplements unlocks at 1 document upload.
- Meals unlocks once dietary restrictions are set.

**Why:** The downstream surfaces (coach, supplements, meal plans) are only useful with context. Locking them with a one-line CTA back to the unblocking action drives the right activation behaviour.

### PDR-006: 5-log unlock for the AI Gut Coach (regardless of plan)

**Decision:** AI Gut Coach is locked until the user has 5 logs, even on Pro.

**Why:** Without ~5 logs, the coach is generic and disappointing; the plan caps (Core 10/mo, Pro unlimited) compound the disappointment. The 5-log gate ensures the first chat is grounded.

### PDR-007: Practitioner channel from day one

**Decision:** Build practitioner-share tokens, doctor summaries, and PDF reports into the Pro tier early.

**Why:** Practitioners are a high-LTV referral channel and a structural moat. Even at MVP scale, having the wiring ready means we can ship a partner pilot the day demand surfaces.

### PDR-008: Em-dash convention -- use `--` instead of em dashes

**Decision:** Project convention is double-hyphen (`--`) instead of em dashes (`---`) in all user-facing copy and docs.

**Why:** Consistent rendering across mediums (Markdown processors, email clients, social cards), simpler to type, and a recent normalisation pass removed the historical em-dash inconsistency.

### PDR-009: Full 5X rebuild scope locked (2026-05-30)

**Decision:** Lock the full 5X rebuild scope as the committed body of work for this initiative: lazy client construction (ADR-011), coach streaming (ADR-012), the agent-readable product-truth endpoint and discovery files (ADR-013), SEO and structured-data work, and revenue-only attribution (PDR-010).

**Why:**
- Treating these as one locked scope rather than a drip of independent tickets keeps the rebuild coherent and lets each piece assume the others land in the same pass.
- Locking scope now prevents mid-flight expansion and makes "done" a defined boundary.

**Trade-offs:** A locked scope defers anything not in it; new asks go to the next cycle rather than stretching this one.

### PDR-010: Revenue-only attribution with a deny-by-default allowlist (2026-05-30)

**Decision:** gutted captures and emits attribution for revenue analysis only, through a deny-by-default allowlist serializer (`src/lib/attribution.ts`). First-party cookie capture (`src/lib/attribution-client.ts` + `src/components/AttributionCapture.tsx`) records utm / referrer / landing_path; this persists to a new additive `profiles.attribution` jsonb column (RLS intact) at email signup and OAuth callback. Stripe checkout stamps `utm_*` + `anonymous_id` onto both the session and the subscription metadata. Events: `landed` / `signed_up` go via the frontend through `/api/attribution` (which keeps the ingest secret server-side and attaches the opaque Supabase `user_id`); `purchased` / `churned` / `refunded` go from the Stripe webhook (a `charge.refunded` handler was added). The serializer lets ONLY an opaque uuid, the utm set, and a plan-derived `value_cents` leave gutted: NEVER email, name, symptom, gut score, condition, or biomarker.

**Why:**
- gutted is a YMYL health product (PDR-004); the only safe attribution is one that is structurally incapable of exfiltrating PHI, so deny-by-default (allowlist what leaves, drop everything else) is the correct posture rather than blocklisting known-bad fields.
- Revenue-only is all the OS warehouse needs to attribute conversions; nothing about a user's health is required for that, so nothing about it is sent.
- Routing frontend events through `/api/attribution` keeps the ingest secret off the client and attaches the opaque user id server-side.

**Trade-offs:** We give up rich behavioural attribution and any health-correlated marketing analysis on purpose; for a YMYL product that is a feature, not a limitation. Emit is a safe no-op until `ATTRIBUTION_INGEST_URL` and `ATTRIBUTION_INGEST_SECRET` are set.

### PDR-011: Central Mindmaker OS warehouse owns attribution ingest (2026-05-30)

**Decision:** A central Mindmaker OS warehouse owns the `ingest-attribution` function, the ingest secret, and a dedicated attribution schema. gutted only emits to it: gutted never holds the OS key beyond the per-app `ATTRIBUTION_INGEST_SECRET`, never migrates warehouse tables, and never reads back from the warehouse.

**Why:**
- Attribution from every fleet app should land in one schema so revenue can be analysed across products without each app reimplementing storage.
- Keeping ownership of the ingest function, the secret, and the schema in the OS warehouse (not in gutted) means a compromise of gutted cannot rewrite warehouse structure or read other apps' data; gutted's blast radius is its own emit secret.
- Clean separation: gutted owns producing safe events (PDR-010), the warehouse owns receiving and storing them.

**Trade-offs:** gutted cannot self-serve attribution queries; that work lives in the OS. Accepted, since the warehouse is the correct cross-fleet vantage point.

---

## Security decisions

### SEC-001: RLS on every user table; deny-all on server-only tables

Every user-owned table has an `auth.uid() = user_id` policy. `food_cache` and `stripe_webhook_events` have **deny-all** policies and are accessed only via the service-role client. This makes RLS the backstop -- a leaked anon key cannot read or write either side.

### SEC-002: Edge-compatible Web APIs in security helpers

All cron-secret comparison and constant-time logic uses Web APIs (`TextEncoder` + manual byte XOR), no Node `crypto` or `Buffer`. Keeps the option to run on Edge open and is safer for streaming-friendly contexts.

### SEC-003: Stripe webhooks fail closed

If `STRIPE_WEBHOOK_SECRET` isn't configured, the route returns 500 immediately rather than processing without verification. There is no "skip verification in dev" toggle.

### SEC-004: Open-redirect protection on auth and post-checkout

Auth callback and post-Stripe redirects validate the destination origin against an allowlist (`isAllowedOrigin`). Closes a class of phishing vectors.

### SEC-005: Server-side context fetching for AI prompts

Analysis routes fetch `profile.gut_profile` and recent logs from Postgres, never trusting client-supplied payloads. A compromised client cannot inject a different user's data into a prompt.

---

When a new decision lands, append it here with the file/path it touches, the trade-offs you accepted, and the date if it's reversible.
