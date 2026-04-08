# Common Issues & Troubleshooting

## Development Issues

### Build Errors

**"Module not found" after fresh clone**
```bash
rm -rf node_modules .next
npm install
npm run dev
```

**TypeScript errors on build**
- Ensure TypeScript 5.x is installed
- Run `npm run lint` to catch issues early
- Check `tsconfig.json` path aliases (`@/*` → `./src/*`)

**Tailwind styles not applying**
- Verify `postcss.config.mjs` uses `@tailwindcss/postcss`
- Check that `globals.css` imports Tailwind directives
- Clear `.next` cache: `rm -rf .next && npm run dev`

---

### Environment & Configuration

**"Missing environment variable" errors**
- Copy `.env.example` to `.env.local` (or create `.env.local`)
- Ensure all required variables are set (see DEPLOYMENT.md)
- `NEXT_PUBLIC_` variables must be present at build time, not just runtime

**Supabase connection failing**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check Supabase project status in dashboard (not paused)
- Ensure RLS policies are applied (run migration file)

**Stripe webhooks not firing locally**
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output (starts with `whsec_`)

---

### Authentication Issues

**Users stuck on login page after signing up**
- Check that `/api/auth/confirm` auto-confirm endpoint is working
- Verify Supabase Auth settings (email confirmation may need to be disabled)
- Check callback URL is correctly configured: `/auth/callback`

**Google OAuth not working**
- Verify Google OAuth credentials in Supabase Auth settings
- Ensure redirect URI matches: `https://<your-domain>/auth/callback`
- Check that Google Cloud Console has the correct authorized origins

**"Invalid login credentials" error**
- User may not exist -- check Supabase Auth dashboard
- Password may be wrong -- use forgot password flow
- Account may have been created with OAuth (no password set)

---

### AI & API Issues

**Voice transcription failing**
- Check `OPENAI_API_KEY` is valid and has credit
- Ensure audio is being recorded in WebM format
- File size must be under 25MB (Whisper limit)
- Check browser microphone permissions

**Document analysis returning errors**
- Verify `OPENAI_API_KEY` has GPT-4o access
- Check file format is supported (JPG, PNG, HEIC, WebP, PDF)
- Ensure Supabase Storage bucket `documents` exists
- File must upload successfully before analysis begins

**Meal plan generation failing**
- Check `ANTHROPIC_API_KEY` is valid
- Ensure user has completed onboarding (gut_profile must exist)
- API may timeout on cold starts -- retry after a moment
- Check for rate limiting on Anthropic API

**"429 Too Many Requests" from AI APIs**
- Reduce concurrent requests
- Implement client-side rate limiting
- Check API usage dashboards for quota status

---

### UI & Mobile Issues

**Bottom navigation overlapping content**
- Ensure pages have `pb-24` (96px) bottom padding
- Check that `Navigation` component is only rendered on dashboard pages

**Safe area not working on iPhone**
- Verify `viewport-fit=cover` is set in layout metadata
- Check that `pb-safe` class is applied to navigation
- PWA mode must use `display: standalone` in manifest

**Voice recorder not working on Safari/iOS**
- Safari requires user gesture to start MediaRecorder
- Ensure the record button triggers recording directly (not via async)
- Check microphone permissions in iOS Settings

**Animations janky on low-end devices**
- GutScore animation uses `requestAnimationFrame` -- should be smooth
- Frequency bars use CSS transitions -- reduce count if needed
- Consider `will-change: transform` for animated elements

---

### Database Issues

**"Row level security policy violation"**
- User is trying to access data they don't own
- Check that the Supabase client is authenticated (has valid session)
- Verify RLS policies in `001_initial.sql` are applied

**Profile not created after signup**
- The `profiles` table insert may have failed
- Check that the signup flow creates a profile record
- Verify the profile `id` matches `auth.users.id`

**Meal plans not saving**
- Check `meal_plans` table exists and RLS policy is correct
- Verify `week_start` is a valid date
- Ensure `plan` JSONB is valid JSON

---

### Payment Issues

**Stripe checkout not redirecting**
- Verify `STRIPE_SECRET_KEY` is correct (test vs. live mode)
- Check that price IDs in `src/lib/stripe.ts` match Stripe Dashboard
- Ensure `NEXT_PUBLIC_SITE_URL` is set for redirect URLs

**Webhook not updating user plan**
- Check `STRIPE_WEBHOOK_SECRET` matches the endpoint secret
- Verify webhook events are configured: `checkout.session.completed`, `customer.subscription.deleted`
- Check Stripe Dashboard → Webhooks → Recent deliveries for errors
- Ensure `metadata.userId` is being passed in checkout session

**User shows wrong plan after upgrade**
- Webhook may be delayed -- check Stripe webhook delivery logs
- Verify the webhook handler updates the correct user profile
- Clear any client-side caching and refresh

---

## Production Gotchas

### Performance
- **Cold starts:** Serverless functions may take 1-3s on first request after inactivity
- **AI latency:** Claude analysis takes 3-8s, GPT-4o vision takes 5-15s -- show loading states
- **Audio upload:** Large recordings need the 10MB server action limit

### Security
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Always verify Stripe webhook signatures
- File uploads should validate type and size server-side
- RLS must be enabled on all tables -- never bypass it

### Costs
- Monitor AI API usage -- each log analysis and meal plan generation costs tokens
- Supabase free tier has limits (500MB DB, 1GB storage, 50K auth users)
- Stripe takes 2.9% + 30c per transaction
