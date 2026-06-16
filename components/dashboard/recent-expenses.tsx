import Link from "next/link";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import type { ExpenseWithCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RecentExpensesProps = {
  expenses: ExpenseWithCategory[];
};

export function RecentExpenses({ expenses }: RecentExpensesProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Recent expenses</CardTitle>
        <Link href="/expenses" className="text-sm font-medium text-rose-dark hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {expenses.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No expenses yet. Tap + to add your first one.
          </p>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-start justify-between gap-3 border-b border-rose/5 pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {expense.description}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(expense.date), "MMM d")}
                  </span>
                  <Badge variant="outline">{expense.category_name}</Badge>
                  {expense.is_cogs && <Badge variant="sage">COGS</Badge>}
                </div>
              </div>
              <p className="shrink-0 font-semibold text-foreground">
                {formatCurrency(expense.amount)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}