"use client";

import Image from "next/image";
import { format, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ExpenseWithCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ExpenseCardProps = {
  expense: ExpenseWithCategory;
  onClick: () => void;
};

export function ExpenseCard({ expense, onClick }: ExpenseCardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="flex gap-3 p-4">
        {expense.receipt_url && (
          <div className="shrink-0">
            <Image
              src={expense.receipt_url}
              alt="Receipt"
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-foreground">{expense.description}</p>
            <div className="flex shrink-0 items-center gap-1">
              <p className="font-semibold">{formatCurrency(expense.amount)}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {format(parseISO(expense.date), "MMM d, yyyy")}
            </span>
            <Badge variant="outline">{expense.category_name}</Badge>
            {expense.is_cogs && <Badge variant="sage">COGS</Badge>}
          </div>
          {expense.notes && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {expense.notes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}