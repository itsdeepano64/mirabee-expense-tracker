"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileText } from "lucide-react";
import type { CategoryBreakdown, ExpenseWithCategory } from "@/lib/types";
import { ExpenseReportDocument } from "@/lib/pdf/expense-report-document";
import { Button } from "@/components/ui/button";

type ExportPdfButtonProps = {
  expenses: ExpenseWithCategory[];
  breakdown: CategoryBreakdown[];
  startDate: string;
  endDate: string;
  total: number;
  cogsTotal: number;
};

export function ExportPdfButton({
  expenses,
  breakdown,
  startDate,
  endDate,
  total,
  cogsTotal,
}: ExportPdfButtonProps) {
  const [generating, setGenerating] = useState(false);

  async function handleExport() {
    setGenerating(true);
    try {
      const logoUrl = `${window.location.origin}/mirabee-logo.png?v=2`;
      const blob = await pdf(
        <ExpenseReportDocument
          expenses={expenses}
          breakdown={breakdown}
          startDate={startDate}
          endDate={endDate}
          total={total}
          cogsTotal={cogsTotal}
          logoUrl={logoUrl}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mirabee-report-${startDate}-to-${endDate}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Button
      type="button"
      className="w-full sm:w-auto"
      onClick={handleExport}
      disabled={expenses.length === 0 || generating}
    >
      <FileText className="h-4 w-4" />
      {generating ? "Generating..." : "Export PDF"}
    </Button>
  );
}