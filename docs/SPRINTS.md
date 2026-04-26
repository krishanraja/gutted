# Sprints

Roadmap and what's actually shipped. Working principle: bias toward shipping; document outcomes here, capture decisions in [DECISIONS_LOG.md](./DECISIONS_LOG.md).

---

## Shipped

### MVP -- core product

- Landing page with hero MP4 background and pricing.
- Auth: email + password, magic links, password reset. Auto-confirm.
- Onboarding wizard (4 steps: goals, restrictions, conditions, baseline score).
- Dashboard tabs: overview, log, history, coach. Food sub-tabs: meals, upload, check, supplements.
- Voice + text logging with Whisper transcription and Claude analysis (gut score 1-10, summary, insights, recommendations, flagged-symptom safety).
- Document intelligence (Viome, GI-MAP, SIBO, food labels) via Claude vision.
- AI-generated weekly meal plans + grocery lists, personalised to profile + recent logs + uploaded biomarkers.
- AI Gut Coach (multi-turn) with 5-log unlock.
- Food checker (Edamam-backed nutrition + Claude gut-friendliness scoring).
- Supplement recommendations (Pro) from uploaded biomarkers.
- Doctor visit summary (Pro) and PDF health reports (Pro).
- Practitioner read-only access tokens.
- Settings as a profile admin dashboard.
- Stripe billing: Free / Core $14 / Pro $29; full lifecycle (checkout, change-plan, cancel, resume, customer portal).
- Email automation (Resend): welcome, upgrade, payment-failed, daily reminders, weekly digest, monthly report, weekly meal plan, password reset.
- PWA (manifest, service worker, standalone display, OLED-friendly dark theme).

### Reliability + AI safety

- 25-second `aiAbort()` timeout on every Anthropic call.
- `extractJsonObject` balanced-bracket JSON parsing (no greedy regex failures).
- Prompt-injection delimiters (`[BEGIN USER DATA] ... [END USER DATA]`) on all user-data prompts.
- Server-side context fetching -- prompts never trust client-supplied profiles or logs.
- Per-user rate limiting in `src/lib/security.ts` with lazy 60s cleanup.
- Constant-time `CRON_SECRET` verification, Web-API-only (edge-compatible).
- Open-redirect protection on auth + post-checkout flows.
- Stripe webhook idempotency via `stripe_webhook_events` (event-id PK insert race).
- Edge-compatible Web APIs in security helpers (replaced Node `crypto`/`Buffer`).

### Performance

- DB hot-path indexes: `idx_logs_user_date`, `idx_documents_user_date`, `idx_health_data_user_date`, `idx_food_cache_created_at`, `idx_stripe_webhook_events_processed_at`, `idx_practitioner_token`.
- Edamam response cache (`food_cache`, 30-day TTL, deny-all RLS, service-role only).
- Hero video MP4 faststart + eager preload for fast LCP.

### UX + mobile

- Mobile viewport + scroll fixes on Upload, Settings, Onboarding pages.
- Em-dash normalisation across the codebase (`--` convention).
- 6 gut-themed avatars (`bloat-balloon`, `dash-runner`, `fiber-friend`, `gurgle-sleuth`, `probiotic-pal`, `zen-guru`); avatar replaces the plan-badge profile button.
- Settings redesigned into a profile admin dashboard.
- Accessibility pass: TextInput component, dialog focus management, design tokens.
- Plan-drawer overflow + checkout error handling fixes on settings.
- Google Search Console "Page with redirect" indexing fix.

### Tooling + CI

- GitHub Actions CI: lint + typecheck on PRs.
- `npm run typecheck` script.
- Lint clean across `src/`.
- `.gitignore` covering Playwright artifacts, Supabase temp files, root screenshots.

---

## Up next -- Sprint A: conversion + retention

The next 2-4 weeks of work, in priority order.

- [ ] Free-to-paid conversion telemetry: cohort signup-to-Core within 7/14/30 days, plus event tracking on each Free-tier limit hit.
- [ ] Onboarding A/B: 3-step vs 4-step wizard.
- [ ] Empty-state CTA improvements on every locked tab (the unlock copy is good; the visual treatment can be sharper).
- [ ] Streak surface on the overview tab (consecutive days logged) -- pure retention lever.
- [ ] Toast feedback on all async actions where it's still missing.
- [ ] Pull-to-refresh on dashboard + history.
- [ ] First content marketing assets: "How to read Viome results," "How to read GI-MAP results," "Low-FODMAP meal plan AI."

## Up next -- Sprint B: practitioner channel pilot

- [ ] Practitioner onboarding flow (their POV, not the user's).
- [ ] Practitioner email opt-in for weekly client digests.
- [ ] Multi-client view (read-only across many tokens) for the practitioner.
- [ ] Co-branded partner landing template (for at-home test brands and clinicians).
- [ ] Outreach motion: identify 10 practitioner pilots; ship a referral code mechanism.

## Up next -- Sprint C: pro depth + integrations

- [ ] Health-data integration UI: import flow for Apple Health / Fitbit / Oura into the existing `health_data` schema.
- [ ] Patterns surface: a dedicated screen that visualises the AI-detected food + symptom + sleep correlations.
- [ ] Goal tracking surface (the schema/feature exists; the dedicated UI is thin).
- [ ] Photo food logging UX polish (Pro).
- [ ] Email-deliverable PDF reports vs in-app downloads.
- [ ] Push notifications for logging reminders (PWA web push).

## Later -- scale + B2B

- [ ] Annual plan pricing once paid churn is provably <8% MoM and the cohort is large enough to discount safely.
- [ ] Practitioner multi-seat tier ($79-199/mo) with white-label option.
- [ ] At-home test partnership co-branded onboarding.
- [ ] Multi-language support; localised meal planning + region-specific food databases.
- [ ] Predictive gut scoring (anticipate bad days based on patterns).
- [ ] Native app wrapper (Capacitor or React Native) if PWA limits become real.

---

## Cadence

| Aspect | Approach |
|---|---|
| Sprint length | 2 weeks |
| Planning | Start of sprint; rank by impact x effort, lock top 3-5 |
| Review | End of sprint; demo what shipped, what slipped, why |
| Retro | Same meeting; one keep, one stop, one start |
| Deploys | Continuous via Vercel; PRs merge -> production |
| Hotfixes | Same day; security and billing always |

When something lands, move it to **Shipped** above and capture any non-obvious decisions in [DECISIONS_LOG.md](./DECISIONS_LOG.md).
