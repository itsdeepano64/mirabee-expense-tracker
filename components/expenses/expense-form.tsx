"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { createExpense } from "@/lib/actions/expenses";
import type { Category } from "@/lib/types";
import { expenseSchema, type ExpenseFormValues } from "@/lib/validations/expense";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ReceiptUpload } from "@/components/expenses/receipt-upload";

type ExpenseFormProps = {
  categories: Category[];
};

export function ExpenseForm({ categories }: ExpenseFormProps) {
  const router = useRouter();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      amount: undefined,
      date: format(new Date(), "yyyy-MM-dd"),
      category_id: "",
      description: "",
      notes: "",
      is_cogs: false,
    },
  });

  const selectedCategoryId = watch("category_id");

  function handleCategoryChange(categoryId: string) {
    setValue("category_id", categoryId);
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setValue("is_cogs", category.is_cogs_default);
    }
  }

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

    const result = await createExpense(formData);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Expense saved!");
    router.push("/expenses");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-sm text-red-600">{errors.amount.message}</p>
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
        {errors.date && (
          <p className="text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && (
          <p className="text-sm text-red-600">{errors.category_id.message}</p>
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
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any extra details..."
          {...register("notes")}
        />
      </div>

      <ReceiptUpload onFileChange={setReceiptFile} />

      <div className="flex items-center gap-3 rounded-xl border border-sage/20 bg-sage/5 p-4">
        <Controller
          control={control}
          name="is_cogs"
          render={({ field }) => (
            <Checkbox
              id="is_cogs"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <div>
          <Label htmlFor="is_cogs" className="cursor-pointer">
            Mark as COGS
          </Label>
          <p className="text-xs text-muted-foreground">
            Cost of goods sold (flowers, plants, etc.)
          </p>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Saving..." : "Save Expense"}
      </Button>
    </form>
  );
}