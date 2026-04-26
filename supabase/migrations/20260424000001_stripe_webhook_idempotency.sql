-- Stripe may redeliver the same webhook event on transient 5xx. Without a
-- dedup layer, `checkout.session.completed` would send duplicate upgrade
-- emails and rewrite `current_period_end` on every replay. This table
-- records the `event.id` of every successfully-handled event so the
-- webhook handler can fast-path-return on replay.

create table if not exists stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create index if not exists idx_stripe_webhook_events_processed_at
  on stripe_webhook_events(processed_at);

-- Server-only (webhook uses the service client which bypasses RLS).
alter table stripe_webhook_events enable row level security;

drop policy if exists "Deny all (service role bypasses)" on stripe_webhook_events;
create policy "Deny all (service role bypasses)" on stripe_webhook_events
  for all using (false) with check (false);
