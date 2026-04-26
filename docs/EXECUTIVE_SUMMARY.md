# Executive Summary

## gutted. -- Know your gut.

gutted. is the **AI gut-health platform** that connects three things every other consumer app keeps separate: symptom tracking, medical document intelligence, and personalised meal planning. One score, one app, one ongoing record of how your gut is actually doing.

It is live at [www.gutted.app](https://www.gutted.app), production-grade (Next.js 16, Supabase, Stripe, Vercel Fluid Compute), and built around a multi-model AI pipeline (Anthropic Claude Sonnet 4 + OpenAI Whisper).

---

## The one-liner

> **gutted. turns your gut symptoms, test results, and food choices into one personalised AI plan -- in seconds, not specialist visits.**

## The 30-second pitch

> 70 million Americans deal with digestive issues, and the tools they use are fragmented. They track symptoms in Notes, sit on a gut test they can't read, and follow generic diets that don't account for their body. gutted. closes the loop. You voice-log a symptom in seconds, upload any gut test for instant AI interpretation, and get a weekly meal plan built specifically for your gut. It's like having a gut-health specialist in your pocket -- for $14 a month.

## The problem

- **70M+ Americans** live with chronic digestive issues.
- The average sufferer **waits 6+ months** before seeking help.
- Lab results from Viome, GI-MAP, SIBO breath tests, food-sensitivity panels arrive without an interpreter.
- Doctors give 15 minutes and a generic pamphlet.
- Existing apps log symptoms but don't connect them to nutrition or test data.

The gap between *"something is wrong with my gut"* and *"here is what to do tomorrow"* is enormous, expensive, and lonely.

## The solution

A single closed loop:

1. **Voice-log symptoms in seconds.** Whisper transcribes, Claude analyses, you get a 1-10 gut score plus insights and recommendations.
2. **Upload any gut test or food label.** Claude extracts biomarkers, explains them in plain English, flags what matters, and connects findings back to your daily logs.
3. **Get a weekly meal plan built from your data.** Personalised to your restrictions, conditions, recent symptoms, and uploaded biomarkers -- with a grocery list.
4. **Talk to your AI Gut Coach.** Multi-turn conversation grounded in *your* logs and uploads. (Core: 10 chats/mo, Pro: unlimited.)
5. **Share with your doctor or practitioner.** PDF health reports, doctor visit summaries, and read-only practitioner access tokens. (Pro.)

## Key differentiators

| Capability | gutted. | Generic symptom trackers | Diet apps (MyFitnessPal, Noom) | Test interpreters | Specialists |
|---|---|---|---|---|---|
| Voice-first logging | Yes (Whisper) | Manual | Manual | -- | -- |
| AI gut score per log | Yes | Daily avg only | -- | -- | -- |
| Lab/test interpretation | Yes (Claude) | -- | -- | One-time | Yes |
| Meal plan from *your* data | Yes (Claude) | -- | Generic | -- | Yes |
| Multi-turn AI coach | Yes | -- | -- | -- | Yes |
| Practitioner share | Yes | -- | -- | -- | Yes |
| Cost | $14-29/mo | $5-10/mo | $10-20/mo | $50-200 one-off | $200-500/visit |

## Business model

Three-tier subscription, billed monthly through Stripe.

| Plan | Price | Who it's for |
|---|---|---|
| Free | $0 | Try the AI -- 3 logs/day, 1 upload, 7-day history |
| **Core** | **$14/mo** | Daily users -- unlimited logs, weekly meal plans, AI Coach (10/mo), food checker, pattern detection, reminders |
| **Pro** | **$29/mo** | Power users -- everything in Core, unlimited uploads, unlimited AI Coach, photo logging, PDF reports, doctor summaries, supplements, practitioner share, health integrations, goal tracking |

Target mix: 70% Free / 20% Core / 10% Pro --> ~$5,700 MRR per 1,000 signups at steady state.

Unit economics target: **>80% gross margin** on paid plans (see [OUTCOMES.md](./OUTCOMES.md)).

## What's already shipped

- Full auth, onboarding wizard, and protected dashboard
- Voice and text logging with Whisper + Claude analysis
- Document intelligence for gut tests, lab reports, food labels
- AI-generated weekly meal plans + grocery lists
- AI Gut Coach (multi-turn) with usage caps
- Food checker (Edamam-backed nutrition lookup, 30-day server cache)
- Daily insights, weekly digest, monthly progress reports
- Stripe billing with idempotent webhooks (Core/Pro/free + change-plan, cancel, resume, customer portal)
- Practitioner read-only share tokens
- PDF health reports + doctor visit summary (Pro)
- Supplement recommendations from biomarkers (Pro)
- Health-data integration table (Apple Health, Fitbit, Oura, manual)
- Production-grade security: RLS on every user table, signed Stripe webhooks, deduplicated event handling, server-side rate limiting, AI request timeouts, prompt-injection delimiters, edge-compatible Web APIs
- DB hot-path indexes on logs and documents
- Mobile-first PWA (standalone display, OLED-friendly dark theme, 6 gut-themed avatars)
- CI workflow, typecheck script, lint clean

## Why this wins

- **The data moat compounds.** Every log, upload, and chat makes the next recommendation more personal -- switching costs grow weekly.
- **Voice-first kills the #1 reason trackers fail** (logging friction).
- **Multi-model AI** uses the right model for each job (Whisper for audio, Claude Sonnet 4 for reasoning + vision) instead of compromising on one.
- **Closed loop, not point solution.** Symptoms inform meal plans inform documents inform the coach -- the parts amplify each other.
- **Built for scale.** Vercel Fluid Compute (no edge-runtime limits), Supabase Postgres with RLS and indexes already in place, Stripe webhook idempotency, lazy-cleanup rate limiting, server-side caching for nutrition lookups.

## Vision

Be the **default gut-health platform** -- the place anyone with digestive issues goes first, before and between doctor visits. Then expand horizontally:

- **Practitioner channel** (already wired): nutritionists, functional-medicine practitioners, health coaches recommend gutted. to clients.
- **B2B / employer wellness**: gut health is the #1 quietly-disabling category in white-collar work.
- **International + multilingual** meal planning.
- **Wearable + EHR integration** beyond the existing Apple Health / Fitbit / Oura schema.

## Sales & marketing handles

For AI agents pitching gutted., the clean handles are:

- **Hero hook:** *"Stop Googling your gut tests."*
- **Proof line:** *"Voice-log in 10 seconds. Upload any test. Eat the right thing this week."*
- **Differentiator line:** *"The only app that connects your symptoms, lab results, and meals into one AI plan."*
- **Price anchor:** *"Less than a single visit copay -- and it works between visits."*
- **Risk-reversal:** *"Free tier shows you what the AI can do before you pay."*

Full sales playbook -- ICPs, objections, channels, content angles -- lives in [ICP.md](./ICP.md) and [VALUE_PROP.md](./VALUE_PROP.md).
