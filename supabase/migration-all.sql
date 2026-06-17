-- Mirabee Expense Tracker — run once in Supabase SQL Editor
-- Idempotent: safe to re-run on a partial or fresh database (after schema.sql)

-- ── v2: pinned categories, expense update/delete, category insert ──
alter table categories add column if not exists is_pinned boolean not null default false;

insert into categories (name, is_cogs_default, is_pinned, sort_order) values
  ('Wholesale Flowers', true, true, 10),
  ('Vases', false, true, 11),
  ('Tape', false, true, 12)
on conflict (name) do update set is_pinned = true;

do $$ begin
  create policy "anon update expenses" on expenses for update using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "anon delete expenses" on expenses for delete using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "anon insert categories" on categories for insert with check (true);
exception when duplicate_object then null;
end $$;

-- ── v3: category edit and delete ──
do $$ begin
  create policy "anon update categories" on categories for update using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "anon delete categories" on categories for delete using (true);
exception when duplicate_object then null;
end $$;

-- ── v4: app settings (theme sync) ──
create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value) values ('theme', 'default')
on conflict (key) do nothing;

alter table app_settings enable row level security;

do $$ begin
  create policy "anon read app_settings" on app_settings for select using (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "anon insert app_settings" on app_settings for insert with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "anon update app_settings" on app_settings for update using (true);
exception when duplicate_object then null;
end $$;