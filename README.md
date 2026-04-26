# gutted.

> **Know your gut.** -- the AI gut-health companion that turns symptoms, lab results, and meal choices into one personalised plan.

[gutted.app](https://www.gutted.app) -- voice-log a symptom, upload a gut test, get a weekly meal plan that actually fits your gut.

---

## What it is

gutted. is a production Next.js 16 / React 19 web app and PWA. It closes the loop between three things every other gut-health app keeps separate:

1. **Symptom tracking** -- voice or text logs analysed in seconds.
2. **Medical document intelligence** -- Viome, GI-MAP, SIBO, food-sensitivity reports, food labels.
3. **Personalised meal planning** -- weekly plans built from the user's actual gut profile, not a template.

A single AI score (1-10) sits at the centre, with a multi-turn AI Gut Coach, pattern detection, daily reminders, supplement guidance (Pro), doctor summaries (Pro), and practitioner-share read-only access on top.

## Stack at a glance

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| UI | React 19.2, Tailwind CSS 4 |
| Language | TypeScript 5 |
| Database / Auth / Storage | Supabase (Postgres + RLS) |
| AI -- text & vision | Anthropic Claude (`claude-sonnet-4-20250514`) |
| AI -- voice | OpenAI Whisper |
| Payments | Stripe (API `2026-03-25.dahlia`) |
| Email | Resend |
| Nutrition data | Edamam Food Database API (cached) |
| Hosting | Vercel (Fluid Compute) |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in keys (see docs/DEPLOYMENT.md)
npm run dev                  # http://localhost:3000
npm run lint                 # eslint
npm run typecheck            # tsc --noEmit
npm run build && npm start   # production build
```

## Where to read next

The full source of truth lives in [`/docs`](./docs/README.md). Highlights:

- **Selling & positioning:** [EXECUTIVE_SUMMARY](./docs/EXECUTIVE_SUMMARY.md) · [VALUE_PROP](./docs/VALUE_PROP.md) · [ICP](./docs/ICP.md) · [OUTCOMES](./docs/OUTCOMES.md) · [PRICING](./docs/PRICING.md)
- **Building & shipping:** [ARCHITECTURE](./docs/ARCHITECTURE.md) · [FEATURES](./docs/FEATURES.md) · [DEPLOYMENT](./docs/DEPLOYMENT.md) · [REPLICATION_GUIDE](./docs/REPLICATION_GUIDE.md) · [COMMON_ISSUES](./docs/COMMON_ISSUES.md)
- **Design:** [DESIGN_SYSTEM](./docs/DESIGN_SYSTEM.md) · [VISUAL_GUIDELINES](./docs/VISUAL_GUIDELINES.md) · [BRANDING](./docs/BRANDING.md)
- **AI safety:** [LLM_CRITICAL_THINKING_TRAINING](./docs/LLM_CRITICAL_THINKING_TRAINING.md)
- **Process:** [DECISIONS_LOG](./docs/DECISIONS_LOG.md) · [SPRINTS](./docs/SPRINTS.md) · [HISTORY](./docs/HISTORY.md)

The agent-facing rules live in [`AGENTS.md`](./AGENTS.md) and [`CLAUDE.md`](./CLAUDE.md).
