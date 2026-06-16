import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { getDashboardStats } from "@/lib/actions/expenses";
import { StatCards } from "@/components/dashboard/stat-cards";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let stats;
  let error: string | null = null;

  try {
    stats = await getDashboardStats();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load dashboard";
    stats = { total: 0, cogsTotal: 0, nonCogsTotal: 0, recent: [] };
  }

  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, Jenni 💐</p>
        </div>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/expenses/new">
            <Plus className="h-4 w-4" />
            Add Expense
          </Link>
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose/30 bg-rose/5 p-4 text-sm text-rose-dark">
          {error}. Check your Supabase setup in .env.local
        </div>
      )}

      <StatCards
        total={stats.total}
        cogsTotal={stats.cogsTotal}
        nonCogsTotal={stats.nonCogsTotal}
        monthLabel={monthLabel}
      />

      <RecentExpenses expenses={stats.recent} />
    </div>
  );
}