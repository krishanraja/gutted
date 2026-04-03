# Features

## Core Features

### 1. Voice-First Symptom Logging
Log gut symptoms by speaking naturally — no typing required.

- **One-tap recording** with animated frequency visualization (20-bar display)
- **OpenAI Whisper** transcription for accurate speech-to-text
- **Quick symptom tags** for common issues (bloating, cramps, nausea, heartburn, etc.)
- **Text fallback** — type entries when voice isn't convenient
- **Instant AI analysis** after each log with gut score, insights, and recommendations

### 2. AI-Powered Gut Health Scoring
Every log is analyzed by Claude AI and assigned a gut score from 1-10.

- **Real-time scoring** with color-coded indicators (green/amber/red)
- **Animated circular progress** visualization
- **7-day rolling average** on history page
- **Trend tracking** to see gut health trajectory over time
- **Flagging system** alerts users to potentially serious symptoms

### 3. Medical Document Intelligence
Upload gut test results, doctor reports, or food labels for AI interpretation.

- **Drag-and-drop upload** with camera capture on mobile
- **Supported formats:** JPG, PNG, HEIC, WebP, PDF
- **GPT-4o Vision analysis** extracts and interprets:
  - Biomarkers and key findings
  - Plain-English explanations
  - Actionable recommendations
  - Flags for concerning results
- **Supported test types:** Viome, GI-MAP, Thryve, SIBO breath tests, food sensitivity panels
- **Food label scanning** with gut-friendliness rating (1-10)

### 4. Personalized Weekly Meal Plans
AI-generated 7-day meal plans built from your unique gut profile.

- **Claude AI** generates plans considering:
  - Dietary restrictions and preferences (from onboarding)
  - Recent symptom patterns and triggers
  - Medical test results and biomarkers
  - Gut-friendly food prioritization
- **Daily breakdown:** Breakfast, lunch, dinner, and snacks
- **Weekly summary** with gut health tips
- **Tab-based daily navigation** for easy browsing

### 5. Symptom History & Analytics
Complete timeline of your gut health journey.

- **Chronological log feed** with gut scores and summaries
- **7-day average score** displayed prominently
- **Color-coded entries** for quick visual scanning
- **Full analysis expansion** for each log entry
- **Date-based organization** for pattern recognition

---

## User Experience Features

### 6. Guided Onboarding
Four-step personalization flow for new users:

1. **Health goals** — What do you want to improve?
2. **Dietary restrictions** — Allergies, intolerances, preferences
3. **Existing conditions** — IBS, GERD, Crohn's, celiac, etc.
4. **Initial gut score** — Baseline self-assessment

### 7. Mobile-First PWA
Designed as a Progressive Web App for native-like mobile experience:

- **Bottom tab navigation** (Home, Log, Upload, Meals, History)
- **Safe area padding** for notched devices
- **Standalone display mode** (no browser chrome)
- **Dark theme** optimized for OLED screens
- **Touch-optimized controls** with active scale feedback

### 8. Dashboard Home
Central hub with personalized greeting and quick actions:

- **Time-based greeting** (Good morning/afternoon/evening)
- **Current gut score** card with animated indicator
- **Quick action buttons** — Log, Upload, View Meals
- **Recent logs** feed with scores and timestamps
- **Onboarding prompt** for users who haven't completed setup

---

## Authentication & Account

### 9. Flexible Authentication
Multiple sign-in methods for user convenience:

- **Email/password** — Traditional registration
- **Google OAuth** — One-tap social login
- **Magic links** — Password-less email login
- **Auto-confirm** — No email verification friction
- **Password reset** — Self-service recovery flow

### 10. User Settings
Account management and subscription control:

- **Profile display** — Name, email, current plan
- **Plan management** — View tier, upgrade options
- **Sign out** — Secure session termination

---

## Monetization Features

### 11. Tiered Subscriptions (Stripe)
Three plans with progressive value:

| Feature | Free | Core ($9/mo) | Pro ($19/mo) |
|---------|------|-------------|-------------|
| Voice logs | 3 | Unlimited | Unlimited |
| Document uploads | 1 | 3/month | Unlimited |
| Gut scoring | Basic | Full | Full |
| History | 7 days | Full | Full |
| Meal plans | - | Weekly | Weekly |
| Trends | - | Yes | Yes |
| PDF reports | - | - | Yes |
| Priority AI | - | - | Yes |
| Email meal plans | - | - | Weekly |

### 12. Transactional Email
Automated email touchpoints via Resend:

- **Welcome email** — Sent on signup with getting-started guidance
- **Upgrade confirmation** — Plan upgrade acknowledgment
- **Weekly meal plans** — Emailed plans for Pro subscribers
- **Password reset** — Self-service account recovery

---

## Technical Features

### 13. Multi-Model AI Pipeline
Purpose-optimized AI for each task:

- **Whisper** — Audio transcription
- **Claude 3.5 Sonnet** — Symptom analysis + meal planning
- **GPT-4o** — Medical document vision analysis
- **Edamam** — Verified nutrition data

### 14. Data Security
Enterprise-grade data protection:

- **Row-Level Security (RLS)** on all database tables
- **Server-side API keys** — Never exposed to client
- **Stripe webhook verification** — Cryptographic signature validation
- **File type validation** — Restricted upload formats
- **Cascade deletion** — Clean account removal
