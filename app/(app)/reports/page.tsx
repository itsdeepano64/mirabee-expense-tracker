'use client';

import { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, LogOut, TrendingUp, Plus, Trash2, TrendingDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { AppShell } from '@/components/shell/app-shell';
import { getCategoryBreakdown, getExpenses } from '@/lib/actions/expenses';
import { getRevenue } from '@/lib/actions/invoices';
import { getInvestments, addInvestment, deleteInvestment } from '@/lib/actions/investments';
import type { Investment } from '@/lib/actions/investments';
import { clearEntrySession } from '@/lib/client/session';
import { ExportPdfButton } from '@/components/reports/export-pdf-button';
import type { CategoryBreakdown } from '@/lib/types';

/* ── Range options ── */
const RANGE_OPTIONS = [
  { label: 'Week',    key: 'week'    },
  { label: 'Month',   key: 'month'   },
  { label: 'Quarter', key: 'quarter' },
  { label: 'Custom',  key: 'custom'  },
] as const;
type RangeKey = typeof RANGE_OPTIONS[number]['key'];

const BAR_COLORS = [
  'var(--mb-green)', 'var(--mb-blue)', 'var(--mb-pink)',
  '#C5A882', '#8ABACB', 'var(--mb-green-dark)',
];

const CAT_ICONS: Record<string, string> = {
  'Flowers & Plants': '🌸', 'Wholesale Flowers': '🌷', 'Vases': '🏺',
  'Tape': '🪢', 'Supplies': '📦', 'Rent': '🏠', 'Utilities': '⚡',
  'Marketing': '📢', 'Payroll': '👥', 'Other': '•',
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function fmtExact(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function getRange(range: RangeKey): { startDate: string; endDate: string } {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().split('T')[0];
  if (range === 'week') {
    const s = new Date(now); s.setDate(now.getDate() - 6);
    return { startDate: iso(s), endDate: iso(now) };
  }
  if (range === 'month') {
    return {
      startDate: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate:   iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    };
  }
  const q = Math.floor(now.getMonth() / 3);
  return {
    startDate: iso(new Date(now.getFullYear(), q * 3, 1)),
    endDate:   iso(new Date(now.getFullYear(), q * 3 + 3, 0)),
  };
}

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function ReportsPage() {
  const router = useRouter();

  /* ── Range state ── */
  const [range,       setRange]       = useState<RangeKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');

  /* ── Data state ── */
  const [breakdown,    setBreakdown]    = useState<CategoryBreakdown[]>([]);
  const [summary,      setSummary]      = useState<{ total: number; cogs: number; operating: number; count: number } | null>(null);
  const [revenue,      setRevenue]      = useState(0);
  const [receivables,  setReceivables]  = useState(0);
  const [investments,  setInvestments]  = useState<Investment[]>([]);
  const [loading,      setLoading]      = useState(true);

  /* ── Add investment form state ── */
  const [addingInv, setAddingInv] = useState(false);
  const [invAmount, setInvAmount] = useState('');
  const [invDate,   setInvDate]   = useState(TODAY);
  const [invFrom,   setInvFrom]   = useState('');
  const [invNotes,  setInvNotes]  = useState('');
  const [invSaving, setInvSaving] = useState(false);

  const { startDate, endDate } = range === 'custom'
    ? { startDate: customStart, endDate: customEnd }
    : getRange(range);

  /* ── Load all data ── */
  useEffect(() => {
    if (range === 'custom' && (!customStart || !customEnd)) return;
    setLoading(true);

    Promise.all([
      getCategoryBreakdown(startDate, endDate),
      getExpenses({ startDate, endDate }),
      getRevenue(startDate, endDate),
      getInvestments(startDate, endDate),
    ])
      .then(([b, exps, rev, invs]) => {
        setBreakdown(b);
        const total     = exps.reduce((s, e) => s + e.amount, 0);
        const cogs      = exps.filter(e => e.is_cogs).reduce((s, e) => s + e.amount, 0);
        const operating = total - cogs;
        setSummary({ total, cogs, operating, count: exps.length });
        if (rev.ok)  { setRevenue(rev.revenue); setReceivables(rev.receivables); }
        if (invs.ok) { setInvestments(invs.investments); }
      })
      .catch(err => console.error('Reports load error:', err))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, customStart, customEnd, startDate, endDate]);

  /* ── Computed values ── */
  const expenses   = summary?.total ?? 0;
  const netProfit  = revenue - expenses;
  const profitable = netProfit >= 0;
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);
  const topCategory   = breakdown[0] ?? null;

  const rangeLabel = range === 'custom' && customStart && customEnd
    ? `${customStart} – ${customEnd}`
    : range === 'week'  ? 'Last 7 days'
    : range === 'month' ? new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
    : 'This Quarter';

  /* ── Add investment handler ── */
  async function handleAddInvestment() {
    const amt = parseFloat(invAmount);
    if (!amt || amt <= 0) return;
    setInvSaving(true);
    try {
      const { ok } = await addInvestment({
        amount:   amt,
        date:     invDate,
        fromName: invFrom.trim()  || undefined,
        notes:    invNotes.trim() || undefined,
      });
      if (ok) {
        const { investments: updated, ok: ok2 } = await getInvestments(startDate, endDate);
        if (ok2) setInvestments(updated);
        setAddingInv(false);
        setInvAmount('');
        setInvFrom('');
        setInvNotes('');
        setInvDate(TODAY);
      }
    } finally {
      setInvSaving(false);
    }
  }

  /* ── Delete investment handler ── */
  async function handleDeleteInvestment(id: string) {
    if (!window.confirm('Remove this investment entry?')) return;
    await deleteInvestment(id);
    setInvestments(prev => prev.filter(i => i.id !== id));
  }

  function handleSignOut() {
    clearEntrySession();
    router.replace('/');
  }

  const reportsHeader = (
    <header className="mb-app-header">
      <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em' }}>
        Reports
      </span>
      <button onClick={handleSignOut} className="mb-hdr-btn" aria-label="Sign out"
        style={{ color: 'var(--mb-pink)' }}>
        <LogOut size={17} />
      </button>
    </header>
  );

  return (
    <AppShell header={reportsHeader}>
      <div style={{ padding: '16px var(--mb-page-x)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Range tabs ── */}
        <div className="mb-range-tabs">
          {RANGE_OPTIONS.map(({ label, key }) => (
            <button key={key} className="mb-range-tab" data-active={range === key} onClick={() => setRange(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Custom date inputs ── */}
        {range === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'From', value: customStart, onChange: setCustomStart },
              { label: 'To',   value: customEnd,   onChange: setCustomEnd   },
            ].map(({ label, value, onChange }) => (
              <div key={label}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--mb-text-muted)', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                  {label}
                </div>
                <input type="date" value={value} onChange={e => onChange(e.target.value)} className="mb-field" />
              </div>
            ))}
          </div>
        )}

        {/* ── P&L Hero Card ── */}
        <div style={{
          background: profitable
            ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
            : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          borderRadius: 'var(--mb-r-xl)',
          padding: '22px 22px 20px',
          position: 'relative', overflow: 'hidden',
          boxShadow: profitable ? '0 6px 24px rgba(22,163,74,0.30)' : '0 6px 24px rgba(220,38,38,0.25)',
        }}>
          {/* Decorative blobs */}
          <div aria-hidden="true" style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', bottom: -40, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 4 }}>
              {rangeLabel} · Net Profit
            </div>
            {loading ? (
              <div style={{ height: 48, width: '55%', borderRadius: 10, background: 'rgba(255,255,255,0.15)', marginBottom: 18 }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                {profitable
                  ? <TrendingUp size={28} color="rgba(255,255,255,0.85)" />
                  : <TrendingDown size={28} color="rgba(255,255,255,0.85)" />}
                <span style={{ fontSize: 40, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {netProfit < 0 ? '-' : ''}{fmt(Math.abs(netProfit))}
                </span>
              </div>
            )}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 18 }}>
              {profitable ? 'Profitable period 🎉' : 'Expenses exceeded revenue'}
            </div>

            {/* Three stat tiles */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Revenue',   value: fmt(revenue),           bg: 'rgba(255,255,255,0.18)', color: '#C5E8C2' },
                { label: 'Expenses',  value: fmt(expenses),          bg: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' },
                { label: 'Invested',  value: fmt(totalInvested),     bg: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' },
              ].map(seg => (
                <div key={seg.label} style={{
                  flex: 1, background: seg.bg, borderRadius: 12, padding: '10px 10px 9px',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', color: seg.color, textTransform: 'uppercase', marginBottom: 4 }}>
                    {seg.label}
                  </div>
                  {loading
                    ? <div style={{ height: 16, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.15)' }} />
                    : <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{seg.value}</div>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Receivables chip ── */}
        {!loading && receivables > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--mb-card)', border: '1.5px solid var(--mb-blue-light)',
            borderRadius: 'var(--mb-r-md)', padding: '11px 14px',
            boxShadow: 'var(--mb-shadow-sm)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--mb-blue-xlight)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
            }}>💌</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--mb-blue)', textTransform: 'uppercase', marginBottom: 1 }}>
                Outstanding
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--mb-text)' }}>
                {fmtExact(receivables)} still owed to you
              </div>
            </div>
            <TrendingUp size={16} color="var(--mb-blue)" style={{ flexShrink: 0 }} />
          </div>
        )}

        {/* ── Investments into Mirabee ── */}
        <div>
          <div className="mb-section-hdr">
            <span className="mb-section-title">Investments into Mirabee</span>
            {!loading && totalInvested > 0 && (
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--mb-green-dark)' }}>
                {fmtExact(totalInvested)}
              </span>
            )}
          </div>

          <div className="mb-card" style={{ overflow: 'hidden' }}>
            {/* Investment rows */}
            {investments.length === 0 && !addingInv ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--mb-text-muted)', fontSize: 13 }}>
                No investments recorded this period.
              </div>
            ) : (
              investments.map((inv, idx) => (
                <div key={inv.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: idx < investments.length - 1 || addingInv ? '1px solid var(--mb-border)' : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mb-text)' }}>
                      {inv.fromName ?? 'Investment'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--mb-text-muted)', marginTop: 2 }}>
                      {format(parseISO(inv.date), 'MMM d, yyyy')}
                      {inv.notes && <> · {inv.notes}</>}
                    </div>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--mb-green-dark)', flexShrink: 0 }}>
                    +{fmtExact(inv.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteInvestment(inv.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--mb-text-soft)', flexShrink: 0 }}
                    aria-label="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}

            {/* Add investment form (inline) */}
            {addingInv && (
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--mb-green-light)', borderTop: investments.length > 0 ? '1px solid var(--mb-border)' : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mb-green-dark)' }}>New Investment</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--mb-text-muted)', display: 'block', marginBottom: 4 }}>Amount *</label>
                    <input className="mb-field" type="number" min="0" step="0.01" placeholder="0.00"
                      value={invAmount} onChange={e => setInvAmount(e.target.value)} style={{ fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--mb-text-muted)', display: 'block', marginBottom: 4 }}>Date</label>
                    <input className="mb-field" type="date" value={invDate} onChange={e => setInvDate(e.target.value)} style={{ fontSize: 13 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--mb-text-muted)', display: 'block', marginBottom: 4 }}>From (e.g. Mom, Savings)</label>
                  <input className="mb-field" placeholder="Who sent this money?" value={invFrom} onChange={e => setInvFrom(e.target.value)} style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--mb-text-muted)', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
                  <input className="mb-field" placeholder="Any additional details..." value={invNotes} onChange={e => setInvNotes(e.target.value)} style={{ fontSize: 13 }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={handleAddInvestment} disabled={invSaving || !invAmount}
                    style={{
                      flex: 1, padding: '11px 0', border: 'none', borderRadius: 10,
                      background: 'var(--mb-green)', color: 'white',
                      fontSize: 13, fontWeight: 700, cursor: invSaving || !invAmount ? 'default' : 'pointer',
                      opacity: invSaving || !invAmount ? 0.6 : 1,
                    }}>
                    {invSaving ? 'Saving…' : 'Save Investment'}
                  </button>
                  <button type="button" onClick={() => setAddingInv(false)}
                    style={{ padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--mb-border-strong)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--mb-text-muted)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add button */}
            {!addingInv && (
              <button type="button" onClick={() => setAddingInv(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', padding: '12px 16px', cursor: 'pointer',
                  background: 'transparent', border: 'none',
                  borderTop: investments.length > 0 ? '1px solid var(--mb-border)' : 'none',
                  fontSize: 13, fontWeight: 700, color: 'var(--mb-green-dark)',
                }}>
                <Plus size={15} /> Add Investment
              </button>
            )}
          </div>
        </div>

        {/* ── Top spend insight chip ── */}
        {!loading && topCategory && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--mb-card)', border: '1.5px solid var(--mb-border)',
            borderRadius: 'var(--mb-r-md)', padding: '11px 14px',
            boxShadow: 'var(--mb-shadow-sm)',
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--mb-green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
              {CAT_ICONS[topCategory.category_name] ?? '📊'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--mb-green-dark)', textTransform: 'uppercase', marginBottom: 1 }}>Top spend</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--mb-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topCategory.category_name}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--mb-text)' }}>{fmt(topCategory.total)}</div>
              <div style={{ fontSize: 11, color: 'var(--mb-text-muted)' }}>{Math.round(topCategory.percentage)}% of expenses</div>
            </div>
            <TrendingUp size={16} color="var(--mb-green)" style={{ flexShrink: 0 }} />
          </div>
        )}

        {/* ── By category ── */}
        <div>
          <div className="mb-section-hdr">
            <span className="mb-section-title">Expenses by category</span>
            {!loading && breakdown.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--mb-text-muted)', fontWeight: 600 }}>
                {breakdown.length} categories
              </span>
            )}
          </div>

          <div className="mb-card" style={{ padding: '6px 0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div className="mb-skeleton" style={{ height: 13, width: 120 }} />
                      <div className="mb-skeleton" style={{ height: 13, width: 70 }} />
                    </div>
                    <div className="mb-skeleton" style={{ height: 8, width: '100%', borderRadius: 5 }} />
                  </div>
                ))}
              </div>
            ) : breakdown.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🌻</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--mb-text)', marginBottom: 4 }}>No expenses yet</div>
                <div style={{ fontSize: 12, color: 'var(--mb-text-muted)' }}>Add expenses to see your breakdown.</div>
              </div>
            ) : (
              breakdown.map((item, i) => (
                <div key={item.category_id} style={{ padding: '12px 16px', borderBottom: i < breakdown.length - 1 ? '1px solid var(--mb-border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: i === 0 ? 'var(--mb-green-light)' : i === 1 ? 'var(--mb-blue-xlight)' : 'var(--mb-pink-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                    }}>
                      {CAT_ICONS[item.category_name] ?? '•'}
                    </div>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--mb-text)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.category_name}
                    </span>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--mb-text)' }}>{fmt(item.total)}</span>
                      <span style={{ fontSize: 11, color: 'var(--mb-text-muted)', marginLeft: 6 }}>{Math.round(item.percentage)}%</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'var(--mb-border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.percentage}%`, background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 4, transition: 'width 0.7s ease' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Expense detail breakdown ── */}
        {!loading && summary && summary.total > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'COGS',      value: fmtExact(summary.cogs),      sub: `${summary.total > 0 ? Math.round((summary.cogs / summary.total) * 100) : 0}% of expenses` },
              { label: 'Operating', value: fmtExact(summary.operating), sub: `${summary.total > 0 ? Math.round((summary.operating / summary.total) * 100) : 0}% of expenses` },
            ].map(seg => (
              <div key={seg.label} className="mb-card" style={{ flex: 1, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{seg.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--mb-text)' }}>{seg.value}</div>
                <div style={{ fontSize: 11, color: 'var(--mb-text-muted)', marginTop: 2 }}>{seg.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Export ── */}
        <div>
          <div className="mb-section-hdr">
            <span className="mb-section-title">Export</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <ExportPdfButton startDate={startDate} endDate={endDate} />
            <ExportCsvButton startDate={startDate} endDate={endDate} />
          </div>
        </div>

        {/* ── Sign out ── */}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'transparent', border: '1.5px solid var(--mb-border)', borderRadius: 'var(--mb-r-md)',
            padding: '13px', fontSize: 14, fontWeight: 700, color: 'var(--mb-text-muted)',
            width: '100%', cursor: 'pointer', marginBottom: 8,
          }}
        >
          <LogOut size={16} /> Sign out
        </button>

      </div>
    </AppShell>
  );
}

/* ── CSV export button ── */
function ExportCsvButton({ startDate, endDate }: { startDate: string; endDate: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCsv() {
    setLoading(true);
    try {
      const exps = await getExpenses({ startDate, endDate });
      const rows = [
        ['Date', 'Description', 'Category', 'Amount', 'COGS', 'Notes'],
        ...exps.map(e => [
          e.date, e.description, e.category_name,
          e.amount.toFixed(2), e.is_cogs ? 'Yes' : 'No', e.notes ?? '',
        ]),
      ];
      const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `mirabee-expenses-${startDate}-${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleCsv} disabled={loading} className="mb-export-csv" style={{ opacity: loading ? 0.7 : 1 }}>
      <FileSpreadsheet size={16} />
      {loading ? 'Exporting…' : 'CSV'}
    </button>
  );
}
