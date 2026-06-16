"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

const presets = [
  {
    label: "This month",
    getRange: () => {
      const now = new Date();
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    },
  },
  {
    label: "Last month",
    getRange: () => {
      const last = subMonths(new Date(), 1);
      return {
        start: format(startOfMonth(last), "yyyy-MM-dd"),
        end: format(endOfMonth(last), "yyyy-MM-dd"),
      };
    },
  },
  {
    label: "Year to date",
    getRange: () => {
      const now = new Date();
      return {
        start: format(startOfYear(now), "yyyy-MM-dd"),
        end: format(now, "yyyy-MM-dd"),
      };
    },
  },
];

type DateRangePickerProps = {
  defaultStart: string;
  defaultEnd: string;
};

export function DateRangePicker({
  defaultStart,
  defaultEnd,
}: DateRangePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const start = searchParams.get("start") ?? defaultStart;
  const end = searchParams.get("end") ?? defaultEnd;

  function setRange(newStart: string, newEnd: string) {
    const params = new URLSearchParams();
    if (newStart) params.set("start", newStart);
    if (newEnd) params.set("end", newEnd);
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-rose/10 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium">Date range</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const range = preset.getRange();
          const active = start === range.start && end === range.end;
          return (
            <Button
              key={preset.label}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(range.start, range.end)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>From</Label>
          <DatePicker
            value={start ? parseISO(start) : undefined}
            onChange={(date) => setRange(date ? format(date, "yyyy-MM-dd") : "", end)}
          />
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <DatePicker
            value={end ? parseISO(end) : undefined}
            onChange={(date) => setRange(start, date ? format(date, "yyyy-MM-dd") : "")}
          />
        </div>
      </div>
    </div>
  );
}