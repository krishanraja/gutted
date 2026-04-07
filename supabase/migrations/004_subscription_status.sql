-- Add subscription status tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_period_end timestamptz DEFAULT NULL;

COMMENT ON COLUMN profiles.subscription_status IS 'Stripe subscription status: active, past_due, canceled, canceling, or null for free users';
COMMENT ON COLUMN profiles.current_period_end IS 'End of current billing period from Stripe';
