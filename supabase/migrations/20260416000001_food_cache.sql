-- Edamam food lookup cache. Cuts API spend by reusing prior responses
-- for the same normalized query. Rows older than 30 days are ignored at
-- read time; a future cron can prune them.

create table food_cache (
  query_normalized text primary key,
  food_data jsonb not null,
  hit_count integer not null default 1,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now()
);

create index idx_food_cache_created_at on food_cache(created_at);

-- Server-only table. Clients must never read or write it directly, so
-- enable RLS with a deny-all policy; the API route uses the service
-- client (which bypasses RLS) for cache reads and writes.
alter table food_cache enable row level security;
create policy "Deny all (service role bypasses)" on food_cache for all using (false) with check (false);
