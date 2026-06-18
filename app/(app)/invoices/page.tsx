"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, FileText, ChevronDown, ChevronUp, RotateCcw, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/shell/app-shell";
import { InvoiceList } from "@/components/invoices/invoice-list";
import type { SavedInvoice } from "@/components/invoices/invoice-history";
import type { InvoiceData, InvoiceLineItem } from "@/lib/pdf/invoice-document";
import { getInvoices, upsertInvoice, updateInvoiceRecord, getFromInfo, saveFromInfo } from "@/lib/actions/invoices";

const LS_FROM      = "mirabee-from-info";
const LS_INVOICES  = "mirabee-invoices";
const TODAY        = format(new Date(), "yyyy-MM-dd");
const DUE_30       = format(new Date(Date.now() + 30 * 86_400_000), "yyyy-MM-dd");

const InvoiceDownloadButton = dynamic(
  () => import("@/components/invoices/invoice-download-button").then((m) => m.InvoiceDownloadButton),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: 54, borderRadius: "var(--mb-r-lg)", background: "var(--mb-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 700, color: "var(--mb-text-muted)" }}>
        Preparing PDF...
      </div>
    ),
  }
);

let _id = 0;
type Line = InvoiceLineItem & { _id: number };
const newLine = (): Line => ({ _id: ++_id, description: "", quantity: 1, unitPrice: 0 });
const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function logoUrl() {
  if (typeof window === "undefined") return "/mirabee-flowers-logo.png";
  return `${window.location.origin}/mirabee-flowers-logo.png`;
}

type View = "list" | "form";

export default function InvoicesPage() {
  const [view,       setView]       = useState<View>("list");
  const [editingInv, setEditingInv] = useState<SavedInvoice | null>(null);

  // Persisted
  const [saved,      setSaved]      = useState<SavedInvoice[]>([]);
  const [fromLoaded, setFromLoaded] = useState(false);
  const [syncError,  setSyncError]  = useState<string | null>(null);

  // From
  const [fromName,    setFromName]    = useState("Mirabee Flowers");
  const [fromEmail,   setFromEmail]   = useState("jenni@mirabeeflowers.com");
  const [fromPhone,   setFromPhone]   = useState("");
  const [fromAddress, setFromAddress] = useState("Carlinville, IL");
  const [fromOpen,    setFromOpen]    = useState(false);

  // Invoice meta
  const [invNum,      setInvNum]      = useState("");
  const [issueDate,   setIssueDate]   = useState(TODAY);
  const [dueDate,     setDueDate]     = useState(DUE_30);
  const [hasDueDate,  setHasDueDate]  = useState(true);
  const [status,      setStatus]      = useState<"draft" | "sent" | "paid">("draft");

  // Bill-to
  const [clientName,    setClientName]    = useState("");
  const [clientEmail,   setClientEmail]   = useState("");
  const [clientPhone,   setClientPhone]   = useState("");
  const [clientAddress, setClientAddress] = useState("");

  // Lines
  const [lines, setLines] = useState<Line[]>([newLine()]);

  // Tax & notes
  const [taxRate, setTaxRate] = useState("");
  const [notes,   setNotes]   = useState("");

  // Load on mount: localStorage first (instant), then Supabase (cross-device sync)
  useEffect(() => {
    // 1. Instant load from localStorage (no delay)
    try {
      const f = JSON.parse(localStorage.getItem(LS_FROM) ?? "{}");
      if (f.fromName)    setFromName(f.fromName);
      if (f.fromEmail)   setFromEmail(f.fromEmail);
      if (f.fromPhone)   setFromPhone(f.fromPhone);
      if (f.fromAddress) setFromAddress(f.fromAddress);
    } catch { /**/ }
    try {
      const list: SavedInvoice[] = JSON.parse(localStorage.getItem(LS_INVOICES) ?? "[]");
      setSaved(list);
      setInvNum(String(list.length + 1).padStart(4, "0"));
    } catch {
      setInvNum("0001");
    }
    setFromLoaded(true);

    // 2. Sync from Supabase (works across devices)
    void (async () => {
      try {
        const [{ invoices, ok, error: invErr }, fromInfo] = await Promise.all([getInvoices(), getFromInfo()]);
        if (ok) {
          setSyncError(null);
          setSaved(invoices);
          try { localStorage.setItem(LS_INVOICES, JSON.stringify(invoices)); } catch { /**/ }
          setInvNum(String(invoices.length + 1).padStart(4, "0"));
        } else {
          setSyncError(invErr ?? "Supabase read failed");
        }
        if (fromInfo && fromInfo.fromName) {
          setFromName(fromInfo.fromName);
          setFromEmail(fromInfo.fromEmail);
          setFromPhone(fromInfo.fromPhone);
          setFromAddress(fromInfo.fromAddress);
          try { localStorage.setItem(LS_FROM, JSON.stringify(fromInfo)); } catch { /**/ }
        }
      } catch (e) {
        setSyncError(String(e));
      }
    })();
  }, []);

  // Auto-save From fields (localStorage + Supabase)
  useEffect(() => {
    if (!fromLoaded) return;
    const info = { fromName, fromEmail, fromPhone, fromAddress };
    try { localStorage.setItem(LS_FROM, JSON.stringify(info)); } catch { /**/ }
    void saveFromInfo(info);
  }, [fromLoaded, fromName, fromEmail, fromPhone, fromAddress]);

  // Derived totals
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const taxAmt   = taxRate ? subtotal * (parseFloat(taxRate) / 100) : 0;
  const total    = subtotal + taxAmt;

  const invoiceData: InvoiceData = {
    invoiceNumber: invNum, issueDate,
    dueDate: hasDueDate && dueDate ? dueDate : undefined, status,
    fromName, fromEmail: fromEmail || undefined,
    fromPhone: fromPhone || undefined, fromAddress: fromAddress || undefined,
    clientName: clientName || "Client",
    clientEmail: clientEmail || undefined,
    clientPhone: clientPhone || undefined,
    clientAddress: clientAddress || undefined,
    lineItems: lines.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
    taxRate: taxRate ? parseFloat(taxRate) : undefined,
    notes: notes || undefined,
    logoUrl: logoUrl(),
  };

  // Save changes to an existing invoice (no PDF generated)
  function handleSaveEdits() {
    if (!editingInv) return;
    const updates: Partial<SavedInvoice> = {
      invoiceNumber: invNum,
      clientName: clientName || "Client",
      total,
      status,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      data: (({ logoUrl: _l, ...rest }) => rest)(invoiceData),
    };
    handleUpdate(editingInv.id, updates);
    setView("list");
    setEditingInv(null);
  }

  // Save on download, then go to list
  function handleDownload() {
    // If editing, re-issue updates the existing record + generates new PDF
    if (editingInv) {
      handleSaveEdits();
      return;
    }
    const record: SavedInvoice = {
      id: crypto.randomUUID(), savedAt: new Date().toISOString(),
      invoiceNumber: invNum, clientName: clientName || "Client", total, status,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      data: (({ logoUrl: _l, ...rest }) => rest)(invoiceData),
    };
    // 1. Save locally (synchronous, instant)
    const updated = [record, ...saved];
    setSaved(updated);
    try { localStorage.setItem(LS_INVOICES, JSON.stringify(updated)); } catch { /**/ }
    // 2. Sync to Supabase (outside state updater — fires once, reliably)
    upsertInvoice(record).then(({ ok, error: upsertErr }) => {
      if (!ok) setSyncError(`Save failed: ${upsertErr ?? "unknown error"}`);
      else setSyncError(null);
    });
    // 3. Navigate to list after short delay so PDF download can initiate
    setTimeout(() => {
      setView("list");
      setEditingInv(null);
    }, 400);
  }

  // Open blank form for new invoice
  function handleNew() {
    setEditingInv(null);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setClientAddress("");
    setLines([newLine()]);
    setTaxRate("");
    setNotes("");
    setStatus("draft");
    setIssueDate(TODAY);
    setDueDate(DUE_30);
    setHasDueDate(true);
    setSaved((prev) => {
      setInvNum(String(prev.length + 1).padStart(4, "0"));
      return prev;
    });
    setView("form");
  }

  // Open form pre-filled for editing
  function handleEdit(inv: SavedInvoice) {
    setEditingInv(inv);
    const d = inv.data;
    setInvNum(d.invoiceNumber);
    setIssueDate(d.issueDate);
    setHasDueDate(!!d.dueDate);
    setDueDate(d.dueDate ?? DUE_30);
    setStatus(d.status ?? "draft");
    setClientName(d.clientName ?? "");
    setClientEmail(d.clientEmail ?? "");
    setClientPhone(d.clientPhone ?? "");
    setClientAddress(d.clientAddress ?? "");
    setTaxRate(d.taxRate != null ? String(d.taxRate) : "");
    setNotes(d.notes ?? "");
    setLines(d.lineItems.map((l) => ({ ...l, _id: ++_id })));
    setView("form");
  }

  // Update saved invoice (payment tracking, etc.)
  function handleUpdate(id: string, updates: Partial<SavedInvoice>) {
    const updated = saved.map((inv) => inv.id === id ? { ...inv, ...updates } : inv);
    setSaved(updated);
    try { localStorage.setItem(LS_INVOICES, JSON.stringify(updated)); } catch { /**/ }
    updateInvoiceRecord(id, updates).catch((e) => console.error("[mirabee] updateInvoiceRecord failed", e));
  }

  // Line helpers
  const updateLine = useCallback((id: number, field: keyof InvoiceLineItem, val: string) => {
    setLines((prev) => prev.map((l) => l._id !== id ? l : {
      ...l, [field]: (field === "quantity" || field === "unitPrice") ? parseFloat(val) || 0 : val,
    }));
  }, []);
  const removeLine = useCallback((id: number) => {
    setLines((prev) => prev.length > 1 ? prev.filter((l) => l._id !== id) : prev);
  }, []);

  return (
    <AppShell>
      <div style={{ padding: "16px var(--mb-page-x) 40px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Sync error banner */}
        {syncError && (
          <div style={{ background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: 10,
            padding: "10px 14px", fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
            <strong>⚠ Sync error</strong> — invoices are saved on this device only.<br />
            <span style={{ fontFamily: "monospace", fontSize: 11 }}>{syncError}</span>
          </div>
        )}

        {/* LIST VIEW */}
        {view === "list" && (
          <InvoiceList saved={saved} onNew={handleNew} onEdit={handleEdit} onUpdate={handleUpdate} />
        )}

        {/* FORM VIEW */}
        {view === "form" && (
          <>
            {/* Back button + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => setView("list")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 4,
                  display: "flex", alignItems: "center", color: "var(--mb-blue)" }}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--mb-text)", lineHeight: 1.1 }}>
                  {editingInv ? "Edit Invoice" : "New Invoice"}
                </h1>
                <p style={{ fontSize: 12, color: "var(--mb-text-muted)", marginTop: 2 }}>
                  {editingInv ? `Editing ${editingInv.invoiceNumber}` : "Fill in the details below"}
                </p>
              </div>
            </div>

            {/* Invoice details */}
            <Card title="Invoice Details">
              <Grid2>
                <Field label="Invoice #"><input className="mb-field" value={invNum} onChange={(e) => setInvNum(e.target.value)} /></Field>
                <Field label="Status">
                  <select className="mb-field" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                  </select>
                </Field>
              </Grid2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                <Field label="Issue Date">
                  <input type="date" className="mb-field" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </Field>
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                    <input type="checkbox" checked={hasDueDate} onChange={(e) => setHasDueDate(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--mb-blue)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mb-text-muted)" }}>Include due date</span>
                  </label>
                  {hasDueDate && (
                    <Field label="Due Date">
                      <input type="date" className="mb-field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </Field>
                  )}
                </div>
              </div>
            </Card>

            {/* From (auto-saved) */}
            <div className="mb-card" style={{ overflow: "hidden" }}>
              <button type="button" onClick={() => setFromOpen((v) => !v)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", background: "none", border: "none", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    From - {fromName}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--mb-green-dark)",
                    background: "var(--mb-green-light)", borderRadius: 20, padding: "1px 7px" }}>
                    Auto-saved
                  </span>
                </div>
                {fromOpen ? <ChevronUp size={16} color="var(--mb-text-muted)" /> : <ChevronDown size={16} color="var(--mb-text-muted)" />}
              </button>
              {fromOpen && (
                <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <Field label="Business Name"><input className="mb-field" value={fromName} onChange={(e) => setFromName(e.target.value)} /></Field>
                  <Field label="Email"><input className="mb-field" type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} /></Field>
                  <Grid2>
                    <Field label="Phone"><input className="mb-field" value={fromPhone} onChange={(e) => setFromPhone(e.target.value)} /></Field>
                    <Field label="City / Address"><input className="mb-field" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} /></Field>
                  </Grid2>
                  <p style={{ fontSize: 11, color: "var(--mb-text-soft)", display: "flex", alignItems: "center", gap: 4 }}>
                    <RotateCcw size={11} /> Changes save automatically for next time.
                  </p>
                </div>
              )}
            </div>

            {/* Bill-to */}
            <Card title="Bill To">
              <Field label="Client Name *">
                <input className="mb-field" placeholder="Client or business name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </Field>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                <Field label="Email"><input className="mb-field" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} /></Field>
                <Field label="Phone"><input className="mb-field" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} /></Field>
              </div>
              <Field label="Address" style={{ marginTop: 10 }}>
                <input className="mb-field" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
              </Field>
            </Card>

            {/* Line items */}
            <div className="mb-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "14px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text-muted)",
                  textTransform: "uppercase", letterSpacing: "0.06em" }}>Line Items</span>
                <span style={{ fontSize: 12, color: "var(--mb-text-muted)" }}>{lines.length} item{lines.length !== 1 ? "s" : ""}</span>
              </div>
              {lines.map((line, idx) => (
                <div key={line._id} style={{
                  padding: "12px 16px",
                  borderTop: "1px solid var(--mb-border)",
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  {/* Description */}
                  <input className="mb-field" placeholder="Description (e.g. Bridal bouquet)"
                    value={line.description} onChange={(e) => updateLine(line._id, "description", e.target.value)} />
                  {/* Qty × Price = Amount + delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--mb-text-muted)", flexShrink: 0 }}>Qty</span>
                    <input className="mb-field" type="number" min="0" step="1"
                      value={line.quantity || ""}
                      onChange={(e) => updateLine(line._id, "quantity", e.target.value)}
                      style={{ width: 56, textAlign: "center" }} />
                    <span style={{ fontSize: 12, color: "var(--mb-text-muted)", flexShrink: 0 }}>× $</span>
                    <input className="mb-field" type="number" min="0" step="0.01" placeholder="0.00"
                      value={line.unitPrice || ""}
                      onChange={(e) => updateLine(line._id, "unitPrice", e.target.value)}
                      style={{ flex: 1, textAlign: "right" }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text)",
                      flexShrink: 0, minWidth: 64, textAlign: "right" }}>
                      {fmt(line.quantity * line.unitPrice)}
                    </span>
                    <button type="button" onClick={() => removeLine(line._id)} disabled={lines.length === 1}
                      aria-label="Remove line"
                      style={{ width: 36, height: 36, borderRadius: 10, border: "none", flexShrink: 0,
                        background: lines.length === 1 ? "transparent" : "var(--mb-pink-light)",
                        color: lines.length === 1 ? "var(--mb-border-strong)" : "var(--mb-pink)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: lines.length === 1 ? "default" : "pointer" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ padding: "10px 16px 14px" }}>
                <button type="button" onClick={() => setLines((prev) => [...prev, newLine()])}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", cursor: "pointer",
                    background: "var(--mb-blue-xlight)", border: "1.5px dashed var(--mb-blue-light)",
                    borderRadius: 12, padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "var(--mb-blue)" }}>
                  <Plus size={16} /> Add Line Item
                </button>
              </div>
            </div>

            {/* Totals */}
            <Card title="Totals">
              <Field label="Tax Rate (%)">
                <input className="mb-field" type="number" min="0" max="100" step="0.1"
                  placeholder="e.g. 8.5  (leave blank for no tax)" value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)} />
              </Field>
              <div style={{ marginTop: 14, borderRadius: 12, border: "1.5px solid var(--mb-border)", overflow: "hidden" }}>
                <TRow label="Subtotal" value={fmt(subtotal)} />
                {taxRate && parseFloat(taxRate) > 0 && <TRow label={`Tax (${taxRate}%)`} value={fmt(taxAmt)} />}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", background: "linear-gradient(135deg, var(--mb-blue), var(--mb-blue-dark))" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>Total Due</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{fmt(total)}</span>
                </div>
              </div>
            </Card>

            {/* Notes */}
            <Card title="Notes (optional)">
              <textarea className="mb-field" rows={3} style={{ resize: "vertical" }}
                placeholder="Payment terms, thank you message, special instructions..."
                value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Card>

            {/* Save Changes (edit mode) or Download (new invoice) */}
            {editingInv ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  style={{ width: "100%", padding: "16px", borderRadius: "var(--mb-r-lg)",
                    background: "var(--mb-blue)", border: "none", cursor: "pointer",
                    fontSize: 15, fontWeight: 700, color: "white" }}>
                  Save Changes
                </button>
                <InvoiceDownloadButton data={invoiceData} onDownload={handleDownload} />
              </div>
            ) : (
              <InvoiceDownloadButton data={invoiceData} onDownload={handleDownload} />
            )}
          </>
        )}

      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-card" style={{ padding: "14px 16px" }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text-muted)",
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{title}</p>
      {children}
    </div>
  );
}

function Grid2({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, ...style }}>{children}</div>;
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--mb-text-muted)", display: "block", marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 16px", borderBottom: "1px solid var(--mb-border)" }}>
      <span style={{ fontSize: 13, color: "var(--mb-text-muted)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--mb-text)" }}>{value}</span>
    </div>
  );
}
