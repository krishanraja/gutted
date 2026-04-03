# gutted. Documentation

> **Know your gut.** — AI-powered gut health companion

---

## What is gutted.?

gutted. is a full-stack AI health application that helps users track gut symptoms, interpret medical test results, and receive personalized meal plans. It combines voice-first logging, document intelligence, and multi-model AI to deliver a seamless gut health management experience.

**Live stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Supabase · Stripe · Claude AI · GPT-4o · Whisper

---

## Documentation Index

### Strategy & Vision
| Document | Description |
|----------|-------------|
| [EXECUTIVE_SUMMARY](./EXECUTIVE_SUMMARY.md) | High-level overview of the product, market, and business model |
| [PURPOSE](./PURPOSE.md) | Why gutted. exists and who it serves |
| [VALUE_PROP](./VALUE_PROP.md) | Core value proposition and competitive positioning |
| [ICP](./ICP.md) | Ideal customer profiles and market sizing |
| [OUTCOMES](./OUTCOMES.md) | Success metrics, unit economics, and impact goals |

### Product & Design
| Document | Description |
|----------|-------------|
| [FEATURES](./FEATURES.md) | Complete feature inventory with details |
| [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) | Colors, typography, spacing, components — the full design spec |
| [VISUAL_GUIDELINES](./VISUAL_GUIDELINES.md) | How to apply the design system correctly |
| [BRANDING](./BRANDING.md) | Brand identity, voice, colors, and logo usage |

### Technical
| Document | Description |
|----------|-------------|
| [ARCHITECTURE](./ARCHITECTURE.md) | System architecture, tech stack, data flows, and security model |
| [DEPLOYMENT](./DEPLOYMENT.md) | Environment setup, infrastructure, and deployment guide |
| [REPLICATION_GUIDE](./REPLICATION_GUIDE.md) | Step-by-step setup from scratch |
| [COMMON_ISSUES](./COMMON_ISSUES.md) | Troubleshooting guide for development and production |

### Process & Decisions
| Document | Description |
|----------|-------------|
| [DECISIONS_LOG](./DECISIONS_LOG.md) | Key architectural, design, and product decisions with rationale |
| [SPRINTS](./SPRINTS.md) | Sprint planning, completed work, and roadmap |
| [HISTORY](./HISTORY.md) | Project timeline and evolution |

### AI & Intelligence
| Document | Description |
|----------|-------------|
| [LLM_CRITICAL_THINKING_TRAINING](./LLM_CRITICAL_THINKING_TRAINING.md) | AI reasoning framework for health analysis, safety rules, and prompt standards |

---

## Quick Start

```bash
git clone <repository-url>
cd gutted
npm install
cp .env.example .env.local  # Add your API keys
npm run dev                  # http://localhost:3000
```

See [REPLICATION_GUIDE](./REPLICATION_GUIDE.md) for the full setup walkthrough.

---

## Core Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 | Full-stack framework (App Router) |
| React 19 | UI library |
| Tailwind CSS 4 | Styling |
| Supabase | Database, Auth, Storage |
| Stripe | Subscription billing |
| Claude 3.5 Sonnet | Symptom analysis + meal plan generation |
| GPT-4o | Medical document vision analysis |
| Whisper | Voice-to-text transcription |
| Resend | Transactional email |
| Edamam | Food nutrition database |
