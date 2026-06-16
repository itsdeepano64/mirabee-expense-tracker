-- Mirabee Flowers Expense Tracker schema
-- Run this in the Supabase SQL Editor

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_cogs_default boolean not null default false,
  sort_order int not null default 0
);

insert into categories (name, is_cogs_default, sort_order) values
  ('Flowers & Plants', true, 1),
  ('Supplies', false, 2),
  ('Rent', false, 3),
  ('Utilities', false, 4),
  ('Marketing', false, 5),
  ('Payroll', false, 6),
  ('Other', false, 7);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric(10,2) not null check (amount > 0),
  category_id uuid not null references categories(id),
  description text not null,
  notes text,
  receipt_url text,
  is_cogs boolean not null default false,
  created_at timestamptz not null default now()
);

create index expenses_date_idx on expenses (date desc);
create index expenses_category_idx on expenses (category_id);

alter table categories enable row level security;
alter table expenses enable row level security;

create policy "anon read categories" on categories for select using (true);
create policy "anon read expenses" on expenses for select using (true);
create policy "anon insert expenses" on expenses for insert with check (true);

-- Storage: create a public "receipts" bucket in the Supabase dashboard,
-- then add policies allowing anon SELECT and INSERT on receipts/*