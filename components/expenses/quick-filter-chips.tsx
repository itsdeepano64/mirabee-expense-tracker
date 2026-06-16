"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AddCategoryDialog } from "@/components/expenses/add-category-dialog";
import { useState } from "react";

type QuickFilterChipsProps = {
  categories: Category[];
};

export function QuickFilterChips({ categories }: QuickFilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);

  const activeIds = new Set(
    (searchParams.get("categories") ?? "").split(",").filter(Boolean)
  );

  const pinned = categories.filter((c) => c.is_pinned);

  function toggleCategory(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    const next = new Set(activeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);

    if (next.size > 0) {
      params.set("categories", Array.from(next).join(","));
    } else {
      params.delete("categories");
    }
    router.push(`/expenses?${params.toString()}`);
  }

  function handleCategoryCreated(category: Category) {
    toggleCategory(category.id);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {pinned.map((category) => {
          const active = activeIds.has(category.id);
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => toggleCategory(category.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              )}
            >
              {category.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      <AddCategoryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={handleCategoryCreated}
      />
    </>
  );
}