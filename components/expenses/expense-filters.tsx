"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

type ExpenseFiltersProps = {
  defaultStart: string;
  defaultEnd: string;
};

export function ExpenseFilters({
  defaultStart,
  defaultEnd,
}: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startDate = searchParams.get("start") ?? defaultStart;
  const endDate = searchParams.get("end") ?? defaultEnd;

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/expenses?${params.toString()}`);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
    </div>
  );
}