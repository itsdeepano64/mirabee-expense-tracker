"use client";

import { Download } from "lucide-react";

import type { ExpenseWithCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";

type ExportButtonProps = {
  expenses: ExpenseWithCategory[];
  startDate: string;
  endDate: string;
};

export function ExportButton({ expenses, startDate, endDate }: ExportButtonProps) {
  function handleExport() {
    const headers = [
      "Date",
      "Description",
      "Category",
      "Amount",
      "COGS",
      "Notes",
      "Receipt URL",
    ];

    const rows = expenses.map((e) => [
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.category_name.replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      e.is_cogs ? "Yes" : "No",
      `"${(e.notes ?? "").replace(/"/g, '""')}"`,
      e.receipt_url ?? "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mirabee-expenses-${startDate}-to-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full sm:w-auto"
      onClick={handleExport}
      disabled={expenses.length === 0}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}