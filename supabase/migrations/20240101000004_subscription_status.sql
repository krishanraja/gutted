-- Add subscription status tracking to profiles
alter table profiles add column if not exists subscription_status text;
alter table profiles add column if not exists current_period_end timestamptz;
