import { z } from "zod";

export const expenseSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  date: z.string().min(1, "Date is required"),
  category_id: z.string().uuid("Please select a category"),
  description: z.string().min(1, "Description is required").max(200),
  notes: z.string().max(500).optional(),
  is_cogs: z.boolean(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;