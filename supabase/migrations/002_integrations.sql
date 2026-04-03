-- Health platform integrations

create table health_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  source text not null, -- 'apple_health', 'fitbit', 'oura', 'manual'
  metric text not null, -- 'sleep_hours', 'steps', 'hrv', 'resting_hr', 'water_ml', 'exercise_mins'
  value numeric not null,
  recorded_at timestamptz not null,
  created_at timestamptz default now()
);

alter table health_data enable row level security;
create policy "Users own their health data" on health_data for all using (auth.uid() = user_id);

create index idx_health_data_user_date on health_data(user_id, recorded_at desc);

-- Add integrations config to profiles
-- (stored in gut_profile JSONB: { integrations: { apple_health: true, fitbit: { token: ... } } })
