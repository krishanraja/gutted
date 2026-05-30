import { NextResponse } from 'next/server'
import { PLANS } from '@/lib/stripe'

// Versioned, machine-readable product and offer truth for the Mindmaker fleet
// and any agent or crawler. ONE source so every agent sells the same accurate
// pitch, ICP, price, and current offer, and picks up changes with no re-brief.
//
// Capability-only by policy: it describes what gutted DOES, never a health
// outcome or efficacy claim an agent could repeat as fact (gutted is YMYL).
// Prices and price IDs come from the authoritative PLANS object so they can
// never drift from Stripe. Bump SCHEMA_VERSION on any contract change.
const SCHEMA_VERSION = 'gutted.product-truth/1'

export async function GET() {
  const body = {
    schema_version: SCHEMA_VERSION,
    product: {
      name: 'gutted.',
      tagline: 'Know your gut.',
      one_liner:
        'gutted. turns your gut symptoms, test results, and food choices into one personalised AI plan.',
      what_it_is:
        'An AI gut-health companion: voice-log symptoms, upload gut tests for plain-English interpretation, and get meal plans and an AI coach grounded in your own logs and biomarkers.',
      url: 'https://www.gutted.app',
      category: 'Health and wellness software (non-medical, non-diagnostic)',
      platforms: ['Web', 'PWA (installable, mobile-first)'],
    },
    positioning: {
      core:
        'The only app that connects your gut symptoms, medical test results, and meal planning into one AI-powered system, so you understand your gut and know what to eat tomorrow.',
      vs_alternatives: [
        'vs generic symptom trackers: voice-first, an AI score per entry, meal-plan integration, document interpretation, and an AI coach.',
        'vs diet apps: plans grounded in your gut profile, recent symptoms, and uploaded biomarkers, not generic templates.',
        'vs one-time test interpreters: continuous integration of test data with daily symptoms and ongoing meal planning.',
        'vs a general chatbot: domain-tuned prompts grounded in your structured logs and uploads, with prompt-injection delimiters and flagged-symptom safety routing.',
      ],
    },
    pricing: {
      stripe_account: 'mindmaker_llc',
      currency: 'usd',
      tiers: [
        {
          id: 'free',
          name: 'Free',
          price_monthly: 0,
          positioning: 'Try the AI.',
          includes: ['3 logs/day', '1 document upload', '7-day history', 'AI score and insights per log'],
        },
        {
          id: 'core',
          name: PLANS.core.name,
          price_monthly: PLANS.core.price,
          stripe_price_id: PLANS.core.priceId || null,
          positioning: 'Daily gut management.',
          includes: PLANS.core.features,
        },
        {
          id: 'pro',
          name: PLANS.pro.name,
          price_monthly: PLANS.pro.price,
          stripe_price_id: PLANS.pro.priceId || null,
          positioning: 'Complete gut optimisation.',
          includes: PLANS.pro.features,
        },
      ],
    },
    icp: {
      personas: [
        {
          handle: 'The Frustrated Tracker',
          summary:
            'Recurring bloating, IBS, or food sensitivities; abandoned manual trackers; wants to know which foods actually matter.',
          best_plan: 'core',
        },
        {
          handle: 'The Test-Result Googler',
          summary:
            'Has a Viome, GI-MAP, SIBO, or food-sensitivity report they cannot fully interpret; wants ongoing guidance and ROI on the test.',
          best_plan: 'pro',
        },
        {
          handle: 'The Gut-Curious Optimiser',
          summary:
            'Generally healthy, wellness-oriented, already tracks sleep and HRV; wants proactive gut optimisation in a modern app.',
          best_plan: 'core',
        },
      ],
      secondary: [
        'IBS / GERD / Crohn’s warriors',
        'postpartum recoverers',
        'nutrition and functional-medicine practitioners (client adherence + read-only share)',
        'recent at-home gut-test buyers',
      ],
      anti_icp: [
        'People with no symptoms or gut curiosity (they will not retain).',
        'Hospital procurement and regulated medical-device buyers (gutted is non-medical and non-diagnostic).',
        'Casual calorie-counting diet-app shoppers.',
        'Under-18 minors.',
      ],
      channels: [
        'Content and SEO (how to read Viome / GI-MAP / SIBO results, low-FODMAP meal plans, IBS triggers)',
        'At-home test partnerships',
        'Practitioner referral',
        'Short-form social demos',
        'Gut-health and longevity podcasts',
        'Reddit communities',
      ],
    },
    outcomes: [
      'Go from "something feels off" to "here is what to eat this week" in under 10 minutes.',
      'Within 7 days, know your average gut score and the foods that work and do not work for you.',
      'Arrive at a doctor visit with logs, biomarkers, patterns, and a summary instead of a vague description.',
    ],
    agent_briefing: {
      claims_policy: 'capability-only, no medical or efficacy claims',
      how_to_describe: [
        'Describe what the product does: interprets uploaded gut tests in plain English, builds meal plans from your logs, scores each log, surfaces patterns, and answers questions via an AI coach grounded in your data.',
        'Frame the value as clarity, personalisation, and consolidation, never as a cure or a guaranteed health result.',
      ],
      never_claim: [
        'Any cure, treatment, or diagnosis (for example "cures bloating", "fixes IBS", "treats SIBO").',
        'Any efficacy or medical-outcome guarantee (for example "will heal your gut", "improves your microbiome").',
        'That it replaces a doctor, a diagnosis, or medical care.',
        'Anything implying it is a medical device or a regulated clinical tool.',
      ],
      objection_handling: [
        {
          objection: 'AI cannot replace my doctor.',
          response:
            'Correct, and gutted is explicit about that. It makes the next visit more productive: you arrive with logs, biomarkers, patterns, and a summary.',
        },
        {
          objection: 'I do not have a gut test to upload.',
          response:
            'You do not need one to start. The voice-log, AI-score, and meal-plan loop works on its own; when you do test, gutted reads it.',
        },
      ],
    },
    disclaimers: {
      not_medical:
        'gutted is a tracking and insight tool, not a medical service. It is non-diagnostic and does not provide medical advice.',
      not_doctor_replacement:
        'gutted does not replace a healthcare professional. Concerning symptoms are flagged with a recommendation to see a doctor.',
      age: 'Not intended for users under 18.',
    },
    references: {
      llms_txt: 'https://www.gutted.app/llms.txt',
      canonical: 'https://www.gutted.app',
    },
  }

  return NextResponse.json(body, {
    headers: {
      // Cacheable at the CDN edge so the fleet and crawlers get a stable, fast read.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
