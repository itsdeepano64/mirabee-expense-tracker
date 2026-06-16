"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createCategory } from "@/lib/actions/expenses";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";

type AddCategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (category: Category) => void;
};

export function AddCategoryDialog({
  open,
  onOpenChange,
  onCreated,
}: AddCategoryDialogProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await createCategory({ name, is_pinned: true });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.category) {
      onCreated(result.category as Category);
      toast.success(`"${name}" added`);
      setName("");
      onOpenChange(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add category</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit}>
          <SheetBody>
            <div className="space-y-2">
              <Label htmlFor="category-name">Category name</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ribbon, Foliage..."
                autoFocus
              />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button type="submit" className="w-full" disabled={submitting || !name.trim()}>
              {submitting ? "Adding..." : "Add Category"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}