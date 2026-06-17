"use client";

import { useState } from "react";
import { Plus, ChevronRight, Eye, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import type { SavedInvoice } from "@/components/invoices/invoice-history";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

const STATUS_COLOR: Record<string, string> = {
  draft:   "var(--mb-text-soft)",
  sent:    "var(--mb-blue)",
  paid:    "var(--mb-green)",
  partial: "var(--mb-pink)",
};

type Props = {
  saved: SavedInvoice[];
  onNew: () => void;
  onEdit: (inv: SavedInvoice) => void;
  onUpdate: (id: string, updates: Partial<SavedInvoice>) => void;
};

export function InvoiceList({ saved, onNew, onEdit, onUpdate }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewInv, setPreviewInv] = useState<SavedInvoice | null>(null);
  const [payingId,   setPayingId]   = useState<string | null>(null);
  const [payAmount,  setPayAmount]  = useState("");
  const [payNotes,   setPayNotes]   = useState("");

  function openPayForm(inv: SavedInvoice) {
    setPayingId(inv.id);
    setPayAmount(String(inv.total));
    setPayNotes(inv.paymentNotes ?? "");
  }

  function savePayment(inv: SavedInvoice) {
    const amount = parseFloat(payAmount) || inv.total;
    onUpdate(inv.id, {
      status: "paid",
      amountPaid: amount,
      paymentNotes: payNotes.trim() || undefined,
      paidAt: new Date().toISOString(),
    });
    setPayingId(null);
  }

  return (
    <>
      {previewInv && (
        <InvoicePreview invoice={previewInv} onClose={() => setPreviewInv(null)} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--mb-text)", lineHeight: 1.1 }}>Invoices</h1>
            <p style={{ fontSize: 12, color: "var(--mb-text-muted)", marginTop: 2 }}>
              {saved.length} invoice{saved.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            type="button"
            onClick={onNew}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "linear-gradient(135deg, var(--mb-blue), var(--mb-blue-dark))",
              color: "white", border: "none", borderRadius: 14,
              padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 3px 12px rgba(107,168,186,0.35)",
            }}
          >
            <Plus size={16} /> New Invoice
          </button>
        </div>

        {/* Empty state */}
        {saved.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🌸</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--mb-text)", marginBottom: 6 }}>No invoices yet</p>
            <p style={{ fontSize: 13, color: "var(--mb-text-muted)", marginBottom: 24 }}>
              Create your first invoice for a client.
            </p>
            <button
              type="button"
              onClick={onNew}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "linear-gradient(135deg, var(--mb-blue), var(--mb-blue-dark))",
                color: "white", border: "none", borderRadius: 14,
                padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              <Plus size={16} /> Create Invoice
            </button>
          </div>
        )}

        {/* Invoice cards */}
        {saved.length > 0 && (
          <div className="mb-card" style={{ overflow: "hidden" }}>
            {saved.map((inv, idx) => {
              const days = daysSince(inv.savedAt);
              const isPartial = inv.amountPaid != null && inv.amountPaid < inv.total;
              const remaining = isPartial ? inv.total - (inv.amountPaid ?? 0) : 0;
              const isOverdue = inv.status !== "paid" && days > 30;
              const dotColor = inv.status === "paid"
                ? (isPartial ? STATUS_COLOR.partial : STATUS_COLOR.paid)
                : STATUS_COLOR[inv.status] ?? "var(--mb-text-soft)";
              const statusLabel = inv.status === "paid" && isPartial ? "Partial" : inv.status;

              return (
                <div key={inv.id}>
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedId(expandedId === inv.id ? null : inv.id);
                      setPayingId(null);
                    }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "14px 16px", border: "none", cursor: "pointer",
                      textAlign: "left",
                      borderBottom: idx < saved.length - 1 && expandedId !== inv.id
                        ? "1px solid var(--mb-border)" : "none",
                      background: expandedId === inv.id ? "var(--mb-blue-xlight)" : "transparent",
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: dotColor }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mb-text)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {inv.clientName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--mb-text-muted)", marginTop: 2 }}>
                        {inv.invoiceNumber} &middot; {format(new Date(inv.savedAt), "MMM d, yyyy")}
                        &nbsp;&middot;&nbsp;
                        <span style={{ color: isOverdue ? "var(--mb-pink)" : "var(--mb-text-soft)", fontWeight: isOverdue ? 700 : 400 }}>
                          {days === 0 ? "today" : `${days}d ago`}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--mb-text)" }}>{fmt(inv.total)}</div>
                      <div style={{ fontSize: 10, color: dotColor, textTransform: "capitalize", marginTop: 1, fontWeight: 600 }}>
                        {statusLabel}
                      </div>
                    </div>

                    <ChevronRight
                      size={15}
                      color="var(--mb-text-muted)"
                      style={{ flexShrink: 0, transform: expandedId === inv.id ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
                    />
                  </button>

                  {/* Expanded panel */}
                  {expandedId === inv.id && (
                    <div style={{
                      padding: "12px 16px 16px",
                      borderBottom: idx < saved.length - 1 ? "1px solid var(--mb-border)" : "none",
                      background: "var(--mb-blue-xlight)",
                      display: "flex", flexDirection: "column", gap: 10,
                    }}>

                      {/* Payment info */}
                      {inv.status === "paid" && (
                        <div style={{
                          borderRadius: 10, padding: "10px 14px",
                          background: isPartial ? "var(--mb-pink-light)" : "var(--mb-green-light)",
                          border: `1.5px solid ${isPartial ? "var(--mb-pink)" : "var(--mb-green)"}`,
                          display: "flex", flexDirection: "column", gap: 3,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <CheckCircle2 size={14} color={isPartial ? "var(--mb-pink)" : "var(--mb-green)"} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: isPartial ? "var(--mb-pink)" : "var(--mb-green-dark)" }}>
                              {isPartial
                                ? `Partial payment — ${fmt(inv.amountPaid ?? 0)} received`
                                : `Paid in full — ${fmt(inv.amountPaid ?? inv.total)}`}
                            </span>
                          </div>
                          {isPartial && (
                            <div style={{ fontSize: 11, color: "var(--mb-text-muted)", paddingLeft: 20 }}>
                              Balance remaining: {fmt(remaining)}
                            </div>
                          )}
                          {inv.paymentNotes && (
                            <div style={{ fontSize: 11, color: "var(--mb-text-muted)", paddingLeft: 20 }}>{inv.paymentNotes}</div>
                          )}
                          {inv.paidAt && (
                            <div style={{ fontSize: 10, color: "var(--mb-text-soft)", paddingLeft: 20 }}>
                              Recorded {format(new Date(inv.paidAt), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mark as paid */}
                      {inv.status !== "paid" && (
                        payingId === inv.id ? (
                          <div style={{
                            borderRadius: 10, padding: "12px 14px",
                            background: "var(--mb-green-light)", border: "1.5px solid var(--mb-green)",
                            display: "flex", flexDirection: "column", gap: 8,
                          }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--mb-green-dark)" }}>Record Payment</p>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 600, color: "var(--mb-text-muted)", display: "block", marginBottom: 3 }}>
                                Amount Received
                              </label>
                              <input className="mb-field" type="number" min="0" step="0.01"
                                value={payAmount} onChange={(e) => setPayAmount(e.target.value)} style={{ fontSize: 13 }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 600, color: "var(--mb-text-muted)", display: "block", marginBottom: 3 }}>
                                Notes
                              </label>
                              <input className="mb-field" placeholder="e.g. Cash, Venmo @jenni, Check #1234..."
                                value={payNotes} onChange={(e) => setPayNotes(e.target.value)} style={{ fontSize: 13 }} />
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button type="button" onClick={() => savePayment(inv)}
                                style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10,
                                  background: "var(--mb-green)", color: "white",
                                  fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                Save Payment
                              </button>
                              <button type="button" onClick={() => setPayingId(null)}
                                style={{ padding: "10px 14px", borderRadius: 10,
                                  border: "1.5px solid var(--mb-border-strong)", background: "transparent",
                                  fontSize: 13, fontWeight: 600, color: "var(--mb-text-muted)", cursor: "pointer" }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button type="button" onClick={() => openPayForm(inv)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                              width: "100%", padding: "11px 0",
                              border: "1.5px solid var(--mb-green)", borderRadius: "var(--mb-r-lg)",
                              background: "var(--mb-green-light)",
                              fontSize: 13, fontWeight: 700, color: "var(--mb-green-dark)", cursor: "pointer",
                            }}>
                            <CheckCircle2 size={15} /> Mark as Paid
                          </button>
                        )
                      )}

                      {/* View invoice */}
                      <button type="button" onClick={() => setPreviewInv(inv)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          width: "100%", padding: "11px 0",
                          border: "1.5px solid var(--mb-blue-light)", borderRadius: "var(--mb-r-lg)",
                          background: "var(--mb-card)",
                          fontSize: 13, fontWeight: 700, color: "var(--mb-blue)", cursor: "pointer",
                        }}>
                        <Eye size={15} /> View Invoice
                      </button>

                      {/* Edit */}
                      <button type="button" onClick={() => onEdit(inv)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          width: "100%", padding: "11px 0",
                          border: "1.5px solid var(--mb-border-strong)", borderRadius: "var(--mb-r-lg)",
                          background: "transparent",
                          fontSize: 13, fontWeight: 700, color: "var(--mb-text-muted)", cursor: "pointer",
                        }}>
                        Edit &amp; Re-issue
                      </button>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
