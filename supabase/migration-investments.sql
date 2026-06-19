-- Run this in your Supabase SQL editor (project: uhaasbgdpptiaunfzjjp.supabase.co)

CREATE TABLE IF NOT EXISTS investments (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  amount      numeric(10,2) NOT NULL,
  date        date          NOT NULL DEFAULT CURRENT_DATE,
  from_name   text,
  notes       text,
  created_at  timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investments_all" ON investments FOR ALL USING (true) WITH CHECK (true);

-- Allow anon role (used by the app's server client)
GRANT ALL ON TABLE public.investments TO anon;
NOTIFY pgrst, 'reload schema';
