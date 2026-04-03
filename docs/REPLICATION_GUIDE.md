# Replication Guide

## How to Set Up gutted. from Scratch

This guide walks through setting up a complete local development environment and deploying gutted. to production.

---

## Prerequisites

- **Node.js** 18.x or later
- **npm** 9.x or later
- **Git**
- **Accounts needed:**
  - [Supabase](https://supabase.com) (free tier)
  - [Stripe](https://stripe.com) (free test mode)
  - [OpenAI](https://platform.openai.com) (paid — needs GPT-4o and Whisper access)
  - [Anthropic](https://console.anthropic.com) (paid — needs Claude API access)
  - [Resend](https://resend.com) (free tier — 3,000 emails/mo)
  - [Edamam](https://developer.edamam.com) (free developer tier)
  - [Vercel](https://vercel.com) (free hobby tier for deployment)

---

## Step 1: Clone & Install

```bash
git clone <repository-url>
cd gutted
npm install
```

---

## Step 2: Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users
3. Set a strong database password
4. Note your **Project URL** and **Anon Key** from Settings → API

### Run Database Migration
1. Go to Supabase Dashboard → SQL Editor
2. Paste the contents of `supabase/migrations/001_initial.sql`
3. Run the query — this creates all tables and RLS policies

### Configure Authentication
1. Go to Authentication → Providers
2. Enable **Email** (disable email confirmation for auto-confirm flow)
3. Enable **Google** OAuth:
   - Create OAuth credentials in Google Cloud Console
   - Add authorized redirect URI: `https://<your-supabase-url>/auth/v1/callback`
   - Paste Client ID and Secret into Supabase
4. Go to Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (dev) or `https://your-domain.com` (prod)
   - Redirect URLs: add `http://localhost:3000/auth/callback` and `https://your-domain.com/auth/callback`

### Configure Storage
1. Go to Storage → New Bucket
2. Create bucket named `documents`
3. Set to **Private**
4. Add policy: Authenticated users can INSERT to `documents/{auth.uid}/*`
5. Add policy: Authenticated users can SELECT from `documents/{auth.uid}/*`

---

## Step 3: Stripe Setup

### Create Products
1. Go to Stripe Dashboard → Products
2. Create **"Core Plan"**:
   - Price: $9.00/month (recurring)
   - Copy the **Price ID** (starts with `price_`)
3. Create **"Pro Plan"**:
   - Price: $19.00/month (recurring)
   - Copy the **Price ID**

### Update Price IDs
Edit `src/lib/stripe.ts` and replace the price IDs with your own:
```typescript
export const PLANS = {
  core: { priceId: 'price_YOUR_CORE_ID', ... },
  pro: { priceId: 'price_YOUR_PRO_ID', ... },
}
```

### Set Up Webhooks (Production)
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.deleted`
4. Copy the **Signing Secret** (starts with `whsec_`)

### Local Webhook Testing
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://stripe.com/docs/stripe-cli

# Forward events to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook signing secret from the output
```

---

## Step 4: API Keys

### OpenAI
1. Go to [platform.openai.com](https://platform.openai.com) → API Keys
2. Create a new API key
3. Ensure your account has access to GPT-4o and Whisper

### Anthropic
1. Go to [console.anthropic.com](https://console.anthropic.com) → API Keys
2. Create a new API key
3. Ensure your account has access to Claude 3.5 Sonnet

### Resend
1. Go to [resend.com](https://resend.com) → API Keys
2. Create a new API key
3. (Optional) Verify a custom domain for sending

### Edamam
1. Go to [developer.edamam.com](https://developer.edamam.com)
2. Sign up for the Food Database API
3. Note your **App ID** and **App Key**

---

## Step 5: Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# Resend
RESEND_API_KEY=re_your-key
RESEND_FROM_EMAIL=hello@yourdomain.com

# Edamam
EDAMAM_APP_ID=your-app-id
EDAMAM_APP_KEY=your-app-key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Step 6: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the landing page.

### Verify the Setup
1. **Sign up** with email/password → Should redirect to onboarding
2. **Complete onboarding** → Should redirect to dashboard
3. **Voice log** → Record, transcribe, get AI analysis with gut score
4. **Upload a document** → Drag-drop an image, get AI interpretation
5. **Generate meal plan** → Should produce a 7-day personalized plan
6. **Stripe checkout** → Click upgrade, complete test payment (use `4242 4242 4242 4242`)

---

## Step 7: Deploy to Production

### Vercel
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select your repository
4. Add all environment variables (use production values):
   - Change `NEXT_PUBLIC_SITE_URL` to your domain
   - Change `STRIPE_SECRET_KEY` to live key
   - Update Stripe webhook secret for production endpoint
5. Deploy

### Post-Deployment
1. Update Supabase Auth redirect URLs to include your production domain
2. Add production webhook endpoint in Stripe
3. Verify Resend domain for production email sending
4. Test the full flow on the production URL

---

## Project Structure Reference

```
gutted/
├── public/              # Static assets (logo, icon, video)
├── src/
│   ├── app/             # Next.js App Router (pages + API routes)
│   ├── components/      # React components
│   └── lib/             # API clients and utilities
├── supabase/
│   └── migrations/      # Database schema
├── docs/                # Project documentation
├── package.json
├── next.config.ts
├── tsconfig.json
└── .env.local           # Your environment variables (not committed)
```

---

## Common Setup Issues

| Issue | Solution |
|-------|---------|
| `NEXT_PUBLIC_` vars not working | They must be set at build time, not just runtime |
| Supabase RLS blocking queries | Run the migration file to create RLS policies |
| Whisper transcription failing | Check OpenAI key has credit and Whisper access |
| Stripe webhook errors locally | Use `stripe listen --forward-to` for local dev |
| Google OAuth redirect error | Add exact callback URL in both Google Console and Supabase |
| Document upload failing | Create `documents` bucket in Supabase Storage |

See `docs/COMMON_ISSUES.md` for comprehensive troubleshooting.
