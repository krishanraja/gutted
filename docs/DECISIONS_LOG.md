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
