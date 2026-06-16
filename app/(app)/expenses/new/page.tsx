import { getCategories } from "@/lib/actions/expenses";
import type { Category } from "@/lib/types";
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Expense</h1>
        <p className="text-sm text-muted-foreground">
          Quick entry with optional receipt photo
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose/30 bg-rose/5 p-4 text-sm text-rose-dark">
          {error}. Check your Supabase setup in .env.local
        </div>
      ) : (
        <ExpenseForm categories={categories} />
      )}
    </div>
  );
}