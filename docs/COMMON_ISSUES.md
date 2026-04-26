# Common Issues & Troubleshooting

Things that go wrong, and the fastest path to fixing each one.

---

## Build & dev environment

### `Module not found` after fresh clone
```bash
rm -rf node_modules .next
npm install
npm run dev
```

### TypeScript errors
- Run `npm run typecheck` -- this is what CI runs.
- Confirm the `@/*` alias maps to `./src/*` in `tsconfig.json`.
- Match types with the SDK versions: `@supabase/ssr 0.10.x`, `@supabase/supabase-js 2.101.x`, `@anthropic-ai/sdk 0.82.x`, `openai 6.33.x`, `stripe 22.x`.

### Tailwind styles not applying
- `postcss.config.mjs` must use `@tailwindcss/postcss` (Tailwind 4 plugin).
- Globals are in `src/app/globals.css`.
- Clear caches: `rm -rf .next && npm run dev`.

### Lint fails on CI but not locally
- Lock `eslint` to 9.x and `eslint-config-next` to the same minor as `next` (currently 16.2.x).
- Run `npm run lint` against `src/` only -- generated/.next paths are excluded.

---

## Environment variables

### "Missing environment variable"
- Confirm `.env.local` exists; all required keys are listed in [DEPLOYMENT.md](./DEPLOYMENT.md).
- `NEXT_PUBLIC_*` vars are inlined at build time -- restart `next dev` after editing.
- On Vercel, mirror across Production / Preview / Development scopes.

### Anthropic / OpenAI 401 errors
- The key is wrong, expired, or scoped to a different org.
- Anthropic must support `claude-sonnet-4-20250514` (the model id in `src/lib/anthropic.ts`).
- OpenAI key must have Whisper access.

### Supabase 401 / 403
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Confirm the project isn't paused (Supabase free tier).
- Confirm RLS policies are applied (run migrations).
- The service-role key (`SUPABASE_SERVICE_ROLE_KEY`) is server-side only and bypasses RLS -- never ship it to the client.

---

## Auth

### User stuck on login after signup
- Auto-confirm endpoint `/api/auth/confirm` may have failed -- check function logs.
- Email confirmation may be enabled in Supabase Auth (it should be **disabled**).
- Auth callback URL must be allowlisted: `<domain>/auth/callback`.

### "Invalid login credentials"
- Account doesn't exist (check Supabase Auth dashboard).
- Password is wrong -- run the reset flow.

### Logged in but stuck redirecting to `/onboarding`
- `profiles.onboarding_complete` is `false`.
- The middleware caches the `true` flag in an httpOnly cookie for 1 hour. If you flipped the column manually in the DB, clear cookies before testing.

### Practitioner share link returns "not found"
- `practitioner_access.is_active` is `false` (revoked).
- Token typo or expired -- regenerate from `/dashboard/share`.

---

## AI & API

### Voice transcription fails
- `OPENAI_API_KEY` lacks Whisper access or has no credit.
- Audio above 25 MB (Whisper limit) -- the recorder caps duration to stay safe.
- Microphone permission denied in the browser; on iOS Safari requires a direct user gesture.

### `Analysis timed out` (504)
- Anthropic call exceeded the 25s `aiAbort()` ceiling. Usually a transient model latency spike -- retry once.
- If repeated, check Anthropic status; long prompts (`gut-coach` with very long histories) are most likely to hit it.

### `Model returned an invalid response` (502)
- Claude returned malformed JSON. `extractJsonObject` does balanced-bracket parsing, so this only happens when the model truly fails to produce JSON.
- Usually a transient retry.

### `Too many requests` (429)
- Per-user rate limit (e.g. log analysis at 15/min/user) was hit.
- The limiter is in-process per Fluid Compute instance -- generous, but legitimate. Throttle the client.

### Document upload fails
- Bucket `documents` doesn't exist in Supabase Storage.
- File rejected by `validateFile` -- check MIME (JPEG, PNG, WebP, HEIC, HEIF, PDF) and size (20 MB cap).
- Supabase Storage policies missing for the user's UID prefix.

### Meal plan generation fails
- User has not completed onboarding (no `gut_profile`).
- Anthropic key invalid.
- Cold start -- retry once.

---

## Database

### "Row-level security policy violation"
- Client trying to read someone else's data, or RLS missing on the table.
- Confirm migrations applied; every user-owned table has `auth.uid() = user_id` policy; `food_cache` and `stripe_webhook_events` have **deny-all** -- only the service-role client can touch them.

### Profile not created after signup
- Signup creates the `auth.users` row; the `profiles` row should be inserted by the auto-confirm flow.
- If you find an orphaned `auth.users` without a `profiles`, the upgrade flow will silently no-op -- the webhook now logs `Webhook: userId from metadata does not match any profile`.

### Slow dashboard or history queries
- Confirm `idx_logs_user_date` (and `idx_documents_user_date` for upload-side pages) exists -- migration `20260424000002_logs_documents_indexes.sql`. Without these, Postgres falls back to seq scan past ~10K rows.

---

## Stripe / billing

### Checkout doesn't redirect
- `STRIPE_SECRET_KEY` mismatch (test vs live).
- `STRIPE_CORE_PRICE_ID` / `STRIPE_PRO_PRICE_ID` missing -- price ids are read from env, not committed code.
- `NEXT_PUBLIC_APP_URL` not set -- success/cancel URLs default to a fallback that may not match the deployed domain.

### Webhook never fires (production)
- Webhook endpoint not registered in Stripe Dashboard, or registered against the wrong domain.
- `STRIPE_WEBHOOK_SECRET` mismatch -- the dashboard secret is per-endpoint.
- Check `Developers -> Webhooks -> Recent deliveries` for failure status codes.

### Webhook fires but plan doesn't update
- `metadata.userId` not present on the Checkout Session -- the handler logs and exits.
- The user no longer exists in `profiles`.
- Idempotency dedup hit: if the same `event.id` was already processed, the handler returns `200 {duplicate: true}` without rerunning.

### Subscription downgrade behaves oddly
- `customer.subscription.updated` resolves the new plan from `price_id` first, then falls back to `amount`. If you create a new price and forget to update env vars, the resolver returns null and the plan stays unchanged.
- `cancel_at_period_end = true` flips status to `canceling` until period end -- not `active`, not `canceled`.

### Duplicate upgrade emails
- Should not happen since `stripe_webhook_events` dedup. If you see them, inspect the table for duplicate `event_id` rows -- a missing unique constraint means the migration didn't apply.

---

## UI / mobile

### Bottom navigation overlapping content
- Pages need `pb-24` (96px) bottom padding.
- The `Navigation` component is rendered by the dashboard layout -- it shouldn't appear outside `/dashboard/*`.

### Safe area not working on iPhone
- `viewport-fit=cover` and `themeColor: #000000` are set in `app/layout.tsx`.
- PWA must use `display: standalone` (it does, in `public/manifest.json`).
- Bottom nav uses `pb-safe`.

### Voice recorder broken on Safari/iOS
- Safari requires a direct user gesture to start `MediaRecorder` -- ensure the record button calls `getUserMedia` synchronously in the click handler, not after an `await`.

### Hero video slow to start
- The MP4 must have `faststart` (moov atom moved up) -- the committed file does. If you replace it, re-encode with `ffmpeg -movflags +faststart`.
- Hero video is `preload="auto"` and dark-overlayed; do not switch to `lazy`.

### Animations janky on low-end Android
- The 20-bar voice recorder visualiser uses CSS transitions; reduce bar count if needed.
- The gut score uses `requestAnimationFrame` -- should always be smooth.

---

## Cron / email

### Cron endpoint returns 401
- Header missing or wrong: must send `x-internal-secret: $CRON_SECRET` (constant-time compared, edge-safe).
- `CRON_SECRET` env var unset on the deployment.

### Resend bounces or no emails arrive
- Sending domain not verified; SPF/DKIM/DMARC records missing.
- `RESEND_FROM_EMAIL` set to an address on a non-verified domain.

---

## Production gotchas

- **Cold starts** -- Fluid Compute reuses instances, so cold starts are rarer than classic serverless, but the first request after an idle period can still take a beat. Show loading states.
- **AI latency** -- Claude analysis runs 3-8s typically. The hard ceiling is 25s (`aiAbort`).
- **Cost monitoring** -- AI spend dominates marginal cost; the Edamam cache and prompt-truncation in `truncate()` are the main levers.
- **Service-role key** -- never expose. Used only by the Stripe webhook, food cache, and other RLS-bypass paths in API routes.
- **Stripe API version** -- pinned at `2026-03-25.dahlia` in `src/lib/stripe.ts`. Don't bump opportunistically; webhook payload shapes can shift.

If a fix isn't here, check function logs in Vercel and trace the request id through Supabase logs and Stripe webhook deliveries -- those three together cover almost everything.
