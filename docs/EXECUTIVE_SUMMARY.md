# Executive Summary

## gutted. - Know Your Gut

**gutted.** is an AI-powered gut health companion that transforms how people understand and manage their digestive health. By combining voice-based symptom logging, medical document intelligence, and personalized meal planning, gutted. delivers a seamless, data-driven experience that no other consumer health app offers today.

---

## The Problem

Over 70 million Americans suffer from digestive issues, yet most rely on generic advice, fragmented tracking apps, or expensive specialist visits. Existing solutions fail because they:

- Require tedious manual data entry that users abandon within weeks
- Cannot interpret medical test results (Viome, GI-MAP, SIBO breath tests)
- Offer generic meal plans disconnected from individual gut profiles
- Lack actionable intelligence that connects symptoms to nutrition

## The Solution

gutted. is the first app to close the loop between **symptom tracking**, **medical data**, and **personalized nutrition** -- all powered by AI.

1. **Voice-log symptoms in seconds** -- speak naturally, and AI transcribes + analyzes
2. **Upload any gut test or food label** -- AI extracts biomarkers and explains results in plain English
3. **Receive a weekly meal plan tailored to your gut** -- built from your unique profile, symptoms, and test data

## Key Differentiators

| Feature | gutted. | Competitors |
|---------|---------|-------------|
| Voice-first logging | Yes (Whisper AI) | Manual entry only |
| Medical document analysis | GPT-4o Vision | Not available |
| AI-personalized meal plans | Claude AI, weekly | Generic templates |
| Gut health scoring | Real-time, per-log | Daily average at best |
| Multi-model AI pipeline | Claude + GPT-4o + Whisper | Single model or none |

## Business Model

Three-tier subscription:
- **Free** -- 3 voice logs, 1 upload, basic scoring
- **Core ($9/mo)** -- Unlimited logging, weekly meal plans, trends
- **Pro ($19/mo)** -- Unlimited everything, PDF reports, priority AI, email meal plans

## Technology

Built on a modern, scalable stack: Next.js 16, React 19, Supabase (PostgreSQL + Auth + Storage), Stripe, and a multi-model AI architecture (Anthropic Claude for analysis/planning, OpenAI for transcription/vision).

## Current Status

- Fully functional MVP with all core features implemented
- PWA-ready for mobile-first experience
- Stripe billing integrated and operational
- Production-ready with row-level security on all user data

## Vision

gutted. aims to become the **default gut health platform** -- the place where anyone with digestive issues goes first, before (and between) doctor visits. By building the richest individual gut health dataset per user, we create compounding value that deepens engagement and reduces churn over time.
