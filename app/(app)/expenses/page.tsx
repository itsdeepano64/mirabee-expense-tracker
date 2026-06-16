import { Suspense } from "react";
import {
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { getCategories, getExpenses } from "@/lib/actions/expenses";
import type { Category, ExpenseWithCategory } from "@/lib/types";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { ExpenseFilters } from "@/components/expenses/expense-filters";

export const dynamic = "force-dynamic";

type ExpensesPageProps = {
  searchParams: Promise<{
    start?: string;
    end?: string;
    category?: string;
  }>;
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const now = new Date();
  const startDate = params.start ?? format(startOfMonth(now), "yyyy-MM-dd");
  const endDate = params.end ?? format(endOfMonth(now), "yyyy-MM-dd");
  const categoryId = params.category;

  let expenses: ExpenseWithCategory[] = [];
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    [expenses, categories] = await Promise.all([
      getExpenses({
        startDate,
        endDate,
        categoryId: categoryId || undefined,
      }),
      getCategories(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load expenses";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
        <p className="text-sm text-muted-foreground">
          Filter and review all shop expenses
        </p>
      </div>

      <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-rose/5" />}>
        <ExpenseFilters
          categories={categories}
          defaultStart={startDate}
          defaultEnd={endDate}
        />
      </Suspense>

      {error && (
        <div className="rounded-xl border border-rose/30 bg-rose/5 p-4 text-sm text-rose-dark">
          {error}. Check your Supabase setup in .env.local
        </div>
      )}

      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rose/20 bg-white p-8 text-center">
            <p className="text-muted-foreground">No expenses found for this period.</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))
        )}
      </div>
    </div>
  );
}