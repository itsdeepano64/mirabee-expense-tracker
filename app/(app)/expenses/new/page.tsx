'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/shell/app-shell';
import { getCategories, createExpense, createCategory } from '@/lib/actions/expenses';
import type { Category } from '@/lib/types';

/* ── Category display ── */
const CAT_ICONS: Record<string, string> = {
  'Flowers & Plants': '🌸', 'Wholesale Flowers': '🌷', 'Vases': '🏺',
  'Tape': '🪢', 'Supplies': '📦', 'Rent': '🏠', 'Utilities': '⚡',
  'Marketing': '📢', 'Payroll': '👥', 'Other': '•',
};
const CAT_BG: Record<string, { bg: string; color: string }> = {
  'Flowers & Plants':  { bg: 'var(--mb-green-light)',  color: 'var(--mb-green-dark)'  },
  'Wholesale Flowers': { bg: 'var(--mb-green-light)',  color: 'var(--mb-green-dark)'  },
  'Supplies':          { bg: 'var(--mb-blue-xlight)',  color: 'var(--mb-blue-dark)'   },
  'Vases':             { bg: 'var(--mb-blue-xlight)',  color: 'var(--mb-blue-dark)'   },
  'Tape':              { bg: 'var(--mb-blue-xlight)',  color: 'var(--mb-blue-dark)'   },
  'Rent':              { bg: '#F6F0EA',                color: 'var(--mb-text-muted)'  },
  'Utilities':         { bg: '#FEF9E7',                color: '#B7950B'               },
  'Marketing':         { bg: 'var(--mb-pink-light)',   color: 'var(--mb-pink-dark)'   },
  'Payroll':           { bg: 'var(--mb-green-light)',  color: 'var(--mb-green-dark)'  },
  'Other':             { bg: '#F6F0EA',                color: 'var(--mb-text-muted)'  },
};

const labelStyle: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em',
  color: 'var(--mb-text-muted)', textTransform: 'uppercase', marginBottom: 6,
};

export default function NewExpensePage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [isCogs, setIsCogs] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Today's date as YYYY-MM-DD default
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats);
      // Pre-select first category
      if (cats.length > 0) setSelectedCatId(cats[0].id);
    });
  }, []);

  function validate(fd: FormData): boolean {
    const errs: Record<string, string> = {};
    const amount = Number(fd.get('amount'));
    if (!amount || amount <= 0) errs.amount = 'Enter a valid amount';
    if (!fd.get('description')) errs.description = 'Add a description';
    if (!fd.get('category_id')) errs.category_id = 'Choose a category';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;

    // Build a native FormData from the form — exactly what createExpense expects
    const fd = new FormData(formRef.current);

    // Inject controlled values that aren't standard inputs
    fd.set('category_id', selectedCatId);
    fd.set('is_cogs', String(isCogs));
    if (receiptFile) fd.set('receipt', receiptFile);

    if (!validate(fd)) return;

    setSaving(true);
    try {
      const result = await createExpense(fd);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Expense saved!');
        router.push('/expenses');
      }
    } catch {
      toast.error('Could not save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    const result = await createCategory({ name: newCatName.trim(), is_pinned: true });
    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    if ('category' in result && result.category) {
      setCategories(prev => [...prev, result.category as Category]);
      setSelectedCatId((result.category as Category).id);
    }
    setNewCatName('');
    setAddingCat(false);
  }

  const header = (
    <header className="mb-app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="mb-hdr-btn" aria-label="Go back" onClick={() => router.back()}>
          <ArrowLeft size={17} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.01em' }}>
          New expense
        </span>
      </div>
      <button
        type="button"
        onClick={handleSubmit as unknown as React.MouseEventHandler}
        disabled={saving}
        style={{ fontSize: 14, fontWeight: 700, color: saving ? 'var(--mb-text-soft)' : 'var(--mb-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </header>
  );

  return (
    <AppShell header={header}>
      {/* noValidate so we handle validation ourselves */}
      <form ref={formRef} onSubmit={handleSubmit} noValidate
        style={{ padding: '16px var(--mb-page-x)', display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        {/* Amount */}
        <div>
          <div style={labelStyle}>Amount</div>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'var(--mb-card)',
            border: `1.5px solid ${errors.amount ? 'var(--mb-pink)' : 'var(--mb-blue)'}`,
            borderRadius: 'var(--mb-r-md)', padding: '13px 16px',
            boxShadow: '0 0 0 3px var(--mb-blue-xlight)',
          }}>
            <span style={{ fontSize: 24, color: 'var(--mb-text-muted)', marginRight: 4, lineHeight: 1 }}>$</span>
            <input
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              autoFocus
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 30, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em', width: '100%' }}
            />
          </div>
          {errors.amount && <p style={{ fontSize: 11.5, color: 'var(--mb-pink)', marginTop: 5 }}>{errors.amount}</p>}
        </div>

        {/* Description */}
        <div>
          <div style={labelStyle}>Description</div>
          <input
            name="description"
            className="mb-field"
            placeholder="What did you spend on?"
          />
          {errors.description && <p style={{ fontSize: 11.5, color: 'var(--mb-pink)', marginTop: 5 }}>{errors.description}</p>}
        </div>

        {/* Category grid */}
        <div>
          <div style={labelStyle}>Category</div>
          {errors.category_id && <p style={{ fontSize: 11.5, color: 'var(--mb-pink)', marginBottom: 6 }}>{errors.category_id}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {categories.map(cat => {
              const style = CAT_BG[cat.name] ?? { bg: '#F6F0EA', color: 'var(--mb-text-muted)' };
              const selected = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className="mb-cat-cell"
                  data-selected={selected}
                  onClick={() => setSelectedCatId(cat.id)}
                >
                  <div className="mb-cat-cell-icon" style={{ background: selected ? 'var(--mb-blue-light)' : style.bg }}>
                    <span style={{ fontSize: 18 }}>{CAT_ICONS[cat.name] ?? '•'}</span>
                  </div>
                  <span className="mb-cat-cell-label">{cat.name}</span>
                </button>
              );
            })}

            {/* Add category */}
            {!addingCat ? (
              <button
                type="button"
                className="mb-cat-cell"
                style={{ borderStyle: 'dashed', borderColor: 'var(--mb-blue)' }}
                onClick={() => setAddingCat(true)}
              >
                <div className="mb-cat-cell-icon" style={{ background: 'var(--mb-blue-xlight)' }}>
                  <span style={{ fontSize: 20, color: 'var(--mb-blue)', fontWeight: 300, lineHeight: 1 }}>+</span>
                </div>
                <span className="mb-cat-cell-label" style={{ color: 'var(--mb-blue)' }}>Add new</span>
              </button>
            ) : (
              <div style={{ gridColumn: 'span 3', display: 'flex', gap: 8 }}>
                <input
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="mb-field"
                  placeholder="Category name"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={handleAddCategory}
                  style={{ background: 'var(--mb-blue)', color: '#fff', border: 'none', borderRadius: 'var(--mb-r-md)', padding: '0 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Add
                </button>
                <button type="button" onClick={() => { setAddingCat(false); setNewCatName(''); }}
                  style={{ background: 'var(--mb-bg)', color: 'var(--mb-text-muted)', border: '1.5px solid var(--mb-border)', borderRadius: 'var(--mb-r-md)', padding: '0 12px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date */}
        <div>
          <div style={labelStyle}>Date</div>
          <div style={{ position: 'relative' }}>
            <input
              name="date"
              type="date"
              defaultValue={today}
              className="mb-field"
              style={{ paddingRight: 40 }}
            />
            <Calendar size={16} color="var(--mb-blue)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* COGS toggle */}
        <div style={{ background: 'var(--mb-card)', border: '1.5px solid var(--mb-border)', borderRadius: 'var(--mb-r-md)', padding: '13px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--mb-shadow-sm)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--mb-text)' }}>Mark as COGS / inventory</div>
            <div style={{ fontSize: 11.5, color: 'var(--mb-text-muted)', marginTop: 2 }}>Cost of goods sold — stock purchase</div>
          </div>
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

        {/* More details accordion */}
        <div style={{ background: 'var(--mb-card)', border: '1.5px solid var(--mb-border)', borderRadius: 'var(--mb-r-md)', overflow: 'hidden', boxShadow: 'var(--mb-shadow-sm)' }}>
          <button
            type="button"
            onClick={() => setShowMore(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--mb-text-muted)' }}>More details (optional)</span>
            {showMore
              ? <ChevronUp size={17} color="var(--mb-text-muted)" />
              : <ChevronDown size={17} color="var(--mb-text-muted)" />}
          </button>

          {showMore && (
            <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div>
                <div style={labelStyle}>Notes</div>
                <textarea
                  name="notes"
                  className="mb-field"
                  placeholder="Add any notes…"
                  rows={3}
                  style={{ resize: 'none', lineHeight: 1.5 }}
                />
              </div>
              <div>
                <div style={labelStyle}>Receipt photo</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'var(--mb-bg)', border: '1.5px dashed var(--mb-border)', borderRadius: 'var(--mb-r-md)', padding: '13px 14px' }}>
                  <Camera size={18} color="var(--mb-blue)" />
                  <span style={{ fontSize: 13.5, color: receiptFile ? 'var(--mb-text)' : 'var(--mb-text-muted)', fontWeight: 500 }}>
                    {receiptFile ? receiptFile.name : 'Take photo or choose from gallery'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="mb-btn-primary" disabled={saving} style={{ marginTop: 4 }}>
          {saving ? 'Saving…' : 'Save expense'}
        </button>
      </form>
    </AppShell>
  );
}
