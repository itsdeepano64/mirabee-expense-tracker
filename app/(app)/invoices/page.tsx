"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, Download, FileText, List, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/shell/app-shell";
import type { InvoiceData, InvoiceLineItem } from "@/lib/pdf/invoice-document";

// Lazy-load the PDF download button to avoid SSR issues with @react-pdf/renderer
const InvoiceDownloadButton = dynamic(
  () => import("@/components/invoices/invoice-download-button").then((m) => m.InvoiceDownloadButton),
  { ssr: false, loading: () => <LoadingBtn /> }
);

function LoadingBtn() {
  return (
    <button disabled className="mb-btn-primary w-full opacity-60" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <Download size={16} /> Preparing PDF…
    </button>
  );
}

// ── Empty line item factory ───────────────────────────────────────────────
function emptyLine(): InvoiceLineItem & { id: number } {
  return { id: Date.now() + Math.random(), description: "", quantity: 1, unitPrice: 0 };
}

type LineItemWithId = InvoiceLineItem & { id: number };

const TODAY = format(new Date(), "yyyy-MM-dd");
const THIRTY_DAYS = format(new Date(Date.now() + 30 * 86400_000), "yyyy-MM-dd");

// ── Page ─────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  // ── Tabs: manual | from-expenses (future) ─────────────────────────────
  const [activeTab, setActiveTab] = useState<"manual">("manual");

  // ── Form state ────────────────────────────────────────────────────────
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${format(new Date(), "yyyyMMdd")}-001`
  );
  const [issueDate, setIssueDate]     = useState(TODAY);
  const [dueDate,   setDueDate]       = useState(THIRTY_DAYS);
  const [status,    setStatus]        = useState<"draft" | "sent" | "paid">("draft");

  // From (pre-filled with Mirabee defaults)
  const [fromName,    setFromName]    = useState("Mirabee Flowers");
  const [fromEmail,   setFromEmail]   = useState("jenni@mirabeeflowers.com");
  const [fromPhone,   setFromPhone]   = useState("");
  const [fromAddress, setFromAddress] = useState("Carlinville, IL");
  const [fromOpen,    setFromOpen]    = useState(false);

  // Bill-to
  const [clientName,    setClientName]    = useState("");
  const [clientEmail,   setClientEmail]   = useState("");
  const [clientPhone,   setClientPhone]   = useState("");
  const [clientAddress, setClientAddress] = useState("");

  // Line items
  const [lines, setLines] = useState<LineItemWithId[]>([emptyLine()]);

  // Tax & notes
  const [taxRate, setTaxRate] = useState<string>("");
  const [notes,   setNotes]   = useState("");

  // ── Derived ───────────────────────────────────────────────────────────
  const subtotal  = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxAmount = taxRate ? subtotal * (parseFloat(taxRate) / 100) : 0;
  const total     = subtotal + taxAmount;

  const logoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/mirabee-flowers-logo.png`
      : "/mirabee-flowers-logo.png";

  const invoiceData: InvoiceData = {
    invoiceNumber,
    issueDate,
    dueDate: dueDate || undefined,
    status,
    fromName,
    fromEmail:      fromEmail   || undefined,
    fromPhone:      fromPhone   || undefined,
    fromAddress:    fromAddress || undefined,
    clientName:     clientName  || "Client",
    clientEmail:    clientEmail || undefined,
    clientPhone:    clientPhone || undefined,
    clientAddress:  clientAddress || undefined,
    lineItems:      lines.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
    taxRate:        taxRate ? parseFloat(taxRate) : undefined,
    notes:          notes   || undefined,
    logoUrl,
  };

  // ── Line-item helpers ─────────────────────────────────────────────────
  const updateLine = useCallback(
    (id: number, field: keyof InvoiceLineItem, value: string) => {
      setLines((prev) =>
        prev.map((l) =>
          l.id !== id
            ? l
            : {
                ...l,
                [field]:
                  field === "quantity" || field === "unitPrice"
                    ? parseFloat(value) || 0
                    : value,
              }
        )
      );
    },
    []
  );

  const removeLine = useCallback((id: number) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }, []);

  function fmt(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div style={{ padding: "16px var(--mb-page-x)", display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: "linear-gradient(135deg, var(--mb-blue), var(--mb-blue-dark))",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <FileText size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--mb-text)", lineHeight: 1.1 }}>
              New Invoice
            </h1>
            <p style={{ fontSize: 12, color: "var(--mb-text-muted)", marginTop: 2 }}>
              Generate a professional invoice
            </p>
          </div>
        </div>

        {/* ── Invoice meta card ── */}
        <Section title="Invoice Details">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Invoice #">
              <input
                className="mb-field"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </Field>
            <Field label="Status">
              <select
                className="mb-field"
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </Field>
            <Field label="Issue Date">
              <input
                type="date"
                className="mb-field"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </Field>
            <Field label="Due Date">
              <input
                type="date"
                className="mb-field"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* ── From (collapsible) ── */}
        <div className="mb-card" style={{ overflow: "hidden" }}>
          <button
            type="button"
            onClick={() => setFromOpen((v) => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", background: "none", border: "none", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              From — {fromName}
            </span>
            {fromOpen ? <ChevronUp size={16} color="var(--mb-text-muted)" /> : <ChevronDown size={16} color="var(--mb-text-muted)" />}
          </button>

          {fromOpen && (
            <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label="Business Name">
                <input className="mb-field" value={fromName}    onChange={(e) => setFromName(e.target.value)} />
              </Field>
              <Field label="Email">
                <input className="mb-field" value={fromEmail}   onChange={(e) => setFromEmail(e.target.value)} type="email" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Phone">
                  <input className="mb-field" value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} />
                </Field>
                <Field label="City / Address">
                  <input className="mb-field" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* ── Bill-to ── */}
        <Section title="Bill To">
          <Field label="Client Name *">
            <input
              className="mb-field"
              placeholder="Client or business name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <Field label="Email">
              <input className="mb-field" type="email" value={clientEmail}   onChange={(e) => setClientEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className="mb-field" value={clientPhone}   onChange={(e) => setClientPhone(e.target.value)} />
            </Field>
          </div>
          <Field label="Address" style={{ marginTop: 10 }}>
            <input className="mb-field" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
          </Field>
        </Section>

        {/* ── Line items ── */}
        <div className="mb-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Line Items
            </span>
            <span style={{ fontSize: 12, color: "var(--mb-text-muted)" }}>{lines.length} item{lines.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Column headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "3fr 1fr 2fr auto",
            gap: 8, padding: "6px 16px",
            background: "var(--mb-border)", borderTop: "1px solid var(--mb-border)",
          }}>
            {["Description", "Qty", "Unit Price", ""].map((h) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--mb-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {lines.map((line, idx) => (
              <div
                key={line.id}
                style={{
                  display: "grid", gridTemplateColumns: "3fr 1fr 2fr auto",
                  gap: 8, padding: "8px 16px",
                  borderBottom: idx < lines.length - 1 ? "1px solid var(--mb-border)" : "none",
                  alignItems: "center",
                }}
              >
                <input
                  className="mb-field"
                  style={{ fontSize: 13 }}
                  placeholder="e.g. Bridal bouquet arrangement"
                  value={line.description}
                  onChange={(e) => updateLine(line.id, "description", e.target.value)}
                />
                <input
                  className="mb-field"
                  style={{ fontSize: 13, textAlign: "center" }}
                  type="number"
                  min="0"
                  step="1"
                  value={line.quantity || ""}
                  onChange={(e) => updateLine(line.id, "quantity", e.target.value)}
                />
                <input
                  className="mb-field"
                  style={{ fontSize: 13, textAlign: "right" }}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={line.unitPrice || ""}
                  onChange={(e) => updateLine(line.id, "unitPrice", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: "none",
                    background: lines.length === 1 ? "transparent" : "var(--mb-pink-light)",
                    color: lines.length === 1 ? "var(--mb-border)" : "var(--mb-pink)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: lines.length === 1 ? "default" : "pointer",
                    flexShrink: 0,
                  }}
                  disabled={lines.length === 1}
                  aria-label="Remove line item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add row button */}
          <div style={{ padding: "10px 16px 14px" }}>
            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, emptyLine()])}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--mb-blue-xlight)",
                border: "1.5px dashed var(--mb-blue-light)",
                borderRadius: 10, padding: "8px 14px",
                fontSize: 13, fontWeight: 600, color: "var(--mb-blue)",
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> Add Line Item
            </button>
          </div>
        </div>

        {/* ── Tax & totals ── */}
        <Section title="Totals">
          <Field label="Tax Rate (%)">
            <input
              className="mb-field"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g. 8.5 (leave blank for no tax)"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </Field>

          {/* Summary */}
          <div style={{
            marginTop: 14,
            borderRadius: 12,
            border: "1.5px solid var(--mb-border)",
            overflow: "hidden",
          }}>
            <TotalsRow label="Subtotal" value={fmt(subtotal)} />
            {taxRate && parseFloat(taxRate) > 0 && (
              <TotalsRow label={`Tax (${taxRate}%)`} value={fmt(taxAmount)} />
            )}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px",
              background: "linear-gradient(135deg, var(--mb-blue), var(--mb-blue-dark))",
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>Total Due</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{fmt(total)}</span>
            </div>
          </div>
        </Section>

        {/* ── Notes ── */}
        <Section title="Notes (optional)">
          <textarea
            className="mb-field"
            rows={3}
            placeholder="Payment terms, thank you message, special instructions…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </Section>

        {/* ── Download button ── */}
        <InvoiceDownloadButton data={invoiceData} />

      </div>
    </AppShell>
  );
}

// ── Small helper components ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-card" style={{ padding: "14px 16px" }}>
      <p style={{
        fontSize: 13, fontWeight: 700, color: "var(--mb-text-muted)",
        textTransform: "uppercase", letterSpacing: "0.06em",
        marginBottom: 12,
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--mb-text-muted)", display: "block", marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TotalsRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 16px",
      borderBottom: "1px solid var(--mb-border)",
    }}>
      <span style={{ fontSize: 13, color: "var(--mb-text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text)" }}>{value}</span>
    </div>
  );
}
