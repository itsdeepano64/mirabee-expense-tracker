import { Suspense } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { getCategories, getExpenses } from "@/lib/actions/expenses";
import type { Category, ExpenseWithCategory } from "@/lib/types";
import { PageHeader } from "@/components/brand/page-header";
import { ExpenseSearchBar } from "@/components/expenses/expense-search-bar";
import { QuickFilterChips } from "@/components/expenses/quick-filter-chips";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpensesPageClient } from "@/components/expenses/expenses-page-client";

export const dynamic = "force-dynamic";

type ExpensesPageProps = {
  searchParams: Promise<{
    start?: string;
    end?: string;
    category?: string;
    categories?: string;
    q?: string;
  }>;
};

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const params = await searchParams;
  const now = new Date();
  const startDate = params.start ?? format(startOfMonth(now), "yyyy-MM-dd");
  const endDate = params.end ?? format(endOfMonth(now), "yyyy-MM-dd");
  const search = params.q;
  const categoryIds = params.categories
    ? params.categories.split(",").filter(Boolean)
    : params.category
      ? [params.category]
      : undefined;

  let expenses: ExpenseWithCategory[] = [];
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    [expenses, categories] = await Promise.all([
      getExpenses({ startDate, endDate, categoryIds, search }),
      getCategories(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load expenses";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Search, filter, and manage shop expenses"
      />

      <Suspense fallback={<div className="h-12 animate-pulse rounded-xl bg-muted" />}>
        <ExpenseSearchBar />
      </Suspense>

      <Suspense fallback={<div className="h-8 animate-pulse rounded-xl bg-muted" />}>
        <QuickFilterChips categories={categories} />
      </Suspense>

      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-muted" />}>
        <ExpenseFilters defaultStart={startDate} defaultEnd={endDate} />
      </Suspense>

      {error && (
        <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/5 p-4 text-sm text-accent-rose">
          {error}. Check your Supabase setup and run migration-v2.sql
        </div>
      )}

      <ExpensesPageClient expenses={expenses} categories={categories} />
    </div>
  );
}