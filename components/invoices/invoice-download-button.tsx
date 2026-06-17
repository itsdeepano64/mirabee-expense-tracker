"use client";

import type { CSSProperties } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText } from "lucide-react";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";
import type { InvoiceData } from "@/lib/pdf/invoice-document";

type Props = {
  data: InvoiceData;
  onDownload?: () => void;
};

const LINK: CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  gap: 10, width: "100%", padding: "15px 0",
  borderRadius: "var(--mb-r-lg)", fontSize: 15, fontWeight: 700,
  textDecoration: "none", cursor: "pointer", transition: "opacity 0.15s",
};

const READY: CSSProperties = {
  ...LINK,
  background: "linear-gradient(135deg, var(--mb-blue) 0%, var(--mb-blue-dark) 100%)",
  color: "white",
  boxShadow: "0 4px 16px rgba(107,168,186,0.35)",
};

const LOADING: CSSProperties = {
  ...LINK,
  background: "var(--mb-border)",
  color: "var(--mb-text-muted)",
  cursor: "default",
  pointerEvents: "none",
};

const ERR: CSSProperties = { ...LINK, background: "#fee2e2", color: "#b91c1c" };

export function InvoiceDownloadButton({ data, onDownload }: Props) {
  const filename = `invoice-${data.invoiceNumber}-${data.clientName
    .replace(/\s+/g, "-")
    .toLowerCase()}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoiceDocument data={data} />}
      fileName={filename}
      onClick={onDownload}
      style={LINK}
    >
      {({ loading, error }) =>
        error
          ? (<span style={ERR}><FileText size={18} />Error generating PDF</span>)
          : loading
          ? (<span style={LOADING}><span className="mb-spinner" />Preparing invoice...</span>)
          : (<span style={READY}><Download size={18} />Download Invoice PDF</span>)
      }
    </PDFDownloadLink>
  );
}
