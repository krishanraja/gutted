# gutted. Documentation

> **Know your gut.** -- the AI gut-health companion that connects symptoms, lab results, and meal planning into one personalised plan.

This folder is the source of truth for what gutted. is, who it's for, how it's built, how it ships, and how to sell it. It is structured so that an AI sales/marketing agent or a new engineer can answer their own questions without pinging a human.

Live: [www.gutted.app](https://www.gutted.app)

---

## How to use these docs

| If you want to... | Start here |
|---|---|
| Understand the product in 5 minutes | [EXECUTIVE_SUMMARY](./EXECUTIVE_SUMMARY.md) |
| Pitch / sell / market gutted. | [VALUE_PROP](./VALUE_PROP.md) -> [ICP](./ICP.md) -> [PRICING](./PRICING.md) |
| Build or extend the product | [ARCHITECTURE](./ARCHITECTURE.md) -> [FEATURES](./FEATURES.md) -> [DECISIONS_LOG](./DECISIONS_LOG.md) |
| Deploy or replicate the stack | [DEPLOYMENT](./DEPLOYMENT.md) -> [REPLICATION_GUIDE](./REPLICATION_GUIDE.md) -> [COMMON_ISSUES](./COMMON_ISSUES.md) |
| Apply the design system | [BRANDING](./BRANDING.md) -> [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) -> [VISUAL_GUIDELINES](./VISUAL_GUIDELINES.md) |
| Reason about AI safety | [LLM_CRITICAL_THINKING_TRAINING](./LLM_CRITICAL_THINKING_TRAINING.md) |
| See what's planned vs done | [SPRINTS](./SPRINTS.md) -> [HISTORY](./HISTORY.md) |

---

## Index

### Strategy, market, and revenue
| Doc | What's in it |
|---|---|
| [EXECUTIVE_SUMMARY](./EXECUTIVE_SUMMARY.md) | Product, market, business model, sales/marketing handles |
| [PURPOSE](./PURPOSE.md) | Why we exist, who we serve, what we are not |
| [VALUE_PROP](./VALUE_PROP.md) | Core proposition, value stack, alternatives, sales hooks, objections, channel hooks |
| [ICP](./ICP.md) | Personas, anti-ICP, market sizing, acquisition channels, retention drivers, BANT |
| [OUTCOMES](./OUTCOMES.md) | User outcomes, funnel + retention targets, plan mix, unit economics, success criteria |
| [PRICING](./PRICING.md) | Current tiers ($0 / $14 / $29), rationale, feature gates, pricing experiments |

### Product and design
| Doc | What's in it |
|---|---|
| [FEATURES](./FEATURES.md) | Complete inventory of every shipped feature, organised by surface |
| [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) | Tokens, components, scale, breakpoints, avatars |
| [VISUAL_GUIDELINES](./VISUAL_GUIDELINES.md) | How to apply the system in product surfaces |
| [BRANDING](./BRANDING.md) | Identity, voice, palette, typography, brand do's and don'ts |

### Engineering
| Doc | What's in it |
|---|---|
| [ARCHITECTURE](./ARCHITECTURE.md) | Stack, routes, middleware, data flows, DB schema, indexes, security |
| [DEPLOYMENT](./DEPLOYMENT.md) | Infra, env vars, Vercel + Supabase + Stripe + Resend setup, monitoring |
| [REPLICATION_GUIDE](./REPLICATION_GUIDE.md) | Step-by-step setup from scratch |
| [COMMON_ISSUES](./COMMON_ISSUES.md) | Troubleshooting (build, auth, AI, DB, Stripe, mobile, cron) |
| [LLM_CRITICAL_THINKING_TRAINING](./LLM_CRITICAL_THINKING_TRAINING.md) | AI safety framework, runtime primitives, ethical boundaries |

### Process and decisions
| Doc | What's in it |
|---|---|
| [DECISIONS_LOG](./DECISIONS_LOG.md) | Architecture, design, product, and security decisions with rationale |
| [SPRINTS](./SPRINTS.md) | What's shipped, what's next, cadence |
| [HISTORY](./HISTORY.md) | Project timeline and surviving lessons |

---

## Stack at a glance

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2 (App Router) on Vercel Fluid Compute |
| UI | React 19.2, Tailwind CSS 4 |
| Language | TypeScript 5 |
| Database / Auth / Storage | Supabase (Postgres + RLS) |
| AI -- text + vision | Anthropic Claude (`claude-sonnet-4-20250514`) |
| AI -- voice | OpenAI Whisper |
| Payments | Stripe (API `2026-03-25.dahlia`) |
| Email | Resend |
| Nutrition | Edamam Food Database (Postgres-cached, 30-day TTL) |

---

## Pricing at a glance

| Plan | Price | Built for |
|---|---|---|
| Free | $0 | Try the AI -- 3 logs/day, 1 upload, 7-day history |
| **Core** | **$14/mo** | Daily users -- unlimited logs, weekly meal plans, AI Coach (10/mo), food checker, pattern detection, reminders, 5 uploads/mo |
| **Pro** | **$29/mo** | Power users -- everything in Core + unlimited uploads, unlimited AI Coach, photo logging, PDF reports, doctor summaries, supplements, practitioner share, integrations, goal tracking |

---

## One-line pitch

> **gutted. turns your gut symptoms, test results, and food choices into one personalised AI plan.**

For everything else, pick a doc above.
