# Deployment

## Overview

gutted. is deployed as a serverless Next.js application with Supabase for backend services and Stripe for payments.

---

## Infrastructure

| Service | Provider | Purpose |
|---------|----------|---------|
| Application | Vercel | Next.js hosting, serverless functions, CDN |
| Database | Supabase | PostgreSQL with Row-Level Security |
| Authentication | Supabase Auth | Email/password, Google OAuth, magic links |
| File Storage | Supabase Storage | Document uploads (images, PDFs) |
| Payments | Stripe | Subscription billing, webhooks |
| Email | Resend | Transactional emails |
| AI (Text) | Anthropic | Claude API for analysis + meal plans |
| AI (Vision) | OpenAI | GPT-4o for document analysis, Whisper for audio |
| Food Data | Edamam | Nutrition database API |

---

## Environment Variables

### Required for Production

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@gutted.app

# Edamam
EDAMAM_APP_ID=<app-id>
EDAMAM_APP_KEY=<app-key>

# Site
NEXT_PUBLIC_SITE_URL=https://gutted.app
```

### Notes
- `NEXT_PUBLIC_` prefixed variables are exposed to the browser — only use for non-sensitive values
- `SUPABASE_SERVICE_ROLE_KEY` has full database access — server-side only
- Stripe keys: use `sk_test_` for staging, `sk_live_` for production

---

## Build & Run

### Development
```bash
npm install
npm run dev          # Starts at http://localhost:3000
```

### Production Build
```bash
npm run build        # Compiles + optimizes
npm run start        # Starts production server
```

### Linting
```bash
npm run lint         # ESLint check
```

---

## Vercel Deployment

### Setup
1. Connect GitHub repository to Vercel
2. Set framework preset to **Next.js**
3. Add all environment variables in Vercel dashboard → Settings → Environment Variables
4. Deploy

### Configuration
- **Build Command:** `next build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
- **Node.js Version:** 18.x+
- **Regions:** Auto (or specify for latency optimization)

### Automatic Deployments
- **Production:** Deploys on push to `main` branch
- **Preview:** Deploys on pull request (unique URL per PR)

### Server Actions
Next.js config allows 10MB body size for server actions (needed for audio uploads):
```ts
experimental: {
  serverActions: { bodySizeLimit: '10mb' }
}
```

---

## Supabase Setup

### Database
1. Create a new Supabase project
2. Run the migration file: `supabase/migrations/001_initial.sql`
3. This creates: `profiles`, `logs`, `documents`, `meal_plans` tables
4. Row-Level Security policies are included in the migration

### Authentication
1. Enable Email/Password provider
2. Enable Google OAuth provider (add OAuth credentials)
3. Set redirect URLs:
   - `https://gutted.app/auth/callback`
   - `http://localhost:3000/auth/callback` (development)
4. Disable email confirmation (handled by auto-confirm API)

### Storage
1. Create a `documents` bucket
2. Set bucket to **private**
3. Add storage policy: authenticated users can upload to their own folder
4. Enable public URL generation for uploaded files

---

## Stripe Setup

### Products & Prices
Create two subscription products in Stripe Dashboard:

1. **Core Plan**
   - Price: $9/month (recurring)
   - Copy the Price ID into `src/lib/stripe.ts`

2. **Pro Plan**
   - Price: $19/month (recurring)
   - Copy the Price ID into `src/lib/stripe.ts`

### Webhooks
1. Add webhook endpoint: `https://gutted.app/api/stripe/webhook`
2. Listen for events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Checkout Flow
- Checkout sessions are created server-side with user metadata
- Success redirects to `/dashboard?upgraded=1`
- Cancel redirects to `/dashboard`

---

## Domain & DNS

### Custom Domain (Vercel)
1. Add domain in Vercel → Settings → Domains
2. Configure DNS:
   - `A` record → Vercel's IP
   - `CNAME` for `www` → `cname.vercel-dns.com`
3. SSL is automatically provisioned

### Email Domain (Resend)
1. Verify domain in Resend dashboard
2. Add required DNS records (SPF, DKIM, DMARC)
3. Set `RESEND_FROM_EMAIL` to verified address

---

## Monitoring & Maintenance

### Health Checks
- Vercel provides automatic health monitoring
- Supabase dashboard shows database metrics and API usage
- Stripe dashboard shows payment metrics and webhook delivery

### Database Backups
- Supabase provides automatic daily backups (Pro plan)
- Point-in-time recovery available on higher tiers

### Cost Considerations
| Service | Free Tier | Estimated Production |
|---------|-----------|---------------------|
| Vercel | Hobby (sufficient for MVP) | Pro ($20/mo) |
| Supabase | Free (500MB DB, 1GB storage) | Pro ($25/mo) |
| Stripe | 2.9% + 30c per transaction | Pay-as-you-go |
| Anthropic | Pay-per-token | ~$0.01-0.05 per analysis |
| OpenAI | Pay-per-token | ~$0.01-0.10 per analysis |
| Resend | 3,000 emails/mo free | $20/mo at scale |
| Edamam | 100 calls/day free | $0+ (developer tier) |
