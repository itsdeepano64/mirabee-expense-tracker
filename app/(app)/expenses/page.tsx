'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, SlidersHorizontal, Calendar, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { ExpenseEditSheet } from '@/components/expenses/expense-edit-sheet';
import { getExpenses, getCategories } from '@/lib/actions/expenses';

interface Category { id: string; name: string; is_pinned: boolean }
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

const CAT_ICONS: Record<string, string> = {
  'Flowers & Plants': '🌸', 'Wholesale Flowers': '🌷', 'Vases': '🏺',
  'Tape': '🪢', 'Supplies': '📦', 'Rent': '🏠', 'Utilities': '⚡',
  'Marketing': '📢', 'Payroll': '👥', 'Other': '•',
};
const CAT_BG: Record<string, string> = {
  'Flowers & Plants': 'var(--mb-green-light)', 'Wholesale Flowers': 'var(--mb-green-light)',
  'Vases': 'var(--mb-blue-xlight)', 'Supplies': 'var(--mb-blue-xlight)',
  'Tape': 'var(--mb-blue-xlight)', 'Rent': '#F6F0EA', 'Utilities': '#FEF9E7',
  'Marketing': 'var(--mb-pink-light)', 'Payroll': 'var(--mb-green-light)', 'Other': '#F6F0EA',
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function groupByDate(exps: Expense[]): { label: string; items: Expense[] }[] {
  const map = new Map<string, Expense[]>();
  for (const e of exps) {
    const d = new Date(e.date);
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    d.setHours(0,0,0,0);
    const label = d.getTime() === today.getTime() ? 'Today'
      : d.getTime() === yesterday.getTime() ? 'Yesterday'
      : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(e);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

export default function ExpensesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [activeCats, setActiveCats] = useState<string[]>(
    searchParams.get('categories')?.split(',').filter(Boolean) ?? []
  );
  const [cogsOnly, setCogsOnly] = useState(false);
  const [startDate, setStartDate] = useState<string>(searchParams.get('start') ?? '');
  const [endDate, setEndDate] = useState<string>(searchParams.get('end') ?? '');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(searchParams.get('edit'));
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  /* load categories once */
  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  /* load expenses when filters change */
  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const data = await getExpenses({
        q: q || undefined,
        categories: activeCats.length ? activeCats : undefined,
        start: startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        end: endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
        is_cogs: cogsOnly ? true : undefined,
      });
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  }, [q, activeCats, startDate, endDate, cogsOnly]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(loadExpenses, q ? 300 : 0);
  }, [loadExpenses, q]);

  function toggleCat(id: string) {
    setActiveCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function toggleCogsOnly() { setCogsOnly(v => !v); }

  const pinned = categories.filter(c => c.is_pinned);
  const grouped = groupByDate(expenses);
  const editExpense = editId ? expenses.find(e => e.id === editId) : null;

  const expensesHeader = (
    <header className="mb-app-header">
      <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em' }}>Expenses</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="mb-hdr-btn" aria-label="Date filter">
          <Calendar size={17} />
        </button>
        <button className="mb-hdr-btn" aria-label="More filters">
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
        </div>

        {/* Date + count row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div className="mb-date-pill" style={{ flex: 1 }}>
            <Calendar size={15} color="var(--mb-blue)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--mb-text)' }}>
              {startDate && endDate
                ? `${startDate} – ${endDate}`
                : new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
              }
            </span>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--mb-text-muted)', whiteSpace: 'nowrap' }}>
            {expenses.length} items
          </span>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <button
            className={`mb-chip ${activeCats.length === 0 && !cogsOnly ? 'mb-chip-active' : ''}`}
            onClick={() => { setActiveCats([]); setCogsOnly(false); }}
          >
            All
          </button>
          {pinned.map(cat => (
            <button
              key={cat.id}
              className={`mb-chip ${activeCats.includes(cat.id) ? 'mb-chip-active' : ''}`}
              onClick={() => toggleCat(cat.id)}
            >
              {CAT_ICONS[cat.name] ?? '•'} {cat.name}
            </button>
          ))}
          <button
            className={`mb-chip ${cogsOnly ? 'mb-chip-green' : ''}`}
            onClick={toggleCogsOnly}
          >
            🌱 COGS only
          </button>
        </div>

        {/* Expense groups */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2].map(g => (
              <div key={g}>
                <div className="mb-skeleton" style={{ height: 14, width: 100, marginBottom: 8, borderRadius: 6 }} />
                <div className="mb-card" style={{ overflow: 'hidden' }}>
                  {[1, 2].map(i => (
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
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mb-text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🌻</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--mb-text)', marginBottom: 6 }}>No expenses found</div>
            <div style={{ fontSize: 13 }}>
              {q ? 'Try a different search.' : 'Tap + to log your first expense.'}
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
                  const icon = CAT_ICONS[exp.category?.name ?? ''] ?? '•';
                  const bg = CAT_BG[exp.category?.name ?? ''] ?? '#F6F0EA';
                  return (
                    <div
                      key={exp.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px',
                        borderTop: i > 0 ? '1px solid var(--mb-border)' : 'none',
                        cursor: 'pointer',
                      }}
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
                          {exp.category?.name ?? 'Uncategorized'}
                          {exp.is_cogs && <span className="mb-badge-cogs">COGS</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mb-text)' }}>{fmt(exp.amount)}</div>
                        <ChevronRight size={14} color="var(--mb-text-soft)" style={{ marginTop: 2 }} />
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

      {/* Edit sheet */}
      {editId && (
        <ExpenseEditSheet
          expense={expenses.find(e => e.id === editId) ?? null}
          onClose={() => setEditId(null)}
          onSaved={() => { setEditId(null); loadExpenses(); }}
          onDeleted={() => { setEditId(null); loadExpenses(); }}
        />
      )}
    </AppShell>
  );
}
