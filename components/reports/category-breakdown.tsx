import { formatCurrency } from "@/lib/utils";
import type { CategoryBreakdown } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CategoryBreakdownProps = {
  breakdown: CategoryBreakdown[];
  total: number;
  cogsTotal: number;
};

export function CategoryBreakdownReport({
  breakdown,
  total,
  cogsTotal,
}: CategoryBreakdownProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total spend
            </p>
            <p className="mt-1 text-2xl font-bold">{formatCurrency(total)}</p>
          </CardContent>
        </Card>
        <Card className="border-sage/20 bg-sage/5">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-sage-dark">COGS</p>
            <p className="mt-1 text-2xl font-bold text-sage-dark">
              {formatCurrency(cogsTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending by category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {breakdown.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No expenses in this date range.
            </p>
          ) : (
            breakdown.map((item) => (
              <div key={item.category_id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.category_name}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(item.total)} ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-rose/10">
                  <div
                    className="h-full rounded-full bg-rose transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.count} expense{item.count !== 1 ? "s" : ""}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}