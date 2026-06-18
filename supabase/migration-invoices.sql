-- Run this in your Supabase SQL editor

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_at       timestamptz   NOT NULL DEFAULT now(),
  invoice_number text          NOT NULL,
  client_name    text          NOT NULL,
  total          numeric(10,2) NOT NULL DEFAULT 0,
  status         text          NOT NULL DEFAULT 'draft',
  amount_paid    numeric(10,2),
  payment_notes  text,
  paid_at        timestamptz,
  data           jsonb         NOT NULL DEFAULT '{}',
  created_at     timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_all" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- Single-row table for From info (Jenni's business details)
CREATE TABLE IF NOT EXISTS invoice_from_info (
  id           integer PRIMARY KEY DEFAULT 1,
  from_name    text,
  from_email   text,
  from_phone   text,
  from_address text,
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE invoice_from_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "from_info_all" ON invoice_from_info FOR ALL USING (true) WITH CHECK (true);

-- Seed the single row so upserts always work
INSERT INTO invoice_from_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
