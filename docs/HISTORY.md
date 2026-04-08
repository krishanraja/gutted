# Project History

## Timeline

### Phase 1: Concept & Foundation
**Period:** Project inception

**Motivation:**
The idea for gutted. emerged from a common frustration: people with gut issues have no single tool that connects their symptoms, medical test results, and diet. Existing apps handle one piece -- tracking OR nutrition OR test interpretation -- but never all three together.

**Key decisions made:**
- Target the gut health vertical specifically (not general health)
- Voice-first logging to solve the tracking abandonment problem
- Multi-model AI architecture for best-in-class results per task
- Dark, premium aesthetic to differentiate from clinical-looking health apps
- Mobile-first PWA approach over native app development

---

### Phase 2: MVP Development
**Period:** Initial build

**What was built:**
1. **Authentication system** -- Email/password, Google OAuth, magic links with auto-confirm
2. **Onboarding flow** -- 4-step personalization (goals, restrictions, conditions, score)
3. **Voice logging** -- MediaRecorder + Whisper transcription + Claude analysis
4. **Document upload** -- Drag-drop + camera capture + GPT-4o vision analysis
5. **Meal plan generation** -- Claude-powered 7-day personalized plans
6. **History & analytics** -- Timeline view with 7-day rolling averages
7. **Dashboard** -- Personalized home screen with gut score and quick actions
8. **Subscription billing** -- Stripe Checkout with three-tier pricing
9. **Transactional email** -- Welcome, upgrade, meal plan delivery via Resend
10. **Landing page** -- Hero video, feature showcase, pricing table, CTAs

**Technical milestones:**
- Next.js 16 App Router architecture established
- Supabase database schema with RLS policies
- Multi-model AI pipeline (Claude + GPT-4o + Whisper) integrated
- Stripe webhook handling for subscription lifecycle
- PWA manifest and mobile-optimized UI complete

---

### Phase 3: Current State
**Status:** Fully functional MVP

**What's complete:**
- All core features implemented and functional
- Full authentication flow with multiple providers
- AI analysis pipeline operational (voice → text → score → insights)
- Document intelligence for medical tests and food labels
- Personalized meal plan generation
- Subscription billing with Stripe
- Mobile-optimized dark UI with PWA support
- Row-level security on all database tables
- Transactional email system

**What's next (planned):**
- User testing and feedback collection
- Performance optimization and cold-start mitigation
- Enhanced analytics (weekly/monthly trend charts)
- PDF health report generation (Pro feature)
- Food logging integration with Edamam nutrition data
- Push notifications for logging reminders
- Data export functionality

---

## Technology Evolution

| Component | Choice | Reason |
|-----------|--------|--------|
| Framework | Next.js 16 | Latest App Router, serverless API routes |
| React | 19.2.4 | Server components, concurrent features |
| Styling | Tailwind CSS 4 | Utility-first, fast iteration |
| Database | Supabase PostgreSQL | Auth + DB + Storage in one platform |
| AI (Text) | Claude 3.5 Sonnet | Superior reasoning for health analysis |
| AI (Vision) | GPT-4o | Best-in-class document understanding |
| AI (Audio) | Whisper | Industry-leading speech-to-text |
| Payments | Stripe | Standard for SaaS billing |
| Email | Resend | Modern, developer-friendly email API |

---

## Lessons Learned

1. **Voice-first was the right call** -- Typing symptoms on a phone is tedious; voice removes the biggest friction point in health tracking
2. **Multi-model AI pays off** -- Using the best model for each task produces noticeably better results than compromising on a single model
3. **Auto-confirm reduces drop-off** -- Skipping email verification significantly improved signup completion rates
4. **Dark theme resonates** -- Users respond positively to the premium feel; it also differentiates from clinical health apps
5. **10MB server action limit matters** -- Audio recordings can be large; this config change was essential
6. **RLS is worth the upfront effort** -- Row-level security eliminates an entire class of data access bugs
