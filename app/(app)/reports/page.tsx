'use client';

import { useState, useEffect } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { getCategoryBreakdown, getExpenses } from '@/lib/actions/expenses';
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
  'var(--mb-green)', 'var(--mb-blue)', '#8ABACB',
  'var(--mb-pink)', '#C5A882', 'var(--mb-green-dark)',
];

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
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
  // quarter
  const q = Math.floor(now.getMonth() / 3);
  return {
    startDate: iso(new Date(now.getFullYear(), q * 3, 1)),
    endDate:   iso(new Date(now.getFullYear(), q * 3 + 3, 0)),
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em',
  color: 'var(--mb-text-muted)', textTransform: 'uppercase', marginBottom: 6,
};

export default function ReportsPage() {
  const [range, setRange] = useState<RangeKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [summary, setSummary] = useState<{ total: number; cogs: number; count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const { startDate, endDate } = range === 'custom'
    ? { startDate: customStart, endDate: customEnd }
    : getRange(range);

  useEffect(() => {
    if (range === 'custom' && (!customStart || !customEnd)) return;
    setLoading(true);

    Promise.all([
      // getCategoryBreakdown takes TWO positional args: (startDate, endDate)
      getCategoryBreakdown(startDate, endDate),
      // getExpenses for summary totals
      getExpenses({ startDate, endDate }),
    ])
      .then(([b, exps]) => {
        setBreakdown(b);
        const total = exps.reduce((s, e) => s + e.amount, 0);
        const cogs  = exps.filter(e => e.is_cogs).reduce((s, e) => s + e.amount, 0);
        setSummary({ total, cogs, count: exps.length });
      })
      .catch(err => console.error('Reports load error:', err))
      .finally(() => setLoading(false));
  }, [range, customStart, customEnd, startDate, endDate]);

  const rangeLabel = range === 'custom' && customStart && customEnd
    ? `${customStart} – ${customEnd}`
    : range === 'week'   ? 'Last 7 days'
    : range === 'month'  ? new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : 'This quarter';

  const reportsHeader = (
    <header className="mb-app-header">
      <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em' }}>Reports</span>
      <button className="mb-hdr-btn" aria-label="Download report"><Download size={17} /></button>
    </header>
  );

  return (
    <AppShell header={reportsHeader}>
      <div style={{ padding: '16px var(--mb-page-x)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Range tabs */}
        <div className="mb-range-tabs">
          {RANGE_OPTIONS.map(({ label, key }) => (
            <button key={key} className="mb-range-tab" data-active={range === key} onClick={() => setRange(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {range === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={labelStyle}>From</div>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="mb-field" />
            </div>
            <div>
              <div style={labelStyle}>To</div>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="mb-field" />
            </div>
          </div>
        )}

        {/* Summary card */}
        <div className="mb-card-xl" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mb-text-muted)', fontWeight: 700, marginBottom: 5 }}>
            {rangeLabel}
          </div>
          {loading ? (
            <div className="mb-skeleton" style={{ height: 44, width: '55%', marginBottom: 14 }} />
          ) : (
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 14 }}>
              {fmt(summary?.total ?? 0)}
            </div>
          )}
          <div style={{ display: 'flex', borderTop: '1px solid var(--mb-border)', paddingTop: 14 }}>
            {[
              { label: 'COGS',      value: fmt(summary?.cogs ?? 0),                           color: 'var(--mb-green)'      },
              { label: 'Operating', value: fmt((summary?.total ?? 0) - (summary?.cogs ?? 0)), color: 'var(--mb-blue)'       },
              { label: 'Expenses',  value: String(summary?.count ?? 0),                       color: 'var(--mb-text-muted)' },
            ].map((seg, i) => (
              <div key={seg.label} style={{ flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--mb-border)' : 'none' }}>
                <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: seg.color, marginBottom: 3 }}>
                  {seg.label}
                </div>
                {loading
                  ? <div className="mb-skeleton" style={{ height: 17, width: 60, margin: '0 auto' }} />
                  : <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--mb-text)' }}>{seg.value}</div>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div>
          <div className="mb-section-hdr">
            <span className="mb-section-title">By category</span>
          </div>
          <div className="mb-card" style={{ padding: '14px 16px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div className="mb-skeleton" style={{ height: 13, width: 110 }} />
                      <div className="mb-skeleton" style={{ height: 13, width: 60 }} />
                    </div>
                    <div className="mb-skeleton" style={{ height: 8, width: '100%', borderRadius: 5 }} />
                  </div>
                ))}
              </div>
            ) : breakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--mb-text-muted)', fontSize: 14 }}>
                No data for this period.
              </div>
            ) : (
              breakdown.map((item, i) => (
                <div key={item.category_id} style={{ marginBottom: i < breakdown.length - 1 ? 14 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--mb-text)' }}>{item.category_name}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--mb-text)' }}>{fmt(item.total)}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--mb-text-muted)', marginLeft: 5 }}>{Math.round(item.percentage)}%</span>
                    </div>
                  </div>
                  <div className="mb-bar-track">
                    <div className="mb-bar-fill" style={{ width: `${item.percentage}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Export */}
        <div>
          <div className="mb-section-hdr"><span className="mb-section-title">Export</span></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <ExportPdfButton startDate={startDate} endDate={endDate} />
            <ExportCsvButton startDate={startDate} endDate={endDate} />
          </div>
        </div>

      </div>
    </AppShell>
  );
}

function ExportCsvButton({ startDate, endDate }: { startDate: string; endDate: string }) {
  async function handleCsv() {
    const exps = await getExpenses({ startDate, endDate });
    const rows = [
      ['Date', 'Description', 'Category', 'Amount', 'COGS', 'Notes'],
      ...exps.map(e => [
        e.date, e.description, e.category_name,
        e.amount.toFixed(2), e.is_cogs ? 'Yes' : 'No', e.notes ?? '',
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mirabee-expenses-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={handleCsv} className="mb-export-csv">
      <FileSpreadsheet size={16} /> CSV
    </button>
  );
}
