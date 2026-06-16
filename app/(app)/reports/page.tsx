import { Suspense } from "react";
import {
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import {
  getCategoryBreakdown,
  getExpenses,
} from "@/lib/actions/expenses";
import type { CategoryBreakdown, ExpenseWithCategory } from "@/lib/types";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { CategoryBreakdownReport } from "@/components/reports/category-breakdown";
import { ExportButton } from "@/components/reports/export-button";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{
    start?: string;
    end?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const now = new Date();
  const startDate = params.start ?? format(startOfMonth(now), "yyyy-MM-dd");
  const endDate = params.end ?? format(endOfMonth(now), "yyyy-MM-dd");

  let expenses: ExpenseWithCategory[] = [];
  let breakdown: CategoryBreakdown[] = [];
  let error: string | null = null;

  try {
    [expenses, breakdown] = await Promise.all([
      getExpenses({ startDate, endDate }),
      getCategoryBreakdown(startDate, endDate),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load reports";
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cogsTotal = expenses
    .filter((e) => e.is_cogs)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Spending breakdown and export
          </p>
        </div>
        <ExportButton
          expenses={expenses}
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-rose/5" />}>
        <DateRangePicker defaultStart={startDate} defaultEnd={endDate} />
      </Suspense>

      {error && (
        <div className="rounded-xl border border-rose/30 bg-rose/5 p-4 text-sm text-rose-dark">
          {error}. Check your Supabase setup in .env.local
        </div>
      )}

      <CategoryBreakdownReport
        breakdown={breakdown}
        total={total}
        cogsTotal={cogsTotal}
      />
    </div>
  );
}