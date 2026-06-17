"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Clock, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { InvoiceData } from "@/lib/pdf/invoice-document";

export type SavedInvoice = {
  id: string;
  savedAt: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  status: "draft" | "sent" | "paid";
  data: Omit<InvoiceData, "logoUrl">;
};

const RedownloadButton = dynamic(
  () => import("@/components/invoices/invoice-download-button").then((m) => m.InvoiceDownloadButton),
  { ssr: false, loading: () => <div style={{ height: 40, borderRadius: 12, background: "var(--mb-border)" }} /> }
);

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function logoUrl() {
  if (typeof window === "undefined") return "/mirabee-flowers-logo.png";
  return `${window.location.origin}/mirabee-flowers-logo.png`;
}

export function InvoiceHistory({ saved }: { saved: SavedInvoice[] }) {
  const [open, setOpen]           = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (saved.length === 0) return null;

  return (
    <div className="mb-card" style={{ overflow: "hidden" }}>
      {/* Header toggle */}
      <button type="button" onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={15} color="var(--mb-blue)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text)" }}>Past Invoices</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--mb-blue)",
            background: "var(--mb-blue-xlight)", borderRadius: 20, padding: "1px 8px" }}>
            {saved.length}
          </span>
        </div>
        {open ? <ChevronUp size={16} color="var(--mb-text-muted)" /> : <ChevronDown size={16} color="var(--mb-text-muted)" />}
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--mb-border)" }}>
          {saved.map((inv, idx) => (
            <div key={inv.id}>
              <button type="button"
                onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", textAlign: "left",
                  background: expandedId === inv.id ? "var(--mb-blue-xlight)" : "none",
                  border: "none", cursor: "pointer",
                  borderBottom: expandedId !== inv.id && idx < saved.length - 1 ? "1px solid var(--mb-border)" : "none" }}>
                {/* Status dot */}
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: inv.status === "paid" ? "var(--mb-green)"
                    : inv.status === "sent" ? "var(--mb-blue)" : "var(--mb-text-soft)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {inv.clientName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--mb-text-muted)", marginTop: 1 }}>
                    {inv.invoiceNumber} · {format(new Date(inv.savedAt), "MMM d, yyyy")}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--mb-text)" }}>{fmt(inv.total)}</div>
                  <div style={{ fontSize: 10, color: "var(--mb-text-soft)", textTransform: "capitalize" }}>{inv.status}</div>
                </div>
                <ChevronRight size={14} color="var(--mb-text-muted)" style={{ flexShrink: 0,
                  transform: expandedId === inv.id ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
              </button>

              {expandedId === inv.id && (
                <div style={{ padding: "0 16px 14px", background: "var(--mb-blue-xlight)",
                  borderBottom: idx < saved.length - 1 ? "1px solid var(--mb-border)" : "none" }}>
                  <RedownloadButton data={{ ...inv.data, logoUrl: logoUrl() }} onDownload={() => {}} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
