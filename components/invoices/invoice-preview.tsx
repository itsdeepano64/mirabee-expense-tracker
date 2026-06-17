"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { SavedInvoice } from "@/components/invoices/invoice-history";

const DownloadButton = dynamic(
  () => import("@/components/invoices/invoice-download-button").then((m) => m.InvoiceDownloadButton),
  { ssr: false, loading: () => <div style={{ height: 50 }} /> }
);

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

type Props = {
  invoice: SavedInvoice;
  onClose: () => void;
};

export function InvoicePreview({ invoice, onClose }: Props) {
  const d = invoice.data;
  const subtotal = d.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmt   = d.taxRate ? subtotal * (d.taxRate / 100) : 0;
  const total    = subtotal + taxAmt;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.45)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-end",
    }}
      onClick={onClose}
    >
      {/* Sheet */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 600,
          height: "92dvh",
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        }}
      >
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px 12px",
          borderBottom: "1px solid #EDE4DB",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#3A2F2F" }}>
            Invoice #{d.invoiceNumber}
          </span>
          <button type="button" onClick={onClose}
            style={{ background: "#EDE4DB", border: "none", borderRadius: "50%",
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer" }}>
            <X size={16} color="#7a6e68" />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 18px 32px" }}>

          {/* Header: logo + invoice meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            borderBottom: "2px solid #6BA8BA", paddingBottom: 16, marginBottom: 20 }}>
            <Image src="/mirabee-flowers-logo.png" alt="Mirabee Flowers"
              width={90} height={90} style={{ objectFit: "contain" }} unoptimized />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#6BA8BA", letterSpacing: 2 }}>INVOICE</div>
              <div style={{ fontSize: 12, color: "#7a6e68", marginTop: 3 }}>#{d.invoiceNumber}</div>
              <div style={{ fontSize: 11, color: "#7a6e68", marginTop: 2 }}>
                Issued: {format(parseISO(d.issueDate), "MMMM d, yyyy")}
              </div>
              {d.dueDate && (
                <div style={{ fontSize: 11, fontWeight: 700, color: "#3A2F2F", marginTop: 2 }}>
                  Due: {format(parseISO(d.dueDate), "MMMM d, yyyy")}
                </div>
              )}
            </div>
          </div>

          {/* From / Bill To */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "FROM", name: d.fromName, email: d.fromEmail, phone: d.fromPhone, address: d.fromAddress },
              { label: "BILL TO", name: d.clientName, email: d.clientEmail, phone: d.clientPhone, address: d.clientAddress },
            ].map((p) => (
              <div key={p.label} style={{ background: "#FDF8F3", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#6BA8BA", letterSpacing: 0.8,
                  textTransform: "uppercase", marginBottom: 5 }}>{p.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#3A2F2F", marginBottom: 2 }}>{p.name}</div>
                {p.email   && <div style={{ fontSize: 11, color: "#7a6e68" }}>{p.email}</div>}
                {p.phone   && <div style={{ fontSize: 11, color: "#7a6e68" }}>{p.phone}</div>}
                {p.address && <div style={{ fontSize: 11, color: "#7a6e68" }}>{p.address}</div>}
              </div>
            ))}
          </div>

          {/* Line items */}
          <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #EDE4DB", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1.5fr 1.5fr",
              background: "#EDE4DB", padding: "8px 12px" }}>
              {["Description", "Qty", "Unit Price", "Amount"].map((h) => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#7a6e68", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
            {d.lineItems.map((item, idx) => (
              <div key={idx} style={{
                display: "grid", gridTemplateColumns: "3fr 1fr 1.5fr 1.5fr",
                padding: "10px 12px", alignItems: "center",
                background: idx % 2 === 1 ? "#FAFAF8" : "#fff",
                borderTop: "1px solid #EDE4DB",
              }}>
                <span style={{ fontSize: 13, color: "#3A2F2F" }}>{item.description}</span>
                <span style={{ fontSize: 12, color: "#7a6e68", textAlign: "center" }}>{item.quantity}</span>
                <span style={{ fontSize: 12, color: "#7a6e68", textAlign: "right" }}>{fmt(item.unitPrice)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#3A2F2F", textAlign: "right" }}>
                  {fmt(item.quantity * item.unitPrice)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ marginLeft: "auto", width: 220, borderRadius: 8,
            border: "1px solid #DDD5CC", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px",
              borderBottom: "1px solid #EDE4DB" }}>
              <span style={{ fontSize: 11, color: "#7a6e68" }}>Subtotal</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#3A2F2F" }}>{fmt(subtotal)}</span>
            </div>
            {d.taxRate != null && d.taxRate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px",
                borderBottom: "1px solid #EDE4DB" }}>
                <span style={{ fontSize: 11, color: "#7a6e68" }}>Tax ({d.taxRate}%)</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#3A2F2F" }}>{fmt(taxAmt)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "11px 14px",
              background: "#6BA8BA" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Total Due</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{fmt(total)}</span>
            </div>
          </div>

          {/* Notes */}
          {d.notes && (
            <div style={{ borderRadius: 8, padding: "12px 14px", background: "#FDF8F3",
              borderLeft: "3px solid #8FAE8B" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#7a6e68", textTransform: "uppercase",
                letterSpacing: 0.6, marginBottom: 5 }}>Notes</div>
              <div style={{ fontSize: 12, color: "#3A2F2F", lineHeight: 1.5 }}>{d.notes}</div>
            </div>
          )}

        </div>

        {/* Sticky download footer */}
        <div style={{
          flexShrink: 0, padding: "12px 18px 20px",
          borderTop: "1px solid #EDE4DB", background: "#fff",
        }}>
          <DownloadButton
            data={{ ...d, logoUrl: typeof window !== "undefined" ? `${window.location.origin}/mirabee-flowers-logo.png` : "/mirabee-flowers-logo.png" }}
            onDownload={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
