"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteExpense } from "@/lib/actions/expenses";
import type { Category, ExpenseWithCategory } from "@/lib/types";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
  SheetCloseButton,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ExpenseEditSheetProps = {
  expense: ExpenseWithCategory | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExpenseEditSheet({
  expense,
  categories,
  open,
  onOpenChange,
}: ExpenseEditSheetProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!expense) return;
    setDeleting(true);
    const result = await deleteExpense(expense.id);
    setDeleting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Expense deleted");
    onOpenChange(false);
    router.refresh();
  }

  if (!expense) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[95vh]">
        <SheetCloseButton />
        <SheetHeader>
          <SheetTitle>Edit expense</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <ExpenseForm
            key={expense.id}
            categories={categories}
            mode="edit"
            expense={expense}
            onSuccess={() => {
              onOpenChange(false);
              router.refresh();
            }}
            onCancel={() => onOpenChange(false)}
          />
        </SheetBody>
        <SheetFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={deleting}>
                Delete expense
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone. The expense and any receipt will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}