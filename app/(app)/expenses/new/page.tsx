import { getCategories } from "@/lib/actions/expenses";
import type { Category } from "@/lib/types";
import { PageHeader } from "@/components/brand/page-header";
import { ExpenseForm } from "@/components/expenses/expense-form";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    categories = await getCategories();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load categories";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Expense"
        subtitle="Quick entry — tap save when done"
      />

      {error ? (
        <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/5 p-4 text-sm text-accent-rose">
          {error}. Check your Supabase setup in .env.local
        </div>
      ) : (
        <ExpenseForm categories={categories} />
      )}
    </div>
  );
}