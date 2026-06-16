'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, Leaf, Tag, Bell, Settings } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { MirabeeLogo } from '@/components/brand/mirabee-logo';
import { getDashboardStats, getExpenses } from '@/lib/actions/expenses';
import { useEffect, useState } from 'react';

/* ── Local display type — field names resolved at runtime ── */
interface DashDisplay {
  totalSpent: number;
  cogsTotal: number;
  expenseCount: number;
  topCategory: string | null;
  avgExpense: number;
  vsLastMonth?: number;
}

interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  is_cogs: boolean;
  date: string;
  categories?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
}

/* ── Helpers ── */
const CAT_STYLE: Record<string, { icon: string; bg: string }> = {
  'Flowers & Plants':  { icon: '🌸', bg: 'var(--mb-green-light)' },
  'Wholesale Flowers': { icon: '🌷', bg: 'var(--mb-green-light)' },
  'Supplies':          { icon: '📦', bg: 'var(--mb-blue-xlight)' },
  'Vases':             { icon: '🏺', bg: 'var(--mb-blue-xlight)' },
  'Tape':              { icon: '🪢', bg: 'var(--mb-blue-xlight)' },
  'Rent':              { icon: '🏠', bg: '#F6F0EA' },
  'Utilities':         { icon: '⚡', bg: '#FEF9E7' },
  'Marketing':         { icon: '📢', bg: 'var(--mb-pink-light)' },
  'Payroll':           { icon: '👥', bg: 'var(--mb-green-light)' },
  'Other':             { icon: '•',  bg: '#F6F0EA' },
};

function getCatName(exp: ExpenseRow): string | null {
  return exp.categories?.name ?? exp.category?.name ?? null;
}

function getCatStyle(name: string | null) {
  return CAT_STYLE[name ?? ''] ?? { icon: '•', bg: '#F6F0EA' };
}

function fmt(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

/**
 * Normalise the raw getDashboardStats return into our display shape.
 * getDashboardStats returns: DashboardStats & { recent: ExpenseWithCategory[] }
 * We read every plausible field name to be resilient against naming differences.
 */
function normaliseStats(raw: unknown): DashDisplay {
  const r = raw as Record<string, unknown>;
  const n = (key: string) =>
    typeof r[key] === 'number' ? (r[key] as number) : 0;

  return {
    // Try every plausible field name for total spend
    totalSpent:
      n('totalSpent') ||
      n('totalMonthSpent') ||
      n('monthTotal') ||
      n('total') ||
      n('totalAmount'),

    cogsTotal:
      n('cogsTotal') ||
      n('totalCogs') ||
      n('cogsTotalAmount') ||
      n('cogs'),

    expenseCount:
      n('expenseCount') ||
      n('count') ||
      n('totalCount') ||
      n('expensesCount'),

    topCategory:
      typeof r['topCategory'] === 'string'
        ? (r['topCategory'] as string)
        : null,

    avgExpense:
      n('avgExpense') ||
      n('averageExpense') ||
      n('avgAmount') ||
      n('average'),

    vsLastMonth:
      typeof r['vsLastMonth'] === 'number'
        ? (r['vsLastMonth'] as number)
        : undefined,
  };
}

/* ── Page ── */
export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashDisplay | null>(null);
  const [recent, setRecent] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0];

        const [rawStats, exps] = await Promise.all([
          getDashboardStats(),
          getExpenses({ startDate, endDate }),
        ]);

        setStats(normaliseStats(rawStats as unknown));
        setRecent((exps as unknown as ExpenseRow[]).slice(0, 5));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const monthLabel = new Date().toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const dashHeader = (
    <header className="mb-app-header">
      <MirabeeLogo size="sm" showWordmark direction="row" />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="mb-hdr-btn" aria-label="Notifications">
          <Bell size={17} />
        </button>
        <button
          className="mb-hdr-btn"
          aria-label="Settings"
          onClick={() => router.push('/settings')}
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );

  return (
    <AppShell header={dashHeader}>
      <div
        style={{
          padding: '16px var(--mb-page-x)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Month label row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: 'var(--mb-text)',
              letterSpacing: '-0.02em',
            }}
          >
            {monthLabel}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--mb-blue)',
              background: 'var(--mb-blue-xlight)',
              padding: '3px 10px',
              borderRadius: 6,
            }}
          >
            This month
          </span>
        </div>

        {/* ── Spend hero card ── */}
        <div className="mb-spend-card">
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.75)',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Total spend
          </div>

          {loading ? (
            <div
              className="mb-skeleton"
              style={{ height: 44, width: '60%', marginBottom: 12 }}
            />
          ) : (
            <div
              style={{
                fontSize: 38,
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {fmt(stats?.totalSpent ?? 0)}
            </div>
          )}

          {stats && typeof stats.vsLastMonth === 'number' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 20,
                padding: '4px 11px',
                marginTop: 10,
                fontSize: 11.5,
                color: 'rgba(255,255,255,0.92)',
                fontWeight: 600,
              }}
            >
              <TrendingUp size={12} />
              {stats.vsLastMonth >= 0
                ? `Up ${stats.vsLastMonth}% from last month`
                : `Down ${Math.abs(stats.vsLastMonth)}% from last month`}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {[
              { label: 'COGS',     val: fmt(stats?.cogsTotal ?? 0)       },
              { label: 'Expenses', val: String(stats?.expenseCount ?? 0) },
              { label: 'Avg',      val: fmt(stats?.avgExpense ?? 0)      },
            ].map(({ label, val }) => (
              <div key={label} className="mb-spend-pill">
                <div
                  style={{
                    fontSize: 9.5,
                    color: 'rgba(255,255,255,0.65)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    marginBottom: 3,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <StatCard
            icon={<Leaf size={15} />}
            iconBg="var(--mb-green-light)"
            iconColor="var(--mb-green)"
            value={fmt(stats?.cogsTotal ?? 0)}
            label="Inventory (COGS)"
            loading={loading}
          />
          <StatCard
            icon={<Tag size={15} />}
            iconBg="var(--mb-pink-light)"
            iconColor="var(--mb-pink)"
            value={stats?.topCategory ?? '—'}
            label="Top category"
            loading={loading}
          />
        </div>

        {/* ── Recent expenses ── */}
        <div>
          <div className="mb-section-hdr">
            <span className="mb-section-title">Recent expenses</span>
            <Link href="/expenses" className="mb-section-link">
              See all
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="mb-skeleton"
                  style={{ height: 62, borderRadius: 'var(--mb-r-lg)' }}
                />
              ))}
            </div>
          ) : (
            <div className="mb-card" style={{ overflow: 'hidden' }}>
              {recent.length === 0 ? (
                <div
                  style={{
                    padding: '28px',
                    textAlign: 'center',
                    color: 'var(--mb-text-muted)',
                    fontSize: 14,
                  }}
                >
                  No expenses yet — tap + to add one.
                </div>
              ) : (
                recent.map((exp, i) => {
                  const name = getCatName(exp);
                  const { icon, bg } = getCatStyle(name);
                  return (
                    <div
                      key={exp.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        borderTop:
                          i > 0 ? '1px solid var(--mb-border)' : 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() =>
                        router.push(`/expenses?edit=${exp.id}`)
                      }
                      role="button"
                      tabIndex={0}
                      onKeyDown={e =>
                        e.key === 'Enter' &&
                        router.push(`/expenses?edit=${exp.id}`)
                      }
                    >
                      <div
                        className="mb-exp-icon"
                        style={{ background: bg }}
                      >
                        <span style={{ fontSize: 19 }}>{icon}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: 'var(--mb-text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {exp.description}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--mb-text-muted)',
                            marginTop: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          {name ?? 'Uncategorized'}
                          {exp.is_cogs && (
                            <span className="mb-badge-cogs">COGS</span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--mb-text)',
                          }}
                        >
                          {fmt(exp.amount)}
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            color: 'var(--mb-text-soft)',
                            marginTop: 2,
                          }}
                        >
                          {new Date(exp.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        className="mb-fab"
        aria-label="Add expense"
        onClick={() => router.push('/expenses/new')}
        style={{
          position: 'fixed',
          bottom: 'calc(72px + env(safe-area-inset-bottom) + 12px)',
          right: 20,
          zIndex: 45,
        }}
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </button>
    </AppShell>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  loading,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  loading?: boolean;
}) {
  return (
    <div className="mb-card" style={{ padding: '13px 14px' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: iconBg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 9,
        }}
      >
        {icon}
      </div>
      {loading ? (
        <div
          className="mb-skeleton"
          style={{ height: 22, width: '70%', marginBottom: 5 }}
        />
      ) : (
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--mb-text)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {value}
        </div>
      )}
      <div
        style={{
          fontSize: 10.5,
          color: 'var(--mb-text-muted)',
          fontWeight: 500,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}
