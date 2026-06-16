import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { getCategories, getDashboardStats } from "@/lib/actions/expenses";
import type { Category } from "@/lib/types";
import { PageHeader } from "@/components/brand/page-header";
import { StatCards } from "@/components/dashboard/stat-cards";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let stats;
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    [stats, categories] = await Promise.all([
      getDashboardStats(),
      getCategories(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load dashboard";
    stats = {
      total: 0,
      cogsTotal: 0,
      nonCogsTotal: 0,
      expenseCount: 0,
      topCategory: null,
      averageExpense: 0,
      recent: [],
    };
  }

  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, Jenni 💐"
        action={
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/expenses/new">
              <Plus className="h-4 w-4" />
              Add
            </Link>
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/5 p-4 text-sm text-accent-rose">
          {error}. Check your Supabase setup in .env.local
        </div>
      )}

      <StatCards
        total={stats.total}
        cogsTotal={stats.cogsTotal}
        expenseCount={stats.expenseCount}
        topCategory={stats.topCategory}
        averageExpense={stats.averageExpense}
        monthLabel={monthLabel}
      />

      <RecentExpenses expenses={stats.recent} categories={categories} />
    </div>
  );
}