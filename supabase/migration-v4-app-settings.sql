-- Mirabee v4 migration: synced app settings (theme)

create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value) values ('theme', 'default')
on conflict (key) do nothing;

alter table app_settings enable row level security;

create policy "anon read app_settings" on app_settings for select using (true);
create policy "anon insert app_settings" on app_settings for insert with check (true);
create policy "anon update app_settings" on app_settings for update using (true);