# Sprints

## Sprint Planning & Roadmap

---

## Completed: MVP Sprint

### Goals
Ship a fully functional MVP with core AI features, authentication, billing, and mobile-optimized UI.

### Delivered
- [x] **Landing page** — Hero video, feature showcase, pricing, CTAs
- [x] **Authentication** — Email/password, Google OAuth, magic links, auto-confirm
- [x] **Onboarding** — 4-step flow (goals, restrictions, conditions, gut score)
- [x] **Dashboard** — Personalized home with gut score, quick actions, recent logs
- [x] **Voice logging** — MediaRecorder + Whisper transcription + Claude analysis
- [x] **Text logging** — Fallback input with quick symptom tags
- [x] **Document upload** — Drag-drop + camera capture
- [x] **Document analysis** — GPT-4o vision for test results, reports, food labels
- [x] **Meal plan generation** — Claude-powered 7-day personalized plans
- [x] **History** — Timeline view with 7-day rolling average
- [x] **Settings** — Profile, plan display, sign out
- [x] **Stripe billing** — Three-tier subscriptions with webhook handling
- [x] **Email** — Welcome, upgrade, meal plan delivery via Resend
- [x] **Database** — PostgreSQL schema with RLS on all tables
- [x] **PWA** — Manifest, mobile-optimized, standalone display
- [x] **Design system** — Dark theme, teal-green gradient, component library

---

## Upcoming: Sprint 2 — Polish & Feedback

### Goals
Refine the MVP based on initial user feedback. Focus on reliability, performance, and usability gaps.

### Planned Work

#### Performance & Reliability
- [ ] Cold start optimization for serverless functions
- [ ] Add loading skeletons for AI analysis (3-8s wait times)
- [ ] Error boundary components for graceful failure handling
- [ ] Retry logic for transient API failures (AI, Supabase)
- [ ] Image compression before upload (reduce storage costs)

#### UX Improvements
- [ ] Onboarding progress persistence (resume if interrupted)
- [ ] Empty state improvements with guided CTAs
- [ ] Pull-to-refresh on dashboard and history pages
- [ ] Toast notifications for success/error feedback
- [ ] Keyboard shortcuts for power users (desktop)

#### Data & Analytics
- [ ] Weekly gut score trend chart (line graph)
- [ ] Monthly summary view
- [ ] Tag-based filtering on history page
- [ ] Export logs as CSV/JSON

#### Testing
- [ ] User testing with 10-20 beta users
- [ ] Collect structured feedback on AI analysis quality
- [ ] A/B test onboarding step count (3 vs. 4 steps)
- [ ] Monitor API costs per user to validate unit economics

---

## Upcoming: Sprint 3 — Growth Features

### Goals
Add features that drive retention, enable sharing, and unlock Pro plan value.

### Planned Work

#### Pro Features
- [ ] PDF health report generation (downloadable gut health summary)
- [ ] Weekly email meal plan delivery (automated)
- [ ] Priority AI processing queue for Pro users
- [ ] Advanced analytics dashboard (triggers, correlations)

#### Engagement
- [ ] Push notifications for logging reminders (PWA)
- [ ] Streak tracking (consecutive days logged)
- [ ] Weekly email digest with gut health summary
- [ ] In-app tips and gut health education content

#### Social & Sharing
- [ ] Share gut score card (shareable image)
- [ ] Share meal plan with partner/family
- [ ] Referral system (invite friends, earn free month)

#### Integrations
- [ ] Apple Health / Google Fit data import
- [ ] Food logging with barcode scanner
- [ ] Edamam nutrition data in meal plan recipes
- [ ] Calendar integration for meal plan sync

---

## Upcoming: Sprint 4 — Scale & Expand

### Goals
Prepare for growth, add B2B capabilities, and explore new markets.

### Planned Work

#### Infrastructure
- [ ] Database query optimization and indexing
- [ ] CDN optimization for global users
- [ ] Rate limiting on AI endpoints
- [ ] Monitoring and alerting (Sentry, Datadog)
- [ ] Automated testing suite (unit + integration)

#### B2B / Practitioner Features
- [ ] Practitioner dashboard (manage multiple clients)
- [ ] Client invitation and data sharing
- [ ] Practitioner-branded reports
- [ ] API for third-party integrations

#### Expansion
- [ ] Multi-language support (Spanish, French, German)
- [ ] Localized meal plan generation
- [ ] Region-specific food databases
- [ ] App store submission (PWA wrapper or React Native)

#### Advanced AI
- [ ] Symptom pattern detection (ML on historical data)
- [ ] Predictive gut scoring (anticipate bad days)
- [ ] Food-symptom correlation analysis
- [ ] Conversational AI assistant for gut health questions

---

## Sprint Cadence

| Aspect | Approach |
|--------|----------|
| Sprint length | 2 weeks |
| Planning | Start of sprint — prioritize by impact and effort |
| Review | End of sprint — demo, measure, adjust |
| Retrospective | After each sprint — what worked, what didn't |
| Releases | Continuous deployment via Vercel |
