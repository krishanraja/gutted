# Outcomes

The contract gutted. makes -- with users, with the business, and with the ecosystem.

---

## Outcomes for users

### First session (under 10 minutes)

| User action | Outcome |
|---|---|
| Voice-log a symptom | A 1-10 gut score with summary, insights, and 1-2 recommendations in <30 seconds. |
| Upload a gut test (PDF/image) | Plain-English interpretation, prioritised biomarkers, flagged concerns. |
| Complete onboarding | Personalised gut profile drives every future analysis and meal plan. |

### First week

| Action | Outcome |
|---|---|
| Log daily | 7-day rolling-average gut score and trend. |
| Upload labs | AI ties biomarkers to the symptoms in your logs. |
| Generate first meal plan | 7-day plan + grocery list personalised to restrictions, conditions, biomarkers, and recent symptom pattern. |
| Use the food checker | Per-food gut-friendliness rating against your profile. |

### First month and beyond

| Action | Outcome |
|---|---|
| Consistent tracking | Trigger detection -- specific foods, timing, stress, sleep. |
| Regular meal plans | Diet aligns with the gut you actually have, not the average gut. |
| Ongoing uploads | A continuously analysed archive of your medical record. |
| AI Gut Coach (Core 10/mo, Pro unlimited) | Conversational guidance grounded in your data. |
| Doctor visit summary (Pro) | Walk into your appointment with a structured PDF instead of "I haven't been feeling great." |
| Practitioner share (Pro) | Read-only token gives your clinician a live window into your data. |
| Score trend | Measurable gut-health improvement quarter over quarter. |

### Outcome statement (for landing/marketing)

> *"In 7 days you know your average gut score, your top trigger candidates, and what to eat this week. In 30 days you have a personal gut record more useful than most specialist intake forms."*

---

## Outcomes for the business

### Funnel and retention targets

| Metric | Target | Why it matters |
|---|---|---|
| Signup -> first log | >60% | Validates voice-first reduces friction. |
| Day 1 -> Day 7 retention | >30% | Habit-formation indicator. |
| Day 7 -> Day 30 retention | >15% | Sustained value delivery. |
| Free -> Paid conversion (D14) | >5% | Validates willingness to pay. |
| Free -> Paid conversion (D30) | >7% | Confirms longer-tail upsell motion. |
| Monthly paid churn | <8% | Proves continuous value. |
| Logs per active user / week | >3 | Engagement depth. |
| Meal plans / paid user / week | >0.8 | Feature utilisation on Core/Pro. |
| AI Coach sessions / paid user / month | >2 | Stickiness of the coach loop. |
| Document uploads / paid user / quarter | >1 | Test-data flywheel is firing. |

### Plan mix target (steady state)

| Plan | Price | Mix | Revenue / 1,000 signups (steady) |
|---|---|---|---|
| Free | $0 | 70% | $0 |
| Core | $14/mo | 20% | $2,800/mo |
| Pro | $29/mo | 10% | $2,900/mo |
| **Total** | | | **~$5,700 MRR per 1,000 signups** |

### Unit economics (per active user, monthly)

These are operating targets, not contractual guarantees -- the AI/email/Stripe lines vary with usage tier and prompt design.

| Cost line | Free | Core | Pro |
|---|---|---|---|
| AI (Anthropic + OpenAI) | $0.15-0.30 | $0.80-1.50 | $1.50-3.00 |
| Edamam (cached) | <$0.05 | <$0.10 | <$0.15 |
| Supabase + Vercel infra | $0.05 | $0.10 | $0.15 |
| Resend email | $0.00 | $0.02 | $0.10 |
| Stripe fees | -- | ~$0.71 | ~$1.14 |
| **Total cost** | **~$0.30** | **~$1.60-2.40** | **~$3.20-4.50** |
| **Revenue** | **$0** | **$14** | **$29** |
| **Gross margin** | n/a | **>80%** | **>85%** |

The Free tier is intentionally money-losing per user as long as the marginal cost stays inside the **D30 conversion to Core (>5-7%)** target. Above that bar, the funnel pays for itself.

### LTV / CAC discipline

- Target paid LTV: **>$200** at <8% monthly churn (~12-18 month average tenure).
- Target blended CAC: **<$50** through a content-led + practitioner-referral mix.
- Floor LTV/CAC: **3.0** at the funnel level. Channels under 3.0 get cut.

### What drives the moat

1. **Compounding personal data.** Switching = losing 30, 60, 90 days of context.
2. **AI Coach memory.** The coach becomes more useful per chat.
3. **Document archive.** All uploaded labs interpreted in one place.
4. **Practitioner relationships.** Once a clinician's caseload is on gutted., they don't move it.

---

## Success criteria by stage

### MVP (current)

- [x] All core features functional (voice + text logging, document analysis, meal plans, food checker, AI Coach, supplements, doctor summary, practitioner share).
- [x] Auth + Stripe billing + idempotent webhooks operational.
- [x] Mobile-first UI verified on iOS and Android viewports.
- [x] AI safety hardening (timeouts, JSON extraction, prompt-injection delimiters).
- [x] RLS on every user table; deny-all on server-only tables.
- [x] DB hot-path indexes on logs, documents, health_data, food_cache, practitioner tokens, Stripe events.
- [x] CI workflow + typecheck + lint clean.

### Growth (next)

- [ ] 1,000 registered users / 100 paying subscribers.
- [ ] 4+ rating from any in-app review prompt or app-store wrapper.
- [ ] Monthly paid churn <8%.
- [ ] At least 2 content topics ranking page-1 ("how to read Viome results," "low FODMAP meal plan AI" or equivalent).
- [ ] First practitioner partner channelling >10 clients/mo.

### Scale (later)

- [ ] 10,000+ MAU / $30K+ MRR.
- [ ] Multi-seat practitioner tier shipping.
- [ ] One distribution partnership with an at-home gut-test brand.
- [ ] International + multilingual meal planning.

---

## Health system impact (the macro outcome)

- Better-informed patients -> more productive doctor visits.
- Earlier surfacing of red-flag symptoms via the `flagged: true` AI logic.
- Higher adherence between specialist visits = better long-term outcomes.
- Practitioner caseloads scale (AI does the prep, clinician focuses on care).
- Existing $5B at-home test market gains a competent ongoing interpretation layer.

---

## What "winning" looks like

A user who, six months in, can answer:
- *What's my average gut score this month vs. last?* -- one tap.
- *Which foods are my top three triggers?* -- screen 1.
- *What does my last GI-MAP say in plain English?* -- already interpreted.
- *What should I eat this week?* -- meal plan + grocery list ready.
- *What do I tell my doctor?* -- doctor-summary PDF, one tap.

Hit that bar and retention, conversion, and word-of-mouth take care of themselves.

For the personas this serves and the channels that reach them, see [ICP.md](./ICP.md). For pricing rationale, see [PRICING.md](./PRICING.md).
