export type Category = {
  id: string;
  name: string;
  is_cogs_default: boolean;
  is_pinned: boolean;
  sort_order: number;
};

export type Expense = {
  id: string;
  date: string;
  amount: number;
  category_id: string;
  description: string;
  notes: string | null;
  receipt_url: string | null;
  is_cogs: boolean;
  created_at: string;
};

export type ExpenseWithCategory = Expense & {
  category_name: string;
};

export type DashboardStats = {
  total: number;
  cogsTotal: number;
  nonCogsTotal: number;
  expenseCount: number;
  topCategory: { name: string; total: number } | null;
  averageExpense: number;
};

export type CategoryBreakdown = {
  category_id: string;
  category_name: string;
  count: number;
  total: number;
  percentage: number;
};