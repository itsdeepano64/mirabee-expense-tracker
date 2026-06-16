import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type StatCardsProps = {
  total: number;
  cogsTotal: number;
  expenseCount: number;
  topCategory: { name: string; total: number } | null;
  averageExpense: number;
  monthLabel: string;
};

export function StatCards({
  total,
  cogsTotal,
  expenseCount,
  topCategory,
  averageExpense,
  monthLabel,
}: StatCardsProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">{monthLabel}</p>
        <p className="mt-1 text-3xl font-bold text-foreground">
          {formatCurrency(total)}
        </p>
        <p className="text-sm text-muted-foreground">Total spent</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-sage/30 bg-sage/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-sage-dark">
              COGS
            </p>
            <p className="mt-1 text-xl font-semibold text-sage-dark">
              {formatCurrency(cogsTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Expenses
            </p>
            <p className="mt-1 text-xl font-semibold">{expenseCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Top category
            </p>
            <p className="mt-1 text-sm font-semibold leading-tight">
              {topCategory?.name ?? "—"}
            </p>
            {topCategory && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(topCategory.total)}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Average
            </p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(averageExpense)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}