"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn("p-2", className)}
      classNames={{
        day_button: "h-9 w-9 rounded-lg hover:bg-muted",
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        today: "bg-primary/10 text-primary font-semibold",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };