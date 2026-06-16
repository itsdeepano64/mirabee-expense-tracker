"use client";

import { useState } from "react";
import type { Category, ExpenseWithCategory } from "@/lib/types";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { ExpenseEditSheet } from "@/components/expenses/expense-edit-sheet";
import { MirabeeLogo } from "@/components/brand/mirabee-logo";

type ExpensesPageClientProps = {
  expenses: ExpenseWithCategory[];
  categories: Category[];
};

export function ExpensesPageClient({
  expenses,
  categories,
}: ExpensesPageClientProps) {
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseWithCategory | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleCardClick(expense: ExpenseWithCategory) {
    setSelectedExpense(expense);
    setSheetOpen(true);
  }

  return (
    <>
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mb-4 flex justify-center opacity-40">
              <MirabeeLogo size="md" />
            </div>
            <p className="text-muted-foreground">No expenses found for this period.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          expenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onClick={() => handleCardClick(expense)}
            />
          ))
        )}
      </div>

      <ExpenseEditSheet
        expense={selectedExpense}
        categories={categories}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}