-- Mirabee v2 migration: quick-filter chips, shop categories, CRUD policies

alter table categories add column if not exists is_pinned boolean not null default false;

insert into categories (name, is_cogs_default, is_pinned, sort_order) values
  ('Wholesale Flowers', true, true, 10),
  ('Vases', false, true, 11),
  ('Tape', false, true, 12)
on conflict (name) do update set is_pinned = true;

create policy "anon update expenses" on expenses for update using (true);
create policy "anon delete expenses" on expenses for delete using (true);
create policy "anon insert categories" on categories for insert with check (true);