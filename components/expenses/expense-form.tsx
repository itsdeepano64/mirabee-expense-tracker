"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { createExpense, updateExpense } from "@/lib/actions/expenses";
import type { Category, ExpenseWithCategory } from "@/lib/types";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validations/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { CategoryChips } from "@/components/expenses/category-chips";
import { AddCategoryDialog } from "@/components/expenses/add-category-dialog";
import { ReceiptUpload } from "@/components/expenses/receipt-upload";
import { cn } from "@/lib/utils";

type ExpenseFormProps = {
  categories: Category[];
  mode?: "create" | "edit";
  expense?: ExpenseWithCategory;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ExpenseForm({
  categories: initialCategories,
  mode = "create",
  expense,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: expense?.amount,
      date: expense?.date ?? format(new Date(), "yyyy-MM-dd"),
      category_id: expense?.category_id ?? "",
      description: expense?.description ?? "",
      notes: expense?.notes ?? "",
      is_cogs: expense?.is_cogs ?? false,
    },
  });

  const selectedCategoryId = watch("category_id");
  const isCogs = watch("is_cogs");

  async function onSubmit(data: ExpenseFormValues) {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("amount", String(data.amount));
    formData.append("date", data.date);
    formData.append("category_id", data.category_id);
    formData.append("description", data.description);
    if (data.notes) formData.append("notes", data.notes);
    formData.append("is_cogs", String(data.is_cogs));
    if (receiptFile) formData.append("receipt", receiptFile);

    const result =
      mode === "edit" && expense
        ? await updateExpense(expense.id, formData)
        : await createExpense(formData);

    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(mode === "edit" ? "Expense updated!" : "Expense saved!");
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/expenses");
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            autoFocus={mode === "create"}
            className="h-14 text-2xl font-semibold"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-sm text-accent-rose">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="What was this expense for?"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-accent-rose">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <CategoryChips
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={(id) => setValue("category_id", id, { shouldValidate: true })}
            onAddClick={() => setAddCategoryOpen(true)}
          />
          {errors.category_id && (
            <p className="text-sm text-accent-rose">{errors.category_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Date</Label>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <DatePicker
                value={field.value ? new Date(field.value + "T12:00:00") : undefined}
                onChange={(date) =>
                  field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                }
              />
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4">
          <div>
            <Label htmlFor="is_cogs" className="cursor-pointer">
              This is inventory / COGS
            </Label>
            <p className="text-xs text-muted-foreground">Optional — flowers, plants, supplies for arrangements</p>
          </div>
          <Switch
            id="is_cogs"
            checked={isCogs}
            onCheckedChange={(checked) => setValue("is_cogs", checked)}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          More details
          {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <div className={cn("space-y-4", !showMore && "hidden")}>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any extra details..."
              {...register("notes")}
            />
          </div>
          <ReceiptUpload
            onFileChange={setReceiptFile}
            existingUrl={expense?.receipt_url}
          />
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
            {submitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Save Expense"}
          </Button>
        </div>
      </form>

      <AddCategoryDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCreated={(category) => {
          setCategories((prev) => [...prev, category]);
          setValue("category_id", category.id, { shouldValidate: true });
        }}
      />
    </>
  );
}