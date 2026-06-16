'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus, Search, SlidersHorizontal, Calendar,
  ChevronRight, ChevronLeft, X, Leaf, Check,
} from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { ExpenseEditSheet } from '@/components/expenses/expense-edit-sheet';
import { getExpenses, getCategories } from '@/lib/actions/expenses';
import type { Category, ExpenseWithCategory } from '@/lib/types';

/* ── Display helpers ── */
const CAT_ICONS: Record<string, string> = {
  'Flowers & Plants': '🌸', 'Wholesale Flowers': '🌷', 'Vases': '🏺',
  'Tape': '🪢', 'Supplies': '📦', 'Rent': '🏠', 'Utilities': '⚡',
  'Marketing': '📢', 'Payroll': '👥', 'Other': '•',
};
const CAT_BG: Record<string, string> = {
  'Flowers & Plants': 'var(--mb-green-light)', 'Wholesale Flowers': 'var(--mb-green-light)',
  'Supplies': 'var(--mb-blue-xlight)', 'Vases': 'var(--mb-blue-xlight)',
  'Tape': 'var(--mb-blue-xlight)', 'Rent': '#F6F0EA', 'Utilities': '#FEF9E7',
  'Marketing': 'var(--mb-pink-light)', 'Payroll': 'var(--mb-green-light)', 'Other': '#F6F0EA',
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function groupByDate(exps: ExpenseWithCategory[]): { label: string; items: ExpenseWithCategory[] }[] {
  const map = new Map<string, ExpenseWithCategory[]>();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  for (const e of exps) {
    const d = new Date(e.date); d.setHours(0, 0, 0, 0);
    const label =
      d.getTime() === today.getTime() ? 'Today'
      : d.getTime() === yesterday.getTime() ? 'Yesterday'
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(e);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

/* ── Month picker sheet ── */
function MonthPickerSheet({
  year, month,
  onSelect, onClose,
}: {
  year: number; month: number;
  onSelect: (y: number, m: number) => void;
  onClose: () => void;
}) {
  const [viewYear, setViewYear] = useState(year);
  const now = new Date();

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(58,47,47,0.40)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--mb-card)', borderRadius: '22px 22px 0 0',
          width: '100%', maxWidth: 430,
          padding: '16px 20px calc(28px + env(safe-area-inset-bottom))',
          boxShadow: '0 -4px 24px rgba(58,47,47,0.12)',
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: 'var(--mb-border)', borderRadius: 2, margin: '0 auto 18px' }} />

        {/* Year nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button
            onClick={() => setViewYear(v => v - 1)}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--mb-border)', background: 'var(--mb-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--mb-text-muted)' }}
          >
            <ChevronLeft size={17} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em' }}>
            {viewYear}
          </span>
          <button
            onClick={() => setViewYear(v => v + 1)}
            disabled={viewYear >= now.getFullYear()}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--mb-border)', background: viewYear >= now.getFullYear() ? 'transparent' : 'var(--mb-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: viewYear >= now.getFullYear() ? 'default' : 'pointer', color: viewYear >= now.getFullYear() ? 'var(--mb-border)' : 'var(--mb-text-muted)', opacity: viewYear >= now.getFullYear() ? 0.4 : 1 }}
          >
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Month grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {months.map((name, i) => {
            const isFuture = viewYear === now.getFullYear() && i > now.getMonth();
            const isSelected = viewYear === year && i === month;
            return (
              <button
                key={name}
                disabled={isFuture}
                onClick={() => { onSelect(viewYear, i); onClose(); }}
                style={{
                  padding: '11px 0', borderRadius: 10, border: '1.5px solid',
                  borderColor: isSelected ? 'var(--mb-blue)' : 'var(--mb-border)',
                  background: isSelected ? 'var(--mb-blue)' : 'var(--mb-bg)',
                  color: isSelected ? '#fff' : isFuture ? 'var(--mb-border)' : 'var(--mb-text)',
                  fontSize: 13, fontWeight: isSelected ? 700 : 600,
                  cursor: isFuture ? 'default' : 'pointer',
                  opacity: isFuture ? 0.4 : 1,
                }}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Filter sheet ── */
function FilterSheet({
  categories,
  activeCatIds,
  cogsOnly,
  onToggleCat,
  onToggleCogs,
  onClear,
  onClose,
}: {
  categories: Category[];
  activeCatIds: string[];
  cogsOnly: boolean;
  onToggleCat: (id: string) => void;
  onToggleCogs: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const hasFilters = activeCatIds.length > 0 || cogsOnly;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(58,47,47,0.40)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--mb-card)', borderRadius: '22px 22px 0 0',
          width: '100%', maxWidth: 430,
          padding: '16px 20px calc(24px + env(safe-area-inset-bottom))',
          boxShadow: '0 -4px 24px rgba(58,47,47,0.12)',
          maxHeight: '80dvh', overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ width: 40, height: 4, background: 'var(--mb-border)', borderRadius: 2, margin: '0 auto 16px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em' }}>Filters</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {hasFilters && (
              <button
                onClick={onClear}
                style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--mb-pink)', background: 'var(--mb-pink-light)', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid var(--mb-border)', background: 'var(--mb-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--mb-text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* COGS toggle */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--mb-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
          Type
        </div>
        <button
          onClick={onToggleCogs}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 12,
            border: '1.5px solid', borderColor: cogsOnly ? 'var(--mb-green)' : 'var(--mb-border)',
            background: cogsOnly ? 'var(--mb-green-light)' : 'var(--mb-bg)',
            cursor: 'pointer', marginBottom: 16,
          }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--mb-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={15} color="var(--mb-green)" />
          </div>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--mb-text)', textAlign: 'left' }}>COGS only</span>
          {cogsOnly && <Check size={16} color="var(--mb-green)" />}
        </button>

        {/* Categories */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--mb-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
          Category
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {categories.map(cat => {
            const active = activeCatIds.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => onToggleCat(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 12,
                  border: '1.5px solid', borderColor: active ? 'var(--mb-blue)' : 'var(--mb-border)',
                  background: active ? 'var(--mb-blue-xlight)' : 'var(--mb-bg)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: CAT_BG[cat.name] ?? '#F6F0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {CAT_ICONS[cat.name] ?? '•'}
                </div>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--mb-text)', textAlign: 'left' }}>{cat.name}</span>
                {active && <Check size={16} color="var(--mb-blue)" />}
              </button>
            );
          })}
        </div>

        {/* Apply */}
        <button
          onClick={onClose}
          className="mb-btn-primary"
          style={{ marginTop: 18 }}
        >
          Apply filters {hasFilters ? `(${activeCatIds.length + (cogsOnly ? 1 : 0)} active)` : ''}
        </button>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function ExpensesPage() {
  return (
    <Suspense fallback={null}>
      <ExpensesPageContent />
    </Suspense>
  );
}

function ExpensesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const [viewYear, setViewYear]     = useState(now.getFullYear());
  const [viewMonth, setViewMonth]   = useState(now.getMonth());
  const [q, setQ]                   = useState(searchParams.get('q') ?? '');
  const [activeCatIds, setActiveCatIds] = useState<string[]>(
    searchParams.get('categories')?.split(',').filter(Boolean) ?? [],
  );
  const [cogsOnly, setCogsOnly]     = useState(false);
  const [expenses, setExpenses]     = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [editId, setEditId]         = useState<string | null>(searchParams.get('edit'));
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showFilters, setShowFilters]         = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    getCategories().then(cats => setCategories(cats));
  }, []);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(viewYear, viewMonth, 1).toISOString().split('T')[0];
      const endDate   = new Date(viewYear, viewMonth + 1, 0).toISOString().split('T')[0];

      const data = await getExpenses({
        search:      q || undefined,
        categoryIds: activeCatIds.length ? activeCatIds : undefined,
        startDate,
        endDate,
      });

      setExpenses(cogsOnly ? data.filter(e => e.is_cogs) : data);
    } catch (err) {
      console.error('Expenses load error:', err);
    } finally {
      setLoading(false);
    }
  }, [q, activeCatIds, cogsOnly, viewYear, viewMonth]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(loadExpenses, q ? 300 : 0);
    return () => clearTimeout(debounceRef.current);
  }, [loadExpenses, q]);

  function toggleCat(id: string) {
    setActiveCatIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function clearFilters() {
    setActiveCatIds([]);
    setCogsOnly(false);
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const grouped        = groupByDate(expenses);
  const editExpense    = expenses.find(e => e.id === editId) ?? null;
  const hasFilters     = activeCatIds.length > 0 || cogsOnly;
  const totalVisible   = expenses.reduce((s, e) => s + e.amount, 0);

  const expensesHeader = (
    <header className="mb-app-header">
      <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em' }}>
        Expenses
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="mb-hdr-btn"
          aria-label="Choose month"
          onClick={() => setShowMonthPicker(true)}
        >
          <Calendar size={17} />
        </button>
        <button
          className="mb-hdr-btn"
          aria-label="Filters"
          onClick={() => setShowFilters(true)}
          style={hasFilters ? { background: 'var(--mb-blue-xlight)', borderColor: 'var(--mb-blue)', color: 'var(--mb-blue)' } : {}}
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>
    </header>
  );

  return (
    <AppShell header={expensesHeader}>
      <div style={{ padding: '14px var(--mb-page-x)', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Search */}
        <div className="mb-search">
          <Search size={17} color="var(--mb-text-soft)" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search expenses…"
            aria-label="Search expenses"
          />
          {q && (
            <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mb-text-soft)', display: 'flex', padding: 0 }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Month row with navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => {
              const d = new Date(viewYear, viewMonth - 1, 1);
              setViewYear(d.getFullYear());
              setViewMonth(d.getMonth());
            }}
            style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--mb-border)', background: 'var(--mb-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--mb-text-muted)', flexShrink: 0 }}
          >
            <ChevronLeft size={15} />
          </button>

          <div className="mb-date-pill" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowMonthPicker(true)}>
            <Calendar size={14} color="var(--mb-blue)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mb-text)' }}>
              {monthLabel}
            </span>
          </div>

          <button
            onClick={() => {
              const d = new Date(viewYear, viewMonth + 1, 1);
              setViewYear(d.getFullYear());
              setViewMonth(d.getMonth());
            }}
            disabled={isCurrentMonth}
            style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--mb-border)', background: isCurrentMonth ? 'transparent' : 'var(--mb-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isCurrentMonth ? 'default' : 'pointer', color: isCurrentMonth ? 'var(--mb-border)' : 'var(--mb-text-muted)', opacity: isCurrentMonth ? 0.35 : 1, flexShrink: 0 }}
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Summary strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            flex: 1, background: 'var(--mb-card)', border: '1px solid var(--mb-border)',
            borderRadius: 10, padding: '9px 13px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: 'var(--mb-shadow-sm)',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mb-text-muted)' }}>
              {loading ? '—' : `${expenses.length} item${expenses.length !== 1 ? 's' : ''}`}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--mb-text)' }}>
              {loading ? '—' : fmt(totalVisible)}
            </span>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, background: 'var(--mb-pink-light)', border: '1.5px solid #F0C0CC', color: '#993556', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Quick filter chips */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <button
            className={`mb-chip ${!hasFilters ? 'mb-chip-active' : ''}`}
            onClick={clearFilters}
          >
            All
          </button>
          <button
            className={`mb-chip ${cogsOnly ? 'mb-chip-green' : ''}`}
            onClick={() => setCogsOnly(v => !v)}
          >
            🌱 COGS
          </button>
          {categories.filter(c => c.is_pinned).map(cat => (
            <button
              key={cat.id}
              className={`mb-chip ${activeCatIds.includes(cat.id) ? 'mb-chip-active' : ''}`}
              onClick={() => toggleCat(cat.id)}
            >
              {CAT_ICONS[cat.name] ?? '•'} {cat.name}
            </button>
          ))}
        </div>

        {/* Expense groups */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2].map(g => (
              <div key={g}>
                <div className="mb-skeleton" style={{ height: 12, width: 100, marginBottom: 8, borderRadius: 6 }} />
                <div className="mb-card" style={{ overflow: 'hidden' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ padding: '12px 14px', borderTop: i > 1 ? '1px solid var(--mb-border)' : 'none', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="mb-skeleton" style={{ width: 40, height: 40, borderRadius: 13 }} />
                      <div style={{ flex: 1 }}>
                        <div className="mb-skeleton" style={{ height: 13, width: '60%', marginBottom: 6 }} />
                        <div className="mb-skeleton" style={{ height: 11, width: '35%' }} />
                      </div>
                      <div className="mb-skeleton" style={{ height: 14, width: 50 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '52px 0', color: 'var(--mb-text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🌻</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--mb-text)', marginBottom: 6 }}>
              {q || hasFilters ? 'No matching expenses' : 'No expenses yet'}
            </div>
            <div style={{ fontSize: 13 }}>
              {q ? 'Try a different search term.' : hasFilters ? 'Try clearing your filters.' : 'Tap + to log your first expense.'}
            </div>
          </div>
        ) : (
          grouped.map(({ label, items }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mb-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 2 }}>
                {label}
              </div>
              <div className="mb-card" style={{ overflow: 'hidden' }}>
                {items.map((exp, i) => {
                  const icon = CAT_ICONS[exp.category_name] ?? '•';
                  const bg   = CAT_BG[exp.category_name]   ?? '#F6F0EA';
                  return (
                    <div
                      key={exp.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i > 0 ? '1px solid var(--mb-border)' : 'none', cursor: 'pointer' }}
                      onClick={() => setEditId(exp.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setEditId(exp.id)}
                    >
                      <div className="mb-exp-icon" style={{ background: bg }}>
                        <span style={{ fontSize: 19 }}>{icon}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--mb-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {exp.description}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--mb-text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {exp.category_name}
                          {exp.is_cogs && <span className="mb-badge-cogs">COGS</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mb-text)' }}>{fmt(exp.amount)}</div>
                        <div style={{ fontSize: 10, color: 'var(--mb-text-soft)', marginTop: 1 }}>
                          {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        className="mb-fab"
        aria-label="Add expense"
        onClick={() => router.push('/expenses/new')}
        style={{ position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom) + 12px)', right: 20, zIndex: 45 }}
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </button>

      {/* Month picker sheet */}
      {showMonthPicker && (
        <MonthPickerSheet
          year={viewYear}
          month={viewMonth}
          onSelect={(y, m) => { setViewYear(y); setViewMonth(m); }}
          onClose={() => setShowMonthPicker(false)}
        />
      )}

      {/* Filter sheet */}
      {showFilters && (
        <FilterSheet
          categories={categories}
          activeCatIds={activeCatIds}
          cogsOnly={cogsOnly}
          onToggleCat={toggleCat}
          onToggleCogs={() => setCogsOnly(v => !v)}
          onClear={clearFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Edit sheet */}
      {editId && (
        <ExpenseEditSheet
          expense={editExpense}
          onClose={() => setEditId(null)}
          onSaved={() => { setEditId(null); loadExpenses(); }}
          onDeleted={() => { setEditId(null); loadExpenses(); }}
        />
      )}
    </AppShell>
  );
}
