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

function mapExpenseRow(row: Record<string, unknown>): ExpenseWithCategory {
  return {
    id: row.id as string,
    date: row.date as string,
    amount: Number(row.amount),
    category_id: row.category_id as string,
    description: row.description as string,
    notes: row.notes as string | null,
    receipt_url: row.receipt_url as string | null,
    is_cogs: row.is_cogs as boolean,
    created_at: row.created_at as string,
    category_name:
      (row.categories as { name: string } | null)?.name ?? "Unknown",
  };
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/reports");
}

async function uploadReceipt(
  supabase: ReturnType<typeof createServerClient>,
  receipt: File
): Promise<{ url?: string; error?: string }> {
  const ext = receipt.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(path, receipt, { contentType: receipt.type });

  if (uploadError) {
    return { error: `Receipt upload failed: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(path);
  return { url: urlData.publicUrl };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    ...c,
    is_pinned: c.is_pinned ?? false,
  }));
}

export async function getExpenses(filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  categoryIds?: string[];
  search?: string;
}): Promise<ExpenseWithCategory[]> {
  const supabase = createServerClient();
  let query = supabase
    .from("expenses")
    .select("*, categories(name)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.startDate) query = query.gte("date", filters.startDate);
  if (filters?.endDate) query = query.lte("date", filters.endDate);

  const categoryIds =
    filters?.categoryIds?.length
      ? filters.categoryIds
      : filters?.categoryId
        ? [filters.categoryId]
        : [];

  if (categoryIds.length === 1) {
    query = query.eq("category_id", categoryIds[0]);
  } else if (categoryIds.length > 1) {
    query = query.in("category_id", categoryIds);
  }

  if (filters?.search?.trim()) {
    const term = filters.search.trim();
    query = query.or(
      `description.ilike.%${term}%,notes.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapExpenseRow);
}

export async function getExpenseById(
  id: string
): Promise<ExpenseWithCategory | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, categories(name)")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapExpenseRow(data);
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
  const expenseCount = expenses.length;

  const categoryMap = new Map<string, { name: string; total: number }>();
  for (const e of expenses) {
    const existing = categoryMap.get(e.category_id);
    if (existing) {
      existing.total += e.amount;
    } else {
      categoryMap.set(e.category_id, {
        name: e.category_name,
        total: e.amount,
      });
    }
  }

  let topCategory: { name: string; total: number } | null = null;
  for (const cat of categoryMap.values()) {
    if (!topCategory || cat.total > topCategory.total) topCategory = cat;
  }

  const allRecent = await getExpenses();
  const recent = allRecent.slice(0, 5);

  return {
    total,
    cogsTotal,
    nonCogsTotal: total - cogsTotal,
    expenseCount,
    topCategory,
    averageExpense: expenseCount > 0 ? total / expenseCount : 0,
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

export async function createCategory(data: {
  name: string;
  is_cogs_default?: boolean;
  is_pinned?: boolean;
}) {
  const name = data.name.trim();
  if (!name) return { error: "Category name is required" };

  const supabase = createServerClient();
  const { data: maxOrder } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      name,
      is_cogs_default: data.is_cogs_default ?? false,
      is_pinned: data.is_pinned ?? true,
      sort_order: (maxOrder?.sort_order ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true, category: { ...category, is_pinned: category.is_pinned ?? true } };
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
    const result = await uploadReceipt(supabase, receipt);
    if (result.error) return { error: result.error };
    receiptUrl = result.url ?? null;
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

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function updateExpense(id: string, formData: FormData) {
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
  const existing = await getExpenseById(id);
  if (!existing) return { error: "Expense not found" };

  let receiptUrl = existing.receipt_url;
  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const result = await uploadReceipt(supabase, receipt);
    if (result.error) return { error: result.error };
    receiptUrl = result.url ?? null;
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      date: parsed.data.date,
      amount: parsed.data.amount,
      category_id: parsed.data.category_id,
      description: parsed.data.description,
      notes: parsed.data.notes || null,
      is_cogs: parsed.data.is_cogs,
      receipt_url: receiptUrl,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deleteExpense(id: string) {
  const supabase = createServerClient();
  const existing = await getExpenseById(id);
  if (!existing) return { error: "Expense not found" };

  if (existing.receipt_url) {
    const path = existing.receipt_url.split("/receipts/").pop();
    if (path) {
      await supabase.storage.from("receipts").remove([path]);
    }
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}