# Agent Briefing

This is THE single source an autonomous AI sales or marketing agent reads to sell and market gutted. correctly and safely. It consolidates the one-liner, offer, ICP, channels, discovery, objections, claims policy, and attribution contract into one place so an agent can act without reading the whole docs tree.

This doc is the human-readable mirror. The runtime source of truth is machine-readable and versioned (see the next section). When the two ever disagree, the machine-readable endpoint wins, because it is assembled directly from the authoritative pricing object and cannot drift from Stripe.

---

## The machine-readable counterpart

Always read the live endpoint first. It is versioned, capability-only JSON, assembled from the docs plus the authoritative `PLANS` object so price and price IDs never drift.

- **Product truth (runtime source of truth):** `https://www.gutted.app/api/product-truth`
  - Versioned id: `gutted.product-truth/1` (field `schema_version`). Re-read on any contract change; the version bumps when the contract changes.
  - Carries: product, positioning, pricing (with `stripe_account`, live tier prices, and `stripe_price_id`), ICP personas + secondary + anti-ICP + channels, outcomes, claims policy, objection handling, and disclaimers.
- **Discovery file:** `https://www.gutted.app/llms.txt`
- **Canonical site:** `https://www.gutted.app`

Note: `/api` is otherwise disallowed to crawlers; `robots.txt` carves out `/api/product-truth`, `/llms.txt`, and `/.well-known/` specifically. Do not scrape other `/api` routes.

---

## One-liner and what gutted. is

> **gutted. turns your gut symptoms, test results, and food choices into one personalised AI plan.**

Tagline: **Know your gut.**

**What it is.** An AI gut-health companion: voice-log symptoms, upload gut tests for plain-English interpretation, and get meal plans and an AI coach grounded in your own logs and biomarkers. One score, one ongoing record, one coach that knows your data, about three minutes a day. Delivered as a web app and an installable, mobile-first PWA.

**Core positioning.** The only app that connects your gut symptoms, medical test results, and meal planning into one AI-powered system, so you understand your gut and know what to eat tomorrow.

### What gutted. is NOT (read before writing any copy)

- **Not a medical device.** No diagnostic claims, ever.
- **Not a diagnostic tool.** It is non-diagnostic. It does not diagnose, treat, cure, or prevent any condition.
- **Not a doctor replacement.** It makes the next doctor visit more productive; it does not stand in for one.
- **Not a generic diet or calorie app.** Every recommendation is grounded in the user's own logs, profile, and uploaded biomarkers.
- **Not a one-shot tool.** Value compounds with every log, upload, and chat. Day 30 is far more useful than Day 1.

gutted. is a YMYL (Your Money or Your Life) health product. Treat every claim as if a regulator and a worried patient will both read it. When in doubt, describe the capability and stop.

---

## Offer and pricing

Stripe account: **mindmaker_llc**. Currency: USD. Three tiers. (Live prices and Stripe price IDs are in the product-truth endpoint; the numbers below are the current truth.)

| | Free ($0) | Core ($14/mo) | Pro ($29/mo) |
|---|---|---|---|
| Positioning | Try the AI | Daily gut management | Complete gut optimisation |
| Voice + text logs | 3 / day | Unlimited | Unlimited |
| Document uploads | 1 / month | 5 / month | Unlimited |
| Log history | 7 days | Full | Full |
| Gut score per log | Yes | Yes | Yes |
| Weekly meal plan + grocery list | -- | Yes | Yes |
| Food checker (Edamam-backed) | -- | Yes | Yes |
| Pattern detection + trigger foods | -- | Enhanced | Enhanced |
| AI Gut Coach (multi-turn) | -- | 10 chats / mo | Unlimited |
| Daily reminders + weekly digest | -- | Yes | Yes |
| Photo food logging | -- | -- | Yes |
| PDF health reports | -- | -- | Yes |
| Doctor visit summary | -- | -- | Yes |
| Monthly progress reports | -- | -- | Yes |
| Supplement recommendations | -- | -- | Yes |
| Email-delivered meal plans | -- | -- | Yes |
| Health-data integrations (Apple Health / Fitbit / Oura) | -- | -- | Yes |
| Practitioner share (read-only token) | -- | -- | Yes |
| Goal tracking | -- | -- | Yes |

The AI Gut Coach has a **5-log unlock requirement on every plan**, because the coach needs context to be useful. Do not sell the coach as instant-on without that caveat.

### Headline feature split

- **Free is the demo.** It proves voice logging, AI scoring, and interpretation quality. 3 logs/day, 1 upload, 7-day history. Engineered to convert to Core inside week 1.
- **Core ($14/mo) removes the limits and adds the loop.** Unlimited logs, weekly meal plan + grocery list, AI Gut Coach (10 chats/mo), food checker, enhanced pattern detection, daily reminders + weekly digest, 5 uploads/mo.
- **Pro ($29/mo) is everything in Core plus the lab-and-clinician layer.** Unlimited uploads, unlimited coach, photo food logging, PDF + monthly progress reports, doctor visit summaries, supplement recommendations (from uploaded biomarkers), email-delivered meal plans, health-data integrations, practitioner share, goal tracking.

### Value anchors (use verbatim or paraphrase, never inflate)

- Core: *"Cheaper than two coffees, and the only thing in this category that actually reads your body's signals."*
- Pro: *"For less than 10% of one specialist copay you get a year of guidance, an AI coach with memory, and reports your doctor can actually use."*
- The funnel logic: $14 sits below the "subscription I'll cancel" threshold; $29 rounds to "under $1/day." The 2x ratio funnels indecisive users into Core and makes Pro a clear upgrade.
- We do **not** sell annual today. Do not offer or imply annual pricing.

---

## ICP (who to chase)

### Primary personas

**1. The Frustrated Tracker ("Sarah") -> best plan: Core ($14/mo).**
Recurring bloating, IBS, or food sensitivities. Abandoned manual trackers (Notes, Cara, Bowelle) inside 2-3 weeks because logging was tedious. Knows diet matters, does not know which foods. Voice logging removes the friction that killed her last attempts; the AI score after each entry feels rewarding; meal plans come from her data. Converts in week 1 from Free.

**2. The Test-Result Googler ("Mike") -> best plan: Pro ($29/mo).**
Has a Viome, GI-MAP, SIBO, ZOE, Tiny Health, or food-sensitivity report he cannot fully interpret. Spent $300-500 on the test and wants ROI on it. gutted. interprets any upload in plain English, surfaces the biomarkers that matter, and folds them into meal plans and ongoing tracking. Already invested, so he wants the maximum-value tier.

**3. The Gut-Curious Optimiser ("Alex") -> best plan: Free then Core ($14/mo); some go Pro for integrations.**
Generally healthy, wellness-oriented, early adopter. Already tracks sleep, HRV, and steps on Whoop / Oura / Apple Health. Heard about the gut-brain axis on a longevity podcast and wants to act. The modern dark UI, score gamification, and voice-first logging fit the lifestyle; Pro's health-data integrations line up with the existing stack.

### Secondary personas

- **IBS / GERD / Crohn's warriors.** Diagnosed, highly motivated, fast adopters. Practitioner-share is a hook. Core or Pro.
- **Postpartum recoverers.** New, often undiagnosed gut issues; severely time-constrained, so voice-first is non-negotiable. Core. Strong word-of-mouth.
- **Practitioners** (nutritionists, functional-medicine clinicians, health coaches). Want client adherence plus a read-only window into client data; buy gutted. for clients. Pro today; a multi-seat B2B tier is the natural future SKU.
- **Recent at-home test buyers (post-purchase).** Just spent $200-500 on Viome / Tiny Health / GI-MAP. High intent, narrow 2-4 week window. Pro on first session.

### Anti-ICP (do NOT chase, do not spend on)

- People with no symptoms and no gut curiosity. They will not retain.
- Hospital procurement and regulated medical-device buyers. gutted. is explicitly non-medical and non-diagnostic; this is the wrong product and the wrong claim surface.
- Casual calorie-counting diet-app shoppers. We are not that.
- Under-18 minors. Out of scope.

The conversion economics do not work for these segments. Cutting them is the discipline.

---

## Acquisition channels (prioritised) and per-channel hooks

1. **Content + SEO (highest priority).** Long-form that ranks, funnels to Free signup.
   - Hooks: *"How to read your Viome results,"* *"GI-MAP interpretation,"* *"what does a SIBO breath test mean,"* *"low FODMAP meal plan,"* *"IBS food triggers tracker."*
2. **At-home test partnerships.** Co-branded interpretation upsell. Highest-LTV cohort.
   - Hook: *"Get an AI second opinion on your results."* Lands on a co-branded upload page.
3. **Practitioner channel.** Nutritionists and FM clinicians recommend to caseloads. Long-tail referral.
   - Hook: *"Keep your clients tracking between sessions."* Lands on practitioner-share onboarding.
4. **Short-form social (TikTok, Reels).** Demo-heavy.
   - Hook: *"I uploaded my Viome to an AI and here's what it said."* Lands on the Free-tier upload demo.
5. **Podcasts (gut-health, optimiser, longevity adjacencies).** Founder story plus promo-coded landing.
6. **Reddit + community (r/IBS, r/SIBO, r/Gastroenterology, r/Microbiome).** Story-led, never spammy.
   - Hook: *"Built this because I was tired of Googling my own labs."*
7. **Referrals.** Free month for referrer and referred.

Floor discipline: any channel under **3.0 LTV/CAC** gets cut. Target blended CAC under $50; target paid LTV over $200.

---

## Discovery questions an agent should ask

These map cleanly to onboarding fields and unlock the Core/Pro recommendation on the spot.

1. *"How are you tracking your gut today, if at all?"*
2. *"Have you done a gut test (Viome, GI-MAP, SIBO, food sensitivity)? When?"*
3. *"What did your last doctor visit leave you with?"*
4. *"What food do you suspect is a trigger, and how confident are you?"*
5. *"On a scale of 1-10, what would you say your gut feels like this week?"*

Persona-specific openers:
- Frustrated Tracker: *"You've tried tracking before, right? What killed it, the typing or that nothing useful came out the other side?"*
- Test-Result Googler: *"You spent $300+ on the test. What's actually different in your life since the result came back?"*
- Gut-Curious Optimiser: *"You're tracking sleep, HRV, and steps. What's tracking the thing that controls a huge share of your immune system?"*

Recommendation logic: an unread test result or a clinician asking them to track points to **Pro**. Recurring discomfort with no labs yet points to **Core** (start on Free if they want to feel it first).

---

## Objection handling

| Objection | Response |
|---|---|
| *"I already use a symptom tracker."* | "Trackers tell you what. gutted. tells you why and what to eat next, and it reads your lab results, which your tracker can't." |
| *"AI can't replace my doctor."* | "Correct, and gutted. is explicit about that. It makes your next doctor visit more productive: you arrive with logs, biomarkers, patterns, and a doctor-summary, not a vague 'I haven't been feeling great.'" |
| *"I don't have a gut test to upload."* | "You don't need one to start. The voice-log, AI-score, and meal-plan loop works on its own. When you do test, gutted. is ready to read it." |
| *"Why not just ChatGPT?"* | "A general chatbot has no memory of your last 30 days, doesn't know your restrictions, has no flagged-symptom safety routing, and won't generate a meal plan grounded in your biomarkers. gutted. is purpose-built for this loop." |
| *"$14 a month adds up."* | "It's the cost of two coffees. A single specialist visit is 20-50x that, and a test retest is 10-15x that. gutted. is what makes both pay off." |
| *"I'll abandon another tracker."* | "Voice logs take about ten seconds, reminders are optional, and the Free tier removes the commitment. The reason most trackers get abandoned, friction, is the exact thing we engineered around." |

---

## Claims policy (most important section)

gutted. is YMYL and non-medical. The policy is **capability-only**: describe what the product does, never a health outcome or efficacy claim a reader could repeat as fact. This binds every ad, post, email, landing page, comment, and DM an agent produces.

### Allowed phrasing (describe what it does)

- "Interprets your uploaded gut test in plain English with prioritised takeaways."
- "Scores each log and shows a 7-day rolling average and trend."
- "Builds a weekly meal plan and grocery list from your logs, restrictions, conditions, and biomarkers."
- "Surfaces patterns and trigger-food candidates from your own data."
- "Answers questions through an AI coach grounded in your logs and uploads."
- "Generates a doctor-visit summary you can bring to an appointment (Pro)."
- "Gives your practitioner a read-only, revocable window into your data (Pro)."
- Frame the value as **clarity, personalisation, and consolidation**. Use candidate and likelihood language ("trigger candidates," "may be associated with," "your data suggests"), never certainty.

### NEVER claim (hard stops)

- **No cure, treatment, or diagnosis.** Never "cures bloating," "fixes IBS," "treats SIBO," "diagnoses" anything.
- **No efficacy or medical-outcome guarantee.** Never "will heal your gut," "improves your microbiome," "guaranteed to reduce symptoms," or any promised health result.
- **Never "replaces a doctor"** or a diagnosis or medical care. gutted. supplements, it does not substitute.
- **Never imply it is a medical device** or a regulated clinical tool.
- Never present AI output as definitive medical fact, and never override the flagged-symptom safety routing.

### Required disclaimers (attach to claims-adjacent copy)

- **Not medical:** "gutted. is a tracking and insight tool, not a medical service. It is non-diagnostic and does not provide medical advice."
- **Not a doctor replacement:** "gutted. does not replace a healthcare professional. Concerning symptoms are flagged with a recommendation to see a doctor."
- **Age:** "Not intended for users under 18." Do not target or accept under-18 minors.

When a draft sits anywhere near a health outcome, rewrite to the capability and append the relevant disclaimer. If you cannot phrase it as a capability, do not publish it.

---

## Attribution contract for the fleet

Every fleet-driven link to gutted. must carry full UTM tagging so revenue is attributable by campaign:

- `utm_source` (e.g. `tiktok`, `reddit`, `partner-viome`)
- `utm_medium` (e.g. `social`, `referral`, `email`, `cpc`)
- `utm_campaign` (the named campaign)
- `utm_content` (the specific creative or link variant)
- `utm_term` (keyword or audience, where applicable)

How gutted. closes the loop (already live, no action needed from the agent beyond tagging links correctly):

- **First-touch capture.** A first-party cookie records utm / referrer / landing_path on the visit and persists it into `profiles.attribution` at email signup and at the OAuth callback.
- **Stamped to revenue.** Stripe checkout stamps `utm_*` plus an anonymous id onto both the checkout session and the subscription metadata, so a paid conversion is traceable to its campaign inside Stripe (account `mindmaker_llc`).
- **Events emitted.** gutted. emits `landed` and `signed_up` (frontend) and `purchased`, `churned`, and `refunded` (Stripe webhook).

### What leaves gutted. (revenue-only, deny-by-default)

The attribution serializer is a strict allowlist. **Only** an opaque user uuid, the UTM set, and a plan-derived `value_cents` ever leave gutted. It **NEVER** emits email, name, symptom, gut score, condition, or biomarker. There is no PHI in the attribution stream and no email-for-outbound.

### Off-limits

- **Outbound lead-gen from gutted. is OFF-LIMITS pending YMYL legal review.** Do not extract, request, or use gutted. user contact data for outbound marketing. Acquisition is inbound and campaign-tagged only.
- Attribution emit is a safe no-op until the warehouse env vars (`ATTRIBUTION_INGEST_URL`, `ATTRIBUTION_INGEST_SECRET`) are set on the gutted. side; the Mindmaker OS warehouse owns the ingest function and the secret. The agent does not handle that secret.
