'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { updateExpense, deleteExpense, getCategories } from '@/lib/actions/expenses';

const CAT_ICONS: Record<string, string> = {
  'Flowers & Plants': '🌸', 'Wholesale Flowers': '🌷', 'Vases': '🏺',
  'Tape': '🪢', 'Supplies': '📦', 'Rent': '🏠', 'Utilities': '⚡',
  'Marketing': '📢', 'Payroll': '👥', 'Other': '•',
};

const schema = z.object({
  amount: z.string().min(1).refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0),
  description: z.string().min(1),
  category_id: z.string().min(1),
  date: z.string().min(1),
  is_cogs: z.boolean(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  is_cogs: boolean;
  notes?: string;
  receipt_url?: string;
  category: { id: string; name: string } | null;
}
interface Category { id: string; name: string; is_pinned: boolean }

interface Props {
  expense: Expense | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function ExpenseEditSheet({ expense, onClose, onSaved, onDeleted }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (expense) {
      reset({
        amount: expense.amount.toFixed(2),
        description: expense.description,
        category_id: expense.category?.id ?? '',
        date: expense.date.split('T')[0],
        is_cogs: expense.is_cogs,
        notes: expense.notes ?? '',
      });
    }
  }, [expense, reset]);

  if (!expense) return null;

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      await updateExpense(expense!.id, {
        amount: parseFloat(data.amount),
        description: data.description,
        category_id: data.category_id,
        date: data.date,
        is_cogs: data.is_cogs,
        notes: data.notes,
      });
      toast.success('Expense updated');
      onSaved();
    } catch {
      toast.error('Could not update expense.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    setSaving(true);
    try {
      await deleteExpense(expense!.id);
      toast.success('Expense deleted');
      onDeleted();
    } catch {
      toast.error('Could not delete expense.');
      setSaving(false);
    }
  }

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div
      className="mb-sheet-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit expense: ${expense.description}`}
    >
      <div className="mb-sheet">
        <div className="mb-sheet-handle" />

        {/* Sheet header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.01em' }}>
              {expense.description}
            </div>
            <div style={{ fontSize: 12, color: 'var(--mb-text-muted)', marginTop: 2 }}>
              {fmt(expense.amount)} · {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="mb-hdr-btn"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 11 }} noValidate>
          {/* Amount */}
          <div>
            <div style={labelStyle}>Amount</div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--mb-card)', border: '1.5px solid var(--mb-border)', borderRadius: 'var(--mb-r-md)', padding: '11px 14px', boxShadow: 'var(--mb-shadow-sm)' }}>
              <span style={{ fontSize: 18, color: 'var(--mb-text-muted)', marginRight: 4 }}>$</span>
              <input
                {...register('amount')}
                type="number"
                inputMode="decimal"
                step="0.01"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 22, fontWeight: 700, color: 'var(--mb-text)', width: '100%' }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={labelStyle}>Description</div>
            <input {...register('description')} className="mb-field" />
          </div>

          {/* Category */}
          <div>
            <div style={labelStyle}>Category</div>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`mb-chip ${field.value === cat.id ? 'mb-chip-active' : ''}`}
                      onClick={() => field.onChange(cat.id)}
                    >
                      {CAT_ICONS[cat.name] ?? '•'} {cat.name}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Date */}
          <div>
            <div style={labelStyle}>Date</div>
            <div style={{ position: 'relative' }}>
              <input {...register('date')} type="date" className="mb-field" style={{ paddingRight: 40 }} />
              <Calendar size={15} color="var(--mb-blue)" style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* COGS */}
          <div style={{ background: 'var(--mb-bg)', border: '1.5px solid var(--mb-border)', borderRadius: 'var(--mb-r-md)', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--mb-text)' }}>COGS / inventory</div>
            <Controller
              name="is_cogs"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  className="mb-toggle"
                  data-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  role="switch"
                  aria-checked={field.value}
                  aria-label="Mark as COGS"
                />
              )}
            />
          </div>

          <button
            type="submit"
            className="mb-btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          <button
            type="button"
            className="mb-btn-delete"
            onClick={handleDelete}
            disabled={saving}
          >
            <Trash2 size={16} />
            {confirming ? 'Tap again to confirm delete' : 'Delete expense'}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em',
  color: 'var(--mb-text-muted)', textTransform: 'uppercase', marginBottom: 6,
};
