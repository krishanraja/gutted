-- Hot-path indexes for queries that already exist in the app.
--
-- `logs(user_id, logged_at desc)`: every dashboard load + history page run a
-- `where user_id = ? order by logged_at desc limit ?` query. Without this
-- index Postgres degrades to a sequential scan on `logs` once the table
-- crosses ~10k rows.
--
-- `documents(user_id, uploaded_at desc)`: same pattern from the upload page,
-- supplements / meal-plan / health-report routes.

create index if not exists idx_logs_user_date
  on logs (user_id, logged_at desc);

create index if not exists idx_documents_user_date
  on documents (user_id, uploaded_at desc);
