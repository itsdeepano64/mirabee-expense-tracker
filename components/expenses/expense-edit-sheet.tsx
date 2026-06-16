'use client';

import { useEffect, useState } from 'react';
import { X, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { updateExpense, deleteExpense, getCategories } from '@/lib/actions/expenses';
import type { Category, ExpenseWithCategory } from '@/lib/types';

const CAT_ICONS: Record<string, string> = {
  'Flowers & Plants': '🌸', 'Wholesale Flowers': '🌷', 'Vases': '🏺',
  'Tape': '🪢', 'Supplies': '📦', 'Rent': '🏠', 'Utilities': '⚡',
  'Marketing': '📢', 'Payroll': '👥', 'Other': '•',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em',
  color: 'var(--mb-text-muted)', textTransform: 'uppercase', marginBottom: 6,
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

interface Props {
  expense: ExpenseWithCategory | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function ExpenseEditSheet({ expense, onClose, onSaved, onDeleted }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [isCogs, setIsCogs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats);
    });
  }, []);

  useEffect(() => {
    if (expense) {
      setSelectedCatId(expense.category_id);
      setIsCogs(expense.is_cogs);
    }
  }, [expense]);

  if (!expense) return null;

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;

    // Build native FormData — exactly what updateExpense(id, FormData) expects
    const fd = new FormData(form);
    fd.set('category_id', selectedCatId);
    fd.set('is_cogs', String(isCogs));

    setSaving(true);
    try {
      const result = await updateExpense(expense!.id, fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Expense updated');
        onSaved();
      }
    } catch {
      toast.error('Could not update expense.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setSaving(true);
    try {
      const result = await deleteExpense(expense!.id);
      if (result?.error) {
        toast.error(result.error);
        setSaving(false);
      } else {
        toast.success('Expense deleted');
        onDeleted();
      }
    } catch {
      toast.error('Could not delete expense.');
      setSaving(false);
    }
  }

  return (
    <div
      className="mb-sheet-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit: ${expense.description}`}
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
          <button onClick={onClose} className="mb-hdr-btn" aria-label="Close">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {/* Amount */}
          <div>
            <div style={labelStyle}>Amount</div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--mb-card)', border: '1.5px solid var(--mb-border)', borderRadius: 'var(--mb-r-md)', padding: '11px 14px', boxShadow: 'var(--mb-shadow-sm)' }}>
              <span style={{ fontSize: 18, color: 'var(--mb-text-muted)', marginRight: 4 }}>$</span>
              <input
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                defaultValue={expense.amount.toFixed(2)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 22, fontWeight: 700, color: 'var(--mb-text)', width: '100%' }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={labelStyle}>Description</div>
            <input
              name="description"
              className="mb-field"
              defaultValue={expense.description}
            />
          </div>

          {/* Category chips */}
          <div>
            <div style={labelStyle}>Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`mb-chip ${selectedCatId === cat.id ? 'mb-chip-active' : ''}`}
                  onClick={() => setSelectedCatId(cat.id)}
                >
                  {CAT_ICONS[cat.name] ?? '•'} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <div style={labelStyle}>Date</div>
            <div style={{ position: 'relative' }}>
              <input
                name="date"
                type="date"
                defaultValue={expense.date.split('T')[0]}
                className="mb-field"
                style={{ paddingRight: 40 }}
              />
              <Calendar size={15} color="var(--mb-blue)" style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Notes */}
          {(expense.notes !== null && expense.notes !== undefined) || true ? (
            <div>
              <div style={labelStyle}>Notes (optional)</div>
              <textarea
                name="notes"
                className="mb-field"
                defaultValue={expense.notes ?? ''}
                rows={2}
                style={{ resize: 'none', lineHeight: 1.5 }}
              />
            </div>
          ) : null}

          {/* COGS toggle */}
          <div style={{ background: 'var(--mb-bg)', border: '1.5px solid var(--mb-border)', borderRadius: 'var(--mb-r-md)', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--mb-text)' }}>COGS / inventory</div>
            <button
              type="button"
              className="mb-toggle"
              data-checked={isCogs}
              onClick={() => setIsCogs(v => !v)}
              role="switch"
              aria-checked={isCogs}
              aria-label="Mark as COGS"
            />
          </div>

          <button type="submit" className="mb-btn-primary" disabled={saving}>
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
