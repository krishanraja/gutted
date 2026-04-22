-- Stores which gut-themed avatar the user picked on the profile page.
-- Plain text id (e.g. 'bloat-balloon') resolved client-side against the
-- AVATAR_OPTIONS registry, so adding new avatars never requires a migration.
alter table profiles add column if not exists avatar_id text;
