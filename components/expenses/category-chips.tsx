"use client";

import { Plus } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type CategoryChipsProps = {
  categories: Category[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onAddClick: () => void;
  showAdd?: boolean;
};

export function CategoryChips({
  categories,
  selectedId,
  onSelect,
  onAddClick,
  showAdd = true,
}: CategoryChipsProps) {
  const pinned = categories.filter((c) => c.is_pinned);
  const others = categories.filter((c) => !c.is_pinned);
  const ordered = [...pinned, ...others];

  return (
    <div className="flex flex-wrap gap-2">
      {ordered.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
            selectedId === category.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:bg-muted"
          )}
        >
          {category.name}
        </button>
      ))}
      {showAdd && (
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      )}
    </div>
  );
}