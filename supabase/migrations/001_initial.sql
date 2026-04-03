-- gutted. initial schema

create table profiles (
  id uuid references auth.users primary key,
  email text,
  name text,
  plan text default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  gut_profile jsonb default '{}',
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

create table logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text,
  content text,
  audio_url text,
  gut_score integer,
  ai_analysis jsonb,
  logged_at timestamptz default now(),
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text,
  file_url text,
  file_name text,
  ai_interpretation text,
  biomarkers jsonb,
  recommendations jsonb,
  uploaded_at timestamptz default now()
);

create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  week_start date,
  plan jsonb,
  generated_at timestamptz default now()
);

alter table profiles enable row level security;
alter table logs enable row level security;
alter table documents enable row level security;
alter table meal_plans enable row level security;

create policy "Users own their profile" on profiles for all using (auth.uid() = id);
create policy "Users own their logs" on logs for all using (auth.uid() = user_id);
create policy "Users own their documents" on documents for all using (auth.uid() = user_id);
create policy "Users own their meal plans" on meal_plans for all using (auth.uid() = user_id);

-- Storage bucket (run separately in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
