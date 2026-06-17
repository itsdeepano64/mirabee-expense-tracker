"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, FileText } from "lucide-react";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";
import type { InvoiceData } from "@/lib/pdf/invoice-document";

type Props = { data: InvoiceData };

export function InvoiceDownloadButton({ data }: Props) {
  const filename = `invoice-${data.invoiceNumber}-${data.clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoiceDocument data={data} />}
      fileName={filename}
      style={{ textDecoration: "none" }}
    >
      {({ loading, error }) => (
        <button
          type="button"
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "15px 0",
            borderRadius: "var(--mb-r-lg)",
            background: loading
              ? "var(--mb-border)"
              : "linear-gradient(135deg, var(--mb-blue) 0%, var(--mb-blue-dark) 100%)",
            color: loading ? "var(--mb-text-muted)" : "white",
            fontSize: 15,
            fontWeight: 700,
            border: "none",
            cursor: loading ? "default" : "pointer",
            boxShadow: loading ? "none" : "0 4px 16px rgba(107,168,186,0.35)",
            transition: "opacity 0.15s",
          }}
        >
          {error ? (
            <>
              <FileText size={18} />
              Error generating PDF
            </>
          ) : loading ? (
            <>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "2.5px solid var(--mb-border-strong)",
                  borderTopColor: "var(--mb-blue)",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Preparing invoice…
            </>
          ) : (
            <>
              <Download size={18} />
              Download Invoice PDF
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
}
