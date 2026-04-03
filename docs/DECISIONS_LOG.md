# Decisions Log

A record of key architectural, design, and product decisions made during the development of gutted.

---

## Architecture Decisions

### ADR-001: Next.js 16 with App Router
**Date:** Project inception
**Decision:** Use Next.js 16 with the App Router (not Pages Router)
**Context:** Needed a full-stack React framework with serverless API routes, SSR, and modern React features
**Rationale:**
- App Router provides server components, layouts, and loading states out of the box
- API routes run as serverless functions — no separate backend needed
- React 19 compatibility with server actions
- Strong Vercel deployment ecosystem
**Trade-offs:** Next.js 16 has breaking changes vs. earlier versions; must reference docs carefully

### ADR-002: Multi-Model AI Architecture
**Date:** Project inception
**Decision:** Use Claude for text analysis, GPT-4o for vision, Whisper for audio
**Context:** Single-model approaches compromise quality in at least one domain
**Rationale:**
- **Whisper** is best-in-class for speech-to-text accuracy
- **GPT-4o** leads in document/image understanding (medical test interpretation)
- **Claude 3.5 Sonnet** excels at structured reasoning (symptom analysis, meal planning)
- Each model is used where it performs best — no compromises
**Trade-offs:** Multiple API keys to manage, higher integration complexity, multiple vendor dependencies

### ADR-003: Supabase for Backend
**Date:** Project inception
**Decision:** Use Supabase for database, auth, and file storage
**Context:** Needed PostgreSQL, authentication, and file storage without building a custom backend
**Rationale:**
- PostgreSQL with Row-Level Security provides robust data isolation
- Built-in auth with OAuth, magic links, and email/password
- Storage with public URL generation for uploaded documents
- Generous free tier for MVP development
- Supabase SSR client integrates natively with Next.js
**Trade-offs:** Vendor lock-in for auth and storage; RLS policies add complexity

### ADR-004: Stripe for Payments
**Date:** Project inception
**Decision:** Use Stripe Checkout with webhook-based fulfillment
**Context:** Need subscription billing with three tiers
**Rationale:**
- Stripe Checkout handles PCI compliance, UI, and payment methods
- Webhooks provide reliable event processing for plan changes
- Subscription management (upgrades, cancellations) handled by Stripe
- Well-documented, widely adopted
**Trade-offs:** 2.9% + 30c per transaction; no in-app purchase for mobile

---

## Design Decisions

### DDR-001: Dark-Only Theme
**Date:** Project inception
**Decision:** Ship with dark theme only — no light mode
**Context:** Many health apps use light themes; we wanted differentiation
**Rationale:**
- Pure black (#000000) background saves battery on OLED screens
- Creates a premium, modern aesthetic that stands out
- Reduces visual clutter — content and data are the focus
- Simpler to maintain one theme well than two themes adequately
**Trade-offs:** Some users prefer light mode; outdoor readability is slightly reduced

### DDR-002: Mobile-First, Max-Width Constraint
**Date:** Project inception
**Decision:** Dashboard uses `max-w-sm` (384px) — designed for phones first
**Context:** Gut health tracking is a personal, on-the-go activity
**Rationale:**
- Primary use case is logging symptoms immediately when they occur
- Voice recording and camera upload are mobile-native interactions
- Constrained width ensures content is always scannable
- PWA mode makes it feel like a native app
**Trade-offs:** Desktop experience is narrow; acceptable since target users are mobile-primary

### DDR-003: Voice-First Logging
**Date:** Project inception
**Decision:** Make voice input the primary logging method, with text as fallback
**Context:** The #1 reason symptom trackers fail is logging friction
**Rationale:**
- Speaking is 3-5x faster than typing on mobile
- Natural language captures context that checkboxes miss
- Whisper transcription is highly accurate for English
- Animated frequency bars make recording feel responsive and engaging
**Trade-offs:** Requires microphone permission; not ideal in public/quiet settings

### DDR-004: Teal-Green Gradient as Brand Signature
**Date:** Project inception
**Decision:** Use `#00B4B4 → #4ADE80` gradient as the primary visual identity
**Context:** Needed a distinctive, recognizable brand element
**Rationale:**
- Teal conveys health and calm; green conveys wellness and growth
- Gradient adds energy without being aggressive
- Works beautifully on dark backgrounds
- Distinct from competitor color palettes (usually blue or orange)
**Trade-offs:** Gradient text requires `-webkit-background-clip` (well-supported but non-standard)

---

## Product Decisions

### PDR-001: Auto-Confirm Email Signup
**Date:** Project inception
**Decision:** Skip email verification — auto-confirm users on signup
**Context:** Standard email verification adds friction to onboarding
**Rationale:**
- Reducing signup-to-first-log time is critical for activation
- Email verification causes 20-40% drop-off in typical apps
- Security risk is low — users can only access their own data
- Can add verification later if abuse becomes an issue
**Trade-offs:** Fake email addresses possible; mitigated by RLS (no impact on other users)

### PDR-002: Three-Tier Pricing
**Date:** Project inception
**Decision:** Free, Core ($9/mo), Pro ($19/mo)
**Context:** Need to balance accessibility with revenue
**Rationale:**
- **Free** tier provides genuine value — enough to hook users and demonstrate AI quality
- **Core** removes limits for daily users — the "default" plan
- **Pro** adds premium features (PDF reports, unlimited uploads, email plans)
- Price points align with health app market ($5-20/mo range)
**Trade-offs:** Free tier costs money (AI API calls); limited to 3 logs + 1 upload to control costs

### PDR-003: Gut Score as Primary Metric
**Date:** Project inception
**Decision:** Every log generates a 1-10 gut score as the headline metric
**Context:** Users need a simple, consistent way to measure gut health
**Rationale:**
- Single number is easy to track and compare over time
- Color-coding (green/amber/red) provides instant understanding
- Gamification effect — users want to improve their score
- 7-day rolling average smooths daily variation
**Trade-offs:** Oversimplification of complex health data; mitigated by detailed insights alongside the score

### PDR-004: Non-Medical Positioning
**Date:** Project inception
**Decision:** Always disclaim that gutted. is not a medical tool
**Context:** Regulatory and ethical considerations around health AI
**Rationale:**
- Avoids FDA medical device classification
- Sets appropriate user expectations
- AI analysis includes "consult your healthcare provider" recommendations
- Positions as a tracking and insight tool, not a diagnostic tool
**Trade-offs:** Some users may want more definitive answers; we prioritize safety
