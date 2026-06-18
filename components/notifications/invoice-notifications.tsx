"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { SavedInvoice } from "@/components/invoices/invoice-history";

const LS_INVOICES = "mirabee-invoices";

// ── Types ─────────────────────────────────────────────────────────────────────

type Urgency = "overdue" | "soon" | "upcoming";

type NotifItem = {
  inv: SavedInvoice;
  urgency: Urgency;
  daysLabel: string;  // e.g. "3 days overdue" or "Due in 5 days"
  daysNum: number;    // negative = overdue
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function classify(inv: SavedInvoice): NotifItem | null {
  if (inv.status === "paid") return null;
  const due = inv.data?.dueDate;
  if (!due) return null;

  const daysNum = Math.floor(
    (new Date(due).setHours(23, 59, 59) - Date.now()) / 86_400_000
  );

  let urgency: Urgency;
  let daysLabel: string;

  if (daysNum < 0) {
    urgency = "overdue";
    daysLabel = `${Math.abs(daysNum)} day${Math.abs(daysNum) !== 1 ? "s" : ""} overdue`;
  } else if (daysNum <= 7) {
    urgency = "soon";
    daysLabel = daysNum === 0 ? "Due today" : `Due in ${daysNum} day${daysNum !== 1 ? "s" : ""}`;
  } else if (daysNum <= 30) {
    urgency = "upcoming";
    daysLabel = `Due in ${daysNum} days`;
  } else {
    return null;
  }

  return { inv, urgency, daysLabel, daysNum };
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// ── Component ─────────────────────────────────────────────────────────────────

export function InvoiceNotifications() {
  const [items,  setItems]  = useState<NotifItem[]>([]);
  const [open,   setOpen]   = useState(false);

  // Load invoices from localStorage on mount (fast, no network)
  useEffect(() => {
    try {
      const list: SavedInvoice[] = JSON.parse(
        localStorage.getItem(LS_INVOICES) ?? "[]"
      );
      const notifs = list.flatMap((inv) => {
        const n = classify(inv);
        return n ? [n] : [];
      });
      // Sort: overdue first (most days overdue), then soon, then upcoming
      notifs.sort((a, b) => a.daysNum - b.daysNum);
      setItems(notifs);
    } catch { /**/ }
  }, []);

  // Re-check whenever sheet opens (picks up newly created invoices)
  function handleOpen() {
    try {
      const list: SavedInvoice[] = JSON.parse(
        localStorage.getItem(LS_INVOICES) ?? "[]"
      );
      const notifs = list.flatMap((inv) => {
        const n = classify(inv);
        return n ? [n] : [];
      });
      notifs.sort((a, b) => a.daysNum - b.daysNum);
      setItems(notifs);
    } catch { /**/ }
    setOpen(true);
  }

  const urgentCount = items.filter(
    (n) => n.urgency === "overdue" || n.urgency === "soon"
  ).length;

  const groups: { label: string; urgency: Urgency; color: string; bg: string }[] = [
    { label: "Overdue",   urgency: "overdue",  color: "#dc2626", bg: "#fef2f2" },
    { label: "Due Soon",  urgency: "soon",     color: "#d97706", bg: "#fffbeb" },
    { label: "Upcoming",  urgency: "upcoming", color: "var(--mb-text-muted)", bg: "var(--mb-border)" },
  ];

  return (
    <>
      {/* ── Bell button ── */}
      <button
        className="mb-hdr-btn"
        aria-label="Notifications"
        onClick={handleOpen}
        style={{ position: "relative" }}
      >
        <BellIcon size={17} />
        {urgentCount > 0 && (
          <span style={{
            position: "absolute", top: 3, right: 3,
            width: 16, height: 16, borderRadius: "50%",
            background: "#dc2626", color: "white",
            fontSize: 9, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid var(--mb-card)",
            lineHeight: 1,
          }}>
            {urgentCount > 9 ? "9+" : urgentCount}
          </span>
        )}
      </button>

      {/* ── Sheet overlay ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxHeight: "82dvh",
              background: "var(--mb-card)",
              borderRadius: "20px 20px 0 0",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Handle + header */}
            <div style={{ padding: "12px 18px 0", textAlign: "center" }}>
              <div style={{
                width: 36, height: 4, borderRadius: 2,
                background: "var(--mb-border-strong)",
                margin: "0 auto 14px",
              }} />
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", paddingBottom: 12,
                borderBottom: "1px solid var(--mb-border)",
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--mb-text)" }}>
                    Invoice Reminders
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mb-text-muted)", marginTop: 2 }}>
                    {items.length === 0
                      ? "All invoices are up to date"
                      : `${items.length} invoice${items.length !== 1 ? "s" : ""} need attention`}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: 30, height: 30, borderRadius: "50%",
                    border: "none", background: "var(--mb-border)",
                    cursor: "pointer", fontSize: 16, color: "var(--mb-text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 0 24px" }}>
              {items.length === 0 ? (
                <div style={{
                  padding: "40px 24px", textAlign: "center",
                  color: "var(--mb-text-muted)", fontSize: 14,
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🌸</div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>You&apos;re all caught up!</div>
                  <div style={{ fontSize: 12 }}>No invoices due in the next 30 days.</div>
                </div>
              ) : (
                groups.map(({ label, urgency, color, bg }) => {
                  const groupItems = items.filter((n) => n.urgency === urgency);
                  if (groupItems.length === 0) return null;
                  return (
                    <div key={urgency} style={{ marginBottom: 6 }}>
                      {/* Group header */}
                      <div style={{
                        padding: "6px 18px",
                        fontSize: 10, fontWeight: 800,
                        color, textTransform: "uppercase", letterSpacing: "0.07em",
                      }}>
                        {label} · {groupItems.length}
                      </div>
                      {/* Rows */}
                      {groupItems.map(({ inv, daysLabel }) => (
                        <div key={inv.id} style={{
                          padding: "11px 18px",
                          display: "flex", alignItems: "center", gap: 12,
                          borderBottom: "1px solid var(--mb-border)",
                        }}>
                          {/* Urgency dot */}
                          <div style={{
                            width: 10, height: 10, borderRadius: "50%",
                            flexShrink: 0, background: color,
                          }} />
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 700,
                              color: "var(--mb-text)",
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {inv.clientName}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--mb-text-muted)", marginTop: 1 }}>
                              {inv.invoiceNumber}
                              {inv.data?.dueDate && (
                                <> · Due {format(new Date(inv.data.dueDate), "MMM d")}</>
                              )}
                            </div>
                          </div>
                          {/* Amount + label */}
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--mb-text)" }}>
                              {fmt(inv.total)}
                            </div>
                            <div style={{
                              fontSize: 10, fontWeight: 700,
                              color: color,
                              background: bg,
                              borderRadius: 20, padding: "2px 7px",
                              marginTop: 2, display: "inline-block",
                            }}>
                              {daysLabel}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Bell SVG ──────────────────────────────────────────────────────────────────

function BellIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
