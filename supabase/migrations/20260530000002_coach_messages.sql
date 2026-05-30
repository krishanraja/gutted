-- Persisted AI coach threads so the coach remembers across sessions and can open
-- proactively. Additive; RLS owner-scoped like every other user table.
create table if not exists coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table coach_messages enable row level security;

drop policy if exists "Users own their coach messages" on coach_messages;
create policy "Users own their coach messages" on coach_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_coach_messages_user_created
  on coach_messages(user_id, created_at desc);
