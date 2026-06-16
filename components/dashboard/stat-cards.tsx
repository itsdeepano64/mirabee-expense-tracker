import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type StatCardsProps = {
  total: number;
  cogsTotal: number;
  nonCogsTotal: number;
  monthLabel: string;
};

export function StatCards({
  total,
  cogsTotal,
  nonCogsTotal,
  monthLabel,
}: StatCardsProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{monthLabel}</p>
        <p className="text-3xl font-bold text-foreground">{formatCurrency(total)}</p>
        <p className="text-sm text-muted-foreground">Total spent</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-sage/20 bg-sage/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-sage-dark">
              COGS
            </p>
            <p className="mt-1 text-xl font-semibold text-sage-dark">
              {formatCurrency(cogsTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-rose/20 bg-rose/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-rose-dark">
              Non-COGS
            </p>
            <p className="mt-1 text-xl font-semibold text-rose-dark">
              {formatCurrency(nonCogsTotal)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}