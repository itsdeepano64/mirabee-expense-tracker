-- Mirabee v3 migration: category edit and delete (Settings page)

create policy "anon update categories" on categories for update using (true);
create policy "anon delete categories" on categories for delete using (true);