"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Plus, ChevronRight, Download } from "lucide-react";
import { format } from "date-fns";
import type { SavedInvoice } from "@/components/invoices/invoice-history";
import type { InvoiceData } from "@/lib/pdf/invoice-document";

const RedownloadButton = dynamic(
  () => import("@/components/invoices/invoice-download-button").then((m) => m.InvoiceDownloadButton),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 44, borderRadius: 12, background: "var(--mb-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 600, color: "var(--mb-text-muted)" }}>
        <Download size={14} style={{ marginRight: 6 }} /> Loading...
      </div>
    ),
  }
);

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function logoUrl() {
  if (typeof window === "undefined") return "/mirabee-flowers-logo.png";
  return `${window.location.origin}/mirabee-flowers-logo.png`;
}

const STATUS_COLOR: Record<string, string> = {
  draft: "var(--mb-text-soft)",
  sent:  "var(--mb-blue)",
  paid:  "var(--mb-green)",
};

type Props = {
  saved: SavedInvoice[];
  onNew: () => void;
  onEdit: (inv: SavedInvoice) => void;
};

export function InvoiceList({ saved, onNew, onEdit }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
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
          {saved.map((inv, idx) => (
            <div key={inv.id}>
              {/* Row */}
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", border: "none", cursor: "pointer",
                  textAlign: "left",
                  borderBottom: idx < saved.length - 1 && expandedId !== inv.id
                    ? "1px solid var(--mb-border)" : "none",
                  background: expandedId === inv.id ? "var(--mb-blue-xlight)" : "transparent",
                }}
              >
                {/* Status dot */}
                <div style={{
                  width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                  background: STATUS_COLOR[inv.status] ?? "var(--mb-text-soft)",
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--mb-text)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {inv.clientName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--mb-text-muted)", marginTop: 2 }}>
                    {inv.invoiceNumber} &middot; {format(new Date(inv.savedAt), "MMM d, yyyy")}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--mb-text)" }}>{fmt(inv.total)}</div>
                  <div style={{ fontSize: 10, color: STATUS_COLOR[inv.status], textTransform: "capitalize", marginTop: 1, fontWeight: 600 }}>
                    {inv.status}
                  </div>
                </div>

                <ChevronRight
                  size={15}
                  color="var(--mb-text-muted)"
                  style={{ flexShrink: 0, transform: expandedId === inv.id ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
                />
              </button>

              {/* Expanded actions */}
              {expandedId === inv.id && (
                <div style={{
                  padding: "12px 16px 16px",
                  borderBottom: idx < saved.length - 1 ? "1px solid var(--mb-border)" : "none",
                  background: "var(--mb-blue-xlight)",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <RedownloadButton
                    data={{ ...inv.data, logoUrl: logoUrl() }}
                    onDownload={() => {}}
                  />
                  <button
                    type="button"
                    onClick={() => onEdit(inv)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      width: "100%", padding: "11px 0",
                      border: "1.5px solid var(--mb-border-strong)",
                      borderRadius: "var(--mb-r-lg)",
                      background: "transparent",
                      fontSize: 13, fontWeight: 700, color: "var(--mb-text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    Edit &amp; Re-issue
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
