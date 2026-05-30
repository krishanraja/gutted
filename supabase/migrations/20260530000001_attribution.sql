-- First-touch attribution, captured at signup, stamped onto Stripe metadata at
-- checkout, and emitted (revenue-only, no PHI) to the Mindmaker OS warehouse.
--
-- Additive and idempotent. RLS is unchanged: the existing "Users own their
-- profile" policy on profiles already covers every column, including this one.
-- gutted stores only this single jsonb blob in its OWN database; it never
-- migrates or writes warehouse tables.
alter table profiles
  add column if not exists attribution jsonb not null default '{}'::jsonb;

comment on column profiles.attribution is
  'First-touch acquisition context (utm set, referrer, landing_path, anonymous_id). Commercial only, never PHI.';
