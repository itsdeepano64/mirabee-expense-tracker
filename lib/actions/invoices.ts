"use server";

import { createServerClient } from "@/lib/supabase/server";
import type { SavedInvoice } from "@/components/invoices/invoice-history";

// ── Helpers ──────────────────────────────────────────────────────────────────

function rowToInvoice(row: Record<string, unknown>): SavedInvoice {
  return {
    id:            row.id as string,
    savedAt:       row.saved_at as string,
    invoiceNumber: row.invoice_number as string,
    clientName:    row.client_name as string,
    total:         Number(row.total),
    status:        row.status as "draft" | "sent" | "paid",
    amountPaid:    row.amount_paid != null ? Number(row.amount_paid) : undefined,
    paymentNotes:  (row.payment_notes as string | null) ?? undefined,
    paidAt:        (row.paid_at as string | null) ?? undefined,
    data:          row.data as SavedInvoice["data"],
  };
}

function invoiceToRow(inv: SavedInvoice) {
  return {
    id:             inv.id,
    saved_at:       inv.savedAt,
    invoice_number: inv.invoiceNumber,
    client_name:    inv.clientName,
    total:          inv.total,
    status:         inv.status,
    amount_paid:    inv.amountPaid ?? null,
    payment_notes:  inv.paymentNotes ?? null,
    paid_at:        inv.paidAt ?? null,
    data:           inv.data,
  };
}

// ── Invoice actions ───────────────────────────────────────────────────────────

export async function getInvoices(): Promise<SavedInvoice[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("saved_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(rowToInvoice);
}

export async function upsertInvoice(inv: SavedInvoice): Promise<void> {
  const supabase = createServerClient();
  await supabase.from("invoices").upsert(invoiceToRow(inv));
}

export async function updateInvoiceRecord(
  id: string,
  updates: Partial<SavedInvoice>
): Promise<void> {
  const supabase = createServerClient();
  const row: Record<string, unknown> = {};
  if (updates.status       !== undefined) row.status        = updates.status;
  if (updates.amountPaid   !== undefined) row.amount_paid   = updates.amountPaid ?? null;
  if (updates.paymentNotes !== undefined) row.payment_notes = updates.paymentNotes ?? null;
  if (updates.paidAt       !== undefined) row.paid_at       = updates.paidAt ?? null;
  if (updates.data         !== undefined) row.data          = updates.data;
  if (Object.keys(row).length === 0) return;
  await supabase.from("invoices").update(row).eq("id", id);
}

// ── From info actions ─────────────────────────────────────────────────────────

export type FromInfo = {
  fromName: string;
  fromEmail: string;
  fromPhone: string;
  fromAddress: string;
};

export async function getFromInfo(): Promise<FromInfo | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("invoice_from_info")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return null;
  return {
    fromName:    data.from_name    ?? "",
    fromEmail:   data.from_email   ?? "",
    fromPhone:   data.from_phone   ?? "",
    fromAddress: data.from_address ?? "",
  };
}

export async function saveFromInfo(info: FromInfo): Promise<void> {
  const supabase = createServerClient();
  await supabase.from("invoice_from_info").upsert({
    id:           1,
    from_name:    info.fromName,
    from_email:   info.fromEmail,
    from_phone:   info.fromPhone,
    from_address: info.fromAddress,
    updated_at:   new Date().toISOString(),
  });
}
