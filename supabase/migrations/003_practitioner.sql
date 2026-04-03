-- Practitioner portal

create table practitioner_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  practitioner_email text not null,
  practitioner_name text,
  access_token text unique not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  last_accessed_at timestamptz
);

alter table practitioner_access enable row level security;
create policy "Users manage their practitioner access" on practitioner_access for all using (auth.uid() = user_id);

create index idx_practitioner_token on practitioner_access(access_token);
