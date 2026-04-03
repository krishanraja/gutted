# Architecture

## System Overview

gutted. is a full-stack Next.js 16 application with a multi-model AI pipeline, PostgreSQL database, and serverless API architecture.

```
                    +------------------+
                    |   Client (PWA)   |
                    |  React 19 + TW4  |
                    +--------+---------+
                             |
                    +--------+---------+
                    |   Next.js 16     |
                    |   App Router     |
                    |   Middleware      |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------+--+   +------+------+  +----+-------+
     | API Routes |   |  Supabase   |  |   Stripe   |
     | (Serverless)|  | (DB/Auth/   |  | (Payments) |
     +--------+--+   |  Storage)   |  +----+-------+
              |       +------+------+       |
              |              |              |
     +--------+--------------+--------------+
     |                                      |
+----+------+    +----------+    +----------+
|  Claude   |    |  OpenAI  |    |  Resend  |
| (Analysis)|    | (Vision/ |    | (Email)  |
|           |    | Whisper) |    |          |
+-----------+    +----------+    +----------+
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2.4 |
| Framework | Next.js (App Router) | 16.2.2 |
| Styling | Tailwind CSS | 4.x |
| Language | TypeScript | 5.x |
| Database | PostgreSQL (Supabase) | 15.x |
| Auth | Supabase Auth | 2.x |
| Storage | Supabase Storage | 2.x |
| Payments | Stripe | 22.x |
| AI (Text) | Anthropic Claude 3.5 Sonnet | Latest |
| AI (Vision) | OpenAI GPT-4o | Latest |
| AI (Audio) | OpenAI Whisper | v1 |
| Email | Resend | 6.x |
| Food Data | Edamam API | v2 |

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (metadata, fonts, viewport)
│   ├── page.tsx            # Landing page (public)
│   ├── globals.css         # Global styles + Tailwind
│   ├── middleware.ts        # Auth guard for protected routes
│   ├── api/                # Serverless API routes
│   │   ├── transcribe/     # Audio -> text (Whisper)
│   │   ├── analyse-log/    # Symptom analysis (Claude)
│   │   ├── analyse-document/ # Document analysis (GPT-4o)
│   │   ├── meal-plan/      # Meal plan generation (Claude)
│   │   ├── food-lookup/    # Nutrition data (Edamam)
│   │   ├── stripe/         # Checkout + webhooks
│   │   ├── auth/confirm/   # Auto-confirm signups
│   │   ├── send-email/     # Transactional email
│   │   └── upload-document/ # File upload
│   ├── auth/               # Login, signup, password reset
│   ├── dashboard/          # Protected app screens
│   └── onboarding/         # New user setup flow
├── components/
│   ├── Navigation.tsx      # Bottom tab bar
│   ├── VoiceRecorder.tsx   # Audio capture + transcription
│   ├── GutScore.tsx        # Animated score indicator
│   ├── DocumentUploader.tsx # Drag-drop file upload
│   └── ui/                 # Reusable primitives (Button, Card, Badge)
└── lib/
    ├── anthropic.ts        # Claude client
    ├── openai.ts           # OpenAI client
    ├── stripe.ts           # Stripe client + plan config
    ├── edamam.ts           # Food API client
    ├── email-templates.ts  # HTML email templates
    └── supabase/
        ├── client.ts       # Browser client
        └── server.ts       # Server client (cookies)
```

## Data Flow

### Voice Logging Flow
```
User speaks → MediaRecorder (WebM) → /api/transcribe (Whisper)
→ Transcript displayed → User confirms → /api/analyse-log (Claude)
→ Gut score + insights → Saved to `logs` table
```

### Document Analysis Flow
```
User uploads file → /api/upload-document → Supabase Storage
→ Public URL → /api/analyse-document (GPT-4o Vision)
→ Biomarkers + interpretation → Saved to `documents` table
```

### Meal Plan Generation Flow
```
User requests plan → Fetch profile + logs + documents from DB
→ /api/meal-plan (Claude) → 7-day structured plan
→ Saved to `meal_plans` table → Displayed as daily tabs
```

## Database Schema

Four core tables, all with row-level security:

- **profiles** — User identity, subscription plan, gut profile (JSONB)
- **logs** — Voice/text entries with AI analysis and gut scores
- **documents** — Uploaded files with AI interpretations and biomarkers
- **meal_plans** — Weekly generated plans stored as JSONB

All tables cascade-delete from `profiles` for clean account removal.

## Authentication Architecture

- **Supabase Auth** handles identity (email/password, Google OAuth, magic links)
- **Next.js Middleware** protects `/dashboard/*` and `/onboarding` routes
- **Server-side Supabase client** uses cookies for session management
- **Auto-confirm** enabled for frictionless signup (no email verification step)
- **Row-Level Security** enforces data isolation at the database level

## AI Architecture

Multi-model approach optimized for each task:

| Task | Model | Why |
|------|-------|-----|
| Audio transcription | Whisper | Best-in-class speech-to-text |
| Symptom analysis | Claude 3.5 Sonnet | Superior reasoning for health insights |
| Document interpretation | GPT-4o | Leading vision model for medical docs |
| Meal plan generation | Claude 3.5 Sonnet | Structured output + dietary reasoning |
| Food nutrition lookup | Edamam API | Verified nutrition database |

All AI calls are server-side only — API keys never reach the client.

## Security Model

- **Row-Level Security (RLS)** on all database tables
- **Server-side API keys** — no secrets in client bundles
- **Supabase Auth** with JWT verification
- **Stripe webhook signature verification**
- **10MB body size limit** on server actions
- **File type validation** on uploads (images + PDF only)
- **Non-medical disclaimers** — AI always recommends professional consultation
