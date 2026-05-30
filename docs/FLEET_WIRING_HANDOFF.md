# Mindmaker OS Wiring Handoff: gutted.

Purpose: everything the Mindmaker OS session needs to verify and finish so gutted.'s attribution closes the loop and the fleet can sell, attribute, and read back revenue. gutted's side is built and live in production; emission is dark until the OS provides two environment variables.

Date: 2026-05-30. gutted Supabase ref `hzadscrqmyilbisexvyz`. gutted Vercel project `prj_rvRzNffIs1QVoQZRVvxSSp7Y8Sv1`. Stripe account `mindmaker_llc`. Warehouse = Mindmaker OS Supabase `gojpffsrxybbpbdzzrvs`.

## Live in gutted prod (no OS action needed)
- Product truth (runtime source of truth for the fleet): `GET https://www.gutted.app/api/product-truth`, versioned `gutted.product-truth/1`, capability-only, pricing read from the authoritative PLANS object.
- Discovery: `https://www.gutted.app/llms.txt`; `robots.txt` carve-out allows `/api/product-truth`, `/llms.txt`, `/.well-known/`.
- Human-readable sell/market source: `docs/AGENT_BRIEFING.md`.
- Streaming AI coach (token-by-token).
- `profiles.attribution` jsonb column on gutted's own DB (migrated, RLS intact).
- First-party UTM capture, persisted to `profiles.attribution` at signup and OAuth, stamped onto Stripe session and subscription metadata.
- Emit code for six lifecycle events, gated behind a feature flag (currently a safe no-op).

## What gutted EMITS (the contract the OS ingest must accept)
- Transport: HTTP `POST` to `ATTRIBUTION_INGEST_URL`, header `x-attribution-secret: <ATTRIBUTION_INGEST_SECRET>`, JSON body, 4s timeout, fire-and-forget (never blocks the user).
- Envelope, `schema_version` = `attribution.events/1`:
  `{ schema_version, app: "gutted", stripe_account: "mindmaker_llc", event_name, occurred_at (ISO 8601), idempotency_key, anonymous_id, user_id, utm: { source, medium, campaign, content, term }, referrer, landing_path, stripe_customer_id, stripe_subscription_id, value_cents, currency }`
- `user_id` is an OPAQUE Supabase uuid. Never email, never name.
- `event_name` is one of: `landed`, `signed_up`, `activated`, `purchased`, `refunded`, `churned`.
  - `landed`, `signed_up`: fired from the frontend through gutted's own `/api/attribution` route, which keeps the secret server-side and attaches `user_id`.
  - `purchased`, `refunded`, `churned`: fired from the signature-verified Stripe webhook after the idempotency insert.
  - `activated`: reserved (first analysed log). Not yet emitted; wire later from the first-log path if desired.
- PHI guarantee: a deny-by-default allowlist serializer (`src/lib/attribution.ts`) ships ONLY the fields above. It is structurally impossible for a symptom, gut score, condition, biomarker, email, or name to leave gutted. The warehouse must not expect or store any of those for gutted.

## What the OS must BUILD / PROVIDE (action items)
1. Build the `ingest-attribution` edge function on the OS Supabase (`gojpffsrxybbpbdzzrvs`): validate `x-attribution-secret` (constant-time), rate-limit, idempotent upsert into `attribution.events` keyed on `(app, idempotency_key)`. Migrated ONLY from the OS repo.
2. Create the `attribution` schema plus the read views `funnel_by_campaign` and `revenue_by_campaign` spanning both Stripe accounts. Key revenue on `(stripe_account, app, stripe_customer_id, stripe_subscription_id)` so gutted and siblings on `mindmaker_llc` never cross-attribute.
3. Generate `ATTRIBUTION_INGEST_SECRET`. Set BOTH on gutted's Vercel project (`prj_rvRzNffIs1QVoQZRVvxSSp7Y8Sv1`), then redeploy:
   - `ATTRIBUTION_INGEST_URL` = the ingest function URL
   - `ATTRIBUTION_INGEST_SECRET` = the generated secret
   Setting both flips gutted's emission on.
4. Do NOT give gutted the OS service-role key or DB URL. gutted holds only the ingest URL + secret.

## Stripe wiring (required for purchased / refunded / churned)
- `STRIPE_WEBHOOK_SECRET` is NOT set on gutted's Vercel. Until set, the webhook fails closed (returns 500), so no purchase events flow. Generate it from gutted's webhook endpoint in the `mindmaker_llc` Stripe dashboard and set it on Vercel.
- Subscribe gutted's webhook endpoint to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `charge.refunded`.

## Verification the OS session can run
1. `curl https://www.gutted.app/api/product-truth` returns 200 JSON with `schema_version: "gutted.product-truth/1"`.
2. After setting the two env vars and redeploying: visit gutted with `?utm_source=test&utm_campaign=handoff`, then sign up. Expect a `landed` then a `signed_up` row in `attribution.events` carrying that utm, the `anonymous_id`, and (for `signed_up`) the opaque `user_id`.
3. Run a Stripe test checkout. Expect a `purchased` row with utm + `value_cents`, and confirm the utm landed on the subscription metadata.
4. Confirm `funnel_by_campaign` and `revenue_by_campaign` show gutted rows keyed by `stripe_account = mindmaker_llc`, `app = gutted`.
5. Privacy gate: confirm NO PHI fields are populated for gutted (email, name, symptom, score, condition, biomarker).

## Open / notes
- Outbound lead-gen from gutted is OFF-LIMITS pending a YMYL legal opinion. gutted intentionally emits no email or health context for outbound; revenue-by-campaign does not need it.
- Rotate the Supabase access token `sbp_d44d99383...` (exposed in chat this session).
- gutted is the fleet's rendering reference (already server-rendered); no SPA prerender work was needed.
