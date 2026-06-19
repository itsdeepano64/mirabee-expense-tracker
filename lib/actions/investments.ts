"use server";

import { createServerClient } from "@/lib/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Investment = {
  id:        string;
  amount:    number;
  date:      string;       // YYYY-MM-DD
  fromName:  string | undefined;
  notes:     string | undefined;
  createdAt: string;
};

// ── Actions ───────────────────────────────────────────────────────────────────

export async function getInvestments(
  startDate?: string,
  endDate?: string
): Promise<{ investments: Investment[]; ok: boolean; error?: string }> {
  const supabase = createServerClient();
  let query = supabase
    .from("investments")
    .select("*")
    .order("date", { ascending: false });
  if (startDate) query = query.gte("date", startDate);
  if (endDate)   query = query.lte("date", endDate);
  const { data, error } = await query;
  if (error) return { investments: [], ok: false, error: error.message };
  return {
    investments: (data ?? []).map((r) => ({
      id:        r.id,
      amount:    Number(r.amount),
      date:      r.date,
      fromName:  r.from_name  ?? undefined,
      notes:     r.notes      ?? undefined,
      createdAt: r.created_at,
    })),
    ok: true,
  };
}

export async function addInvestment(
  inv: Omit<Investment, "id" | "createdAt">
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from("investments").insert({
    amount:    inv.amount,
    date:      inv.date,
    from_name: inv.fromName ?? null,
    notes:     inv.notes    ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteInvestment(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServerClient();
  const { error } = await supabase.from("investments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
