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
        day_button: "h-9 w-9 rounded-lg hover:bg-rose/10",
        selected: "bg-rose text-white hover:bg-rose hover:text-white",
        today: "bg-rose/10 text-rose-dark font-semibold",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };