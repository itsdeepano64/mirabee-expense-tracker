import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";

// ── Shared palette (mirrors expense-report-document.tsx) ──────────────────
const C = {
  blue:       "#6BA8BA",
  blueDark:   "#4E8FA3",
  green:      "#8FAE8B",
  cream:      "#FDF8F3",
  sand:       "#EDE4DB",
  text:       "#3A2F2F",
  muted:      "#7a6e68",
  white:      "#FFFFFF",
  border:     "#DDD5CC",
  pink:       "#D4799A",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.text,
    backgroundColor: C.white,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: C.blue,
  },
  logo: { width: 160, height: 160, objectFit: "contain" },
  headerRight: { alignItems: "flex-end", justifyContent: "flex-end" },
  invoiceTitle: { fontSize: 32, fontWeight: "bold", color: C.blue, letterSpacing: 2 },
  invoiceNum:   { fontSize: 11, color: C.muted, marginTop: 4 },
  invoiceDate:  { fontSize: 10, color: C.muted, marginTop: 2 },
  dueDate:      { fontSize: 10, fontWeight: "bold", color: C.text, marginTop: 2 },

  // ── Bill-to / From row ──────────────────────────────────────────────────
  partiesRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 24,
  },
  partyBox: {
    flex: 1,
    padding: 14,
    backgroundColor: C.cream,
    borderRadius: 6,
  },
  partyLabel: {
    fontSize: 8,
    fontWeight: "bold",
    color: C.blue,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  partyName:    { fontSize: 12, fontWeight: "bold", color: C.text, marginBottom: 3 },
  partyDetail:  { fontSize: 9.5, color: C.muted, marginBottom: 2, lineHeight: 1.4 },

  // ── Line items table ────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.sand,
    padding: "8 10",
    borderRadius: "4 4 0 0",
    fontSize: 8,
    fontWeight: "bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    padding: "9 10",
    borderBottomWidth: 1,
    borderBottomColor: C.sand,
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: "#FAFAF8",
  },
  colDesc:  { flex: 4 },
  colQty:   { flex: 1, textAlign: "center" },
  colRate:  { flex: 1.5, textAlign: "right" },
  colAmt:   { flex: 1.5, textAlign: "right", fontWeight: "bold" },

  // ── Totals block ────────────────────────────────────────────────────────
  totalsBox: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: 220,
    borderRadius: 8,
    overflow: "hidden",
    border: `1pt solid ${C.border}`,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "8 14",
    borderBottomWidth: 1,
    borderBottomColor: C.sand,
  },
  totalsLabel: { fontSize: 10, color: C.muted },
  totalsValue: { fontSize: 10, fontWeight: "bold", color: C.text },
  totalsFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "10 14",
    backgroundColor: C.blue,
  },
  totalsFinalLabel: { fontSize: 11, fontWeight: "bold", color: C.white },
  totalsFinalValue: { fontSize: 13, fontWeight: "bold", color: C.white },

  // ── Notes ───────────────────────────────────────────────────────────────
  notesBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: C.cream,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C.green,
  },
  notesLabel: { fontSize: 8, fontWeight: "bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 },
  notesText:  { fontSize: 9.5, color: C.text, lineHeight: 1.5 },

  // ── Footer ──────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.sand,
  },
  footerLeft:  { fontSize: 8, color: C.muted },
  footerRight: { fontSize: 8, color: C.muted, textAlign: "right" },

  // ── Status badge ────────────────────────────────────────────────────────
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  statusText: { fontSize: 9, fontWeight: "bold", letterSpacing: 0.8, textTransform: "uppercase" },
});

// ── Types ─────────────────────────────────────────────────────────────────

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  issueDate: string;       // yyyy-MM-dd
  dueDate?: string;        // yyyy-MM-dd
  status?: "draft" | "sent" | "paid";
  // From
  fromName: string;
  fromEmail?: string;
  fromPhone?: string;
  fromAddress?: string;
  // Bill-to
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  // Line items
  lineItems: InvoiceLineItem[];
  taxRate?: number;          // percentage, e.g. 8.5
  notes?: string;
  logoUrl: string;
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ── Document ──────────────────────────────────────────────────────────────

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const subtotal = data.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmount = data.taxRate ? subtotal * (data.taxRate / 100) : 0;
  const total = subtotal + taxAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Image src={data.logoUrl} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNum}>#{data.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>
              Issued: {format(parseISO(data.issueDate), "MMMM d, yyyy")}
            </Text>
            {data.dueDate && (
              <Text style={styles.dueDate}>
                Due: {format(parseISO(data.dueDate), "MMMM d, yyyy")}
              </Text>
            )}
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>From</Text>
            <Text style={styles.partyName}>{data.fromName}</Text>
            {data.fromEmail   && <Text style={styles.partyDetail}>{data.fromEmail}</Text>}
            {data.fromPhone   && <Text style={styles.partyDetail}>{data.fromPhone}</Text>}
            {data.fromAddress && <Text style={styles.partyDetail}>{data.fromAddress}</Text>}
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Bill To</Text>
            <Text style={styles.partyName}>{data.clientName}</Text>
            {data.clientEmail   && <Text style={styles.partyDetail}>{data.clientEmail}</Text>}
            {data.clientPhone   && <Text style={styles.partyDetail}>{data.clientPhone}</Text>}
            {data.clientAddress && <Text style={styles.partyDetail}>{data.clientAddress}</Text>}
          </View>
        </View>

        {/* ── Line items ── */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colRate}>Unit Price</Text>
          <Text style={styles.colAmt}>Amount</Text>
        </View>

        {data.lineItems.map((item, idx) => (
          <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.colDesc, { fontSize: 10 }]}>{item.description}</Text>
            <Text style={[styles.colQty,  { fontSize: 10 }]}>{item.quantity}</Text>
            <Text style={[styles.colRate, { fontSize: 10 }]}>{fmt(item.unitPrice)}</Text>
            <Text style={[styles.colAmt,  { fontSize: 10 }]}>{fmt(item.quantity * item.unitPrice)}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
          </View>
          {data.taxRate != null && data.taxRate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({data.taxRate}%)</Text>
              <Text style={styles.totalsValue}>{fmt(taxAmount)}</Text>
            </View>
          )}
          <View style={styles.totalsFinalRow}>
            <Text style={styles.totalsFinalLabel}>Total Due</Text>
            <Text style={styles.totalsFinalValue}>{fmt(total)}</Text>
          </View>
        </View>

        {/* ── Notes ── */}
        {data.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerLeft}>{data.fromName}</Text>
          <Text style={styles.footerRight}>Invoice #{data.invoiceNumber}</Text>
        </View>

      </Page>
    </Document>
  );
}
