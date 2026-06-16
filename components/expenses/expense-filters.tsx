"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import type { Category } from "@/lib/types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

type ExpenseFiltersProps = {
  categories: Category[];
  defaultStart: string;
  defaultEnd: string;
};

export function ExpenseFilters({
  categories,
  defaultStart,
  defaultEnd,
}: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startDate = searchParams.get("start") ?? defaultStart;
  const endDate = searchParams.get("end") ?? defaultEnd;
  const categoryId = searchParams.get("category") ?? "all";

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/expenses?${params.toString()}`);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-rose/10 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-foreground">Filters</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>From</Label>
          <DatePicker
            value={startDate ? parseISO(startDate) : undefined}
            onChange={(date) =>
              updateParams("start", date ? format(date, "yyyy-MM-dd") : "")
            }
            placeholder="Start date"
          />
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <DatePicker
            value={endDate ? parseISO(endDate) : undefined}
            onChange={(date) =>
              updateParams("end", date ? format(date, "yyyy-MM-dd") : "")
            }
            placeholder="End date"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={categoryId}
            onValueChange={(value) => updateParams("category", value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}