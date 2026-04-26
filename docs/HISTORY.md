# Project History

A condensed timeline of what gutted. has been, in order, with the lessons that survived each phase. Decisions and their rationale live in [DECISIONS_LOG.md](./DECISIONS_LOG.md); current and upcoming work lives in [SPRINTS.md](./SPRINTS.md).

---

## Phase 1 -- Concept and foundation

The project started from a simple frustration: people with gut issues have *no* single tool that connects their symptoms, their lab results, and their meals. Existing apps handle one piece of the puzzle and leave the user to manually stitch the rest.

Foundational choices:
- Target the gut-health vertical specifically -- not general health.
- Voice-first to solve the tracking-abandonment problem.
- A multi-model AI architecture, picking the right model per task (audio vs reasoning).
- Dark, premium UI to differentiate from clinical-feeling health apps.
- Mobile-first PWA, no native wrapper to start.

## Phase 2 -- MVP build

- Authentication (email + password, magic links, password reset, auto-confirm).
- Onboarding wizard (4 steps).
- Voice + text logging with Whisper transcription and Claude analysis.
- Document upload + AI interpretation for gut tests and food labels.
- AI-generated weekly meal plans + grocery list.
- History timeline and 7-day rolling-average gut score.
- Settings, plan management, sign out.
- Stripe billing (initially Free / Core $9 / Pro $19; later raised to $14 / $29).
- Welcome and upgrade transactional emails (Resend).
- Landing page with hero MP4 background and pricing.
- Database schema with RLS on all user tables.
- PWA manifest, mobile-first responsive layout.
- Design system: dark theme, teal-green gradient, Tailwind 4 tokens, component library.

## Phase 3 -- Depth and feature breadth

- AI Gut Coach (multi-turn, 5-log unlock, plan-tiered usage caps).
- Food checker (Edamam-backed nutrition + Claude gut-friendliness scoring).
- Supplement recommendations (Pro) grounded in uploaded biomarkers.
- Doctor visit summary + PDF health reports + monthly reports (Pro).
- Practitioner read-only access tokens (`practitioner_access`).
- Health-data integration table (`apple_health`, `fitbit`, `oura`, `manual`).
- Daily reminders + weekly digest + monthly report cron emails.
- 6 gut-themed avatars (`bloat-balloon`, `dash-runner`, `fiber-friend`, `gurgle-sleuth`, `probiotic-pal`, `zen-guru`); avatar replaces the plan-badge profile button.
- Settings redesigned into a profile admin dashboard.

## Phase 4 -- Reliability, security, and performance

- AI request timeouts (`aiAbort`, 25s) on every Anthropic call.
- Safe JSON extraction (`extractJsonObject` balanced-bracket parser).
- Prompt-injection delimiters around all user-data prompts.
- Server-side context fetching (no client-supplied profile / logs in prompts).
- Per-user rate limiting (`src/lib/security.ts`).
- Stripe webhook idempotency via the `stripe_webhook_events` table.
- Edge-compatible Web APIs in security helpers (no Node `crypto` / `Buffer`).
- Open-redirect protection in auth + post-checkout.
- DB hot-path indexes on `logs(user_id, logged_at desc)` and `documents(user_id, uploaded_at desc)`.
- Edamam response cache (`food_cache`, 30-day TTL, deny-all RLS).
- Hero video MP4 faststart + eager preload.
- Mobile viewport + scroll fixes (Upload, Settings, Onboarding).
- Em-dash normalisation across the codebase.
- Google Search Console redirect-indexing fix.
- Accessibility pass on TextInput + dialog focus management + design tokens.
- CI workflow + typecheck script + lint clean.

## Phase 5 -- Where we are now

Production at [www.gutted.app](https://www.gutted.app):

- Full feature surface as listed above is shipped and operational.
- Paid plans live: Free / Core $14 / Pro $29.
- Stripe billing including change-plan, cancel, resume, customer portal -- with idempotent webhooks.
- AI safety and prompt hardening landed.
- Practitioner channel wired but not yet activated (no partners onboarded yet).

The active priorities are conversion telemetry, content marketing, the practitioner-channel pilot, and Pro depth (integrations, patterns, goals). See [SPRINTS.md](./SPRINTS.md).

---

## Pricing evolution

| Period | Free | Core | Pro |
|---|---|---|---|
| MVP launch | $0 | $9/mo | $19/mo |
| Current | $0 | **$14/mo** | **$29/mo** |

Reasoning for the bump: AI usage grew (AI Coach added on Core, supplements/doctor-summary/photo-logging/integrations on Pro), and the original tiers underpriced the value. New tiers stay below psychological ceilings ($15 / $30) and preserve the 2x ratio that funnels indecisive users into Core.

## Stack evolution

| Component | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | Latest serverless + RSC story |
| React | 19.2.4 | Server actions, concurrent features |
| Styling | Tailwind CSS 4 | New PostCSS plugin model |
| Database / Auth / Storage | Supabase | Postgres + RLS + auth + storage in one |
| AI -- text + vision | Anthropic Claude `claude-sonnet-4-20250514` | Consolidated from a multi-vendor split (was using GPT-4o for vision; Claude Sonnet 4 covers both well now) |
| AI -- audio | OpenAI Whisper | Best-in-class STT |
| Payments | Stripe | API `2026-03-25.dahlia` |
| Email | Resend | Templated HTML in `src/lib/email-templates.ts` |
| Nutrition | Edamam Food Database | Postgres-cached |
| Hosting | Vercel Fluid Compute | Node runtime, instance reuse |

## Lessons learned that still drive the codebase

1. **Voice-first was the right call.** Typing symptoms on a phone is tedious; voice removes the biggest friction point.
2. **Multi-model AI pays off, until consolidation is cleaner.** Originally Whisper + GPT-4o + Claude. Today Whisper + Claude (vision-capable) is one fewer vendor and prompt surface to maintain, with no quality regression.
3. **Auto-confirm reduces drop-off.** Skipping email verification meaningfully improved signup-to-first-log.
4. **Dark theme resonates.** Premium feel + OLED-friendly + differentiation from clinical apps.
5. **10 MB server action limit matters.** Audio uploads need it; the config change was non-obvious but essential.
6. **RLS is worth the upfront effort.** Eliminates an entire class of access bugs and makes service-role separation crisp.
7. **Webhook idempotency is non-negotiable.** Once Stripe redelivered an event in production and triggered duplicate emails, the dedup table was an obvious next-day fix.
8. **AI calls need timeouts and JSON walkers.** Hung calls and prose-wrapped JSON are the two failures that bite hardest in serverless; both have first-class helpers now.
9. **Edge-compatible by default.** Even if we run Node, writing security helpers in Web APIs only keeps options open.
10. **Cache the boring API calls.** The Edamam cache eliminated a chunk of marginal cost without compromising data freshness.

When the next phase ships, append it above with the same "what changed and why" structure. Decisions move to [DECISIONS_LOG.md](./DECISIONS_LOG.md); active work to [SPRINTS.md](./SPRINTS.md).
