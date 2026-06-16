"use server";

import { revalidatePath } from "next/cache";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { createServerClient } from "@/lib/supabase/server";
import type {
  Category,
  CategoryBreakdown,
  DashboardStats,
  ExpenseWithCategory,
} from "@/lib/types";
import { expenseSchema } from "@/lib/validations/expense";

export async function getCategories(): Promise<Category[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getExpenses(filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}): Promise<ExpenseWithCategory[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("expenses")
    .select("*, categories(name)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("date", filters.endDate);
  }
  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    amount: Number(row.amount),
    category_id: row.category_id,
    description: row.description,
    notes: row.notes,
    receipt_url: row.receipt_url,
    is_cogs: row.is_cogs,
    created_at: row.created_at,
    category_name:
      (row.categories as { name: string } | null)?.name ?? "Unknown",
  }));
}

export async function getDashboardStats(
  month?: Date
): Promise<DashboardStats & { recent: ExpenseWithCategory[] }> {
  const target = month ?? new Date();
  const start = format(startOfMonth(target), "yyyy-MM-dd");
  const end = format(endOfMonth(target), "yyyy-MM-dd");

  const expenses = await getExpenses({ startDate: start, endDate: end });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const cogsTotal = expenses
    .filter((e) => e.is_cogs)
    .reduce((sum, e) => sum + e.amount, 0);

  const allRecent = await getExpenses();
  const recent = allRecent.slice(0, 5);

  return {
    total,
    cogsTotal,
    nonCogsTotal: total - cogsTotal,
    recent,
  };
}

export async function getCategoryBreakdown(
  startDate: string,
  endDate: string
): Promise<CategoryBreakdown[]> {
  const expenses = await getExpenses({ startDate, endDate });
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const map = new Map<string, CategoryBreakdown>();
  for (const expense of expenses) {
    const existing = map.get(expense.category_id);
    if (existing) {
      existing.count += 1;
      existing.total += expense.amount;
    } else {
      map.set(expense.category_id, {
        category_id: expense.category_id,
        category_name: expense.category_name,
        count: 1,
        total: expense.amount,
        percentage: 0,
      });
    }
  }

  const breakdown = Array.from(map.values()).sort((a, b) => b.total - a.total);
  return breakdown.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.total / total) * 100 : 0,
  }));
}

export async function createExpense(formData: FormData) {
  const parsed = expenseSchema.safeParse({
    amount: Number(formData.get("amount")),
    date: formData.get("date"),
    category_id: formData.get("category_id"),
    description: formData.get("description"),
    notes: formData.get("notes") || undefined,
    is_cogs: formData.get("is_cogs") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data" };
  }

  const supabase = createServerClient();
  let receiptUrl: string | null = null;

  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const ext = receipt.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, receipt, { contentType: receipt.type });

    if (uploadError) {
      return { error: `Receipt upload failed: ${uploadError.message}` };
    }

    const { data: urlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(path);
    receiptUrl = urlData.publicUrl;
  }

  const { error } = await supabase.from("expenses").insert({
    date: parsed.data.date,
    amount: parsed.data.amount,
    category_id: parsed.data.category_id,
    description: parsed.data.description,
    notes: parsed.data.notes || null,
    is_cogs: parsed.data.is_cogs,
    receipt_url: receiptUrl,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/reports");
  return { success: true };
}