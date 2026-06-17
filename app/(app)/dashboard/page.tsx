'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, Leaf, Tag, Settings, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { MirabeeLogo } from '@/components/brand/mirabee-logo';
import { getDashboardStats } from '@/lib/actions/expenses';
import { useEffect, useState } from 'react';
import type { ExpenseWithCategory } from '@/lib/types';

/* ── Exact shape returned by getDashboardStats ── */
interface RealDashStats {
  total: number;
  cogsTotal: number;
  nonCogsTotal: number;
  expenseCount: number;
  topCategory: { name: string; total: number } | null;
  averageExpense: number;
  recent: ExpenseWithCategory[];
}

/* ── Category display helpers ── */
const CAT_STYLE: Record<string, { icon: string; bg: string }> = {
  'Flowers & Plants':  { icon: '🌸', bg: 'var(--mb-green-light)' },
  'Wholesale Flowers': { icon: '🌷', bg: 'var(--mb-green-light)' },
  'Supplies':          { icon: '📦', bg: 'var(--mb-blue-xlight)' },
  'Vases':             { icon: '🏺', bg: 'var(--mb-blue-xlight)' },
  'Tape':              { icon: '🪢', bg: 'var(--mb-blue-xlight)' },
  'Rent':              { icon: '🏠', bg: 'var(--mb-border)' },
  'Utilities':         { icon: '⚡', bg: 'var(--mb-blue-xlight)' },
  'Marketing':         { icon: '📢', bg: 'var(--mb-pink-light)' },
  'Payroll':           { icon: '👥', bg: 'var(--mb-green-light)' },
  'Other':             { icon: '•',  bg: 'var(--mb-border)' },
};

function getCatStyle(name: string | undefined | null) {
  return CAT_STYLE[name ?? ''] ?? { icon: '•', bg: 'var(--mb-border)' };
}

function fmt(n: number) {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

/* ── Page ── */
export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<RealDashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(s => setStats(s as RealDashStats))
      .catch(err => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const monthLabel = new Date().toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const dashHeader = (
    <header className="mb-app-header">
      <MirabeeLogo size="sm" showWordmark direction="row" />
      <button
        className="mb-hdr-btn"
        aria-label="Settings"
        onClick={() => router.push('/settings')}
      >
        <Settings size={17} />
      </button>
    </header>
  );

  return (
    <AppShell header={dashHeader}>
      <div style={{ padding: '16px var(--mb-page-x)', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Month label row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em' }}>
            {monthLabel}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--mb-blue)', background: 'var(--mb-blue-xlight)', padding: '3px 10px', borderRadius: 6 }}>
            This month
          </span>
        </div>

        {/* Spend hero card */}
        <div className="mb-spend-card">
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
            Total spend
          </div>
          {loading ? (
            <div className="mb-skeleton" style={{ height: 44, width: '60%', marginBottom: 12 }} />
          ) : (
            <div style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {fmt(stats?.total ?? 0)}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {[
              { label: 'COGS',     val: fmt(stats?.cogsTotal ?? 0)       },
              { label: 'Expenses', val: String(stats?.expenseCount ?? 0) },
              { label: 'Avg',      val: fmt(stats?.averageExpense ?? 0)  },
            ].map(({ label, val }) => (
              <div key={label} className="mb-spend-pill">
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard
            icon={<Leaf size={15} />}
            iconBg="var(--mb-green-light)"
            iconColor="var(--mb-green)"
            value={fmt(stats?.cogsTotal ?? 0)}
            label="Inventory (COGS)"
            sub={stats && stats.total > 0 ? `${Math.round((stats.cogsTotal / stats.total) * 100)}% of total` : undefined}
            loading={loading}
          />
          <StatCard
            icon={<Tag size={15} />}
            iconBg="var(--mb-pink-light)"
            iconColor="var(--mb-pink)"
            value={stats?.topCategory?.name ?? '—'}
            label="Top category"
            sub={stats?.topCategory ? fmt(stats.topCategory.total) : undefined}
            loading={loading}
          />
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Add expense', emoji: '➕', href: '/expenses/new', className: 'mb-quick-action mb-quick-action--add' },
            { label: 'View all',    emoji: '📋', href: '/expenses',     className: 'mb-quick-action' },
            { label: 'Reports',     emoji: '📊', href: '/reports',      className: 'mb-quick-action mb-quick-action--reports' },
          ].map(({ label, emoji, href, className }) => (
            <Link key={href} href={href} className={className}>
              <span className="mb-quick-action-emoji">{emoji}</span>
              <span className="mb-quick-action-label">{label}</span>
            </Link>
          ))}
        </div>

        {/* Recent expenses — comes directly from getDashboardStats().recent */}
        <div>
          <div className="mb-section-hdr">
            <span className="mb-section-title">Recent expenses</span>
            <Link href="/expenses" className="mb-section-link">See all</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="mb-skeleton" style={{ height: 62, borderRadius: 'var(--mb-r-lg)' }} />
              ))}
            </div>
          ) : (
            <div className="mb-card" style={{ overflow: 'hidden' }}>
              {(stats?.recent ?? []).length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: 'var(--mb-text-muted)', fontSize: 14 }}>
                  No expenses yet — tap + to add one.
                </div>
              ) : (
                (stats?.recent ?? []).map((exp, i) => {
                  const { icon, bg } = getCatStyle(exp.category_name);
                  return (
                    <div
                      key={exp.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px',
                        borderTop: i > 0 ? '1px solid var(--mb-border)' : 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/expenses?edit=${exp.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && router.push(`/expenses?edit=${exp.id}`)}
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
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--mb-text)' }}>
                          {fmt(exp.amount)}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--mb-text-soft)', marginTop: 2 }}>
                          {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
        style={{ position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom) + 12px)', right: 20, zIndex: 45 }}
      >
        <Plus size={26} color="#fff" strokeWidth={2.5} />
      </button>
    </AppShell>
  );
}

function StatCard({ icon, iconBg, iconColor, value, label, sub, loading }: {
  icon: React.ReactNode; iconBg: string; iconColor: string;
  value: string; label: string; sub?: string; loading?: boolean;
}) {
  return (
    <div className="mb-card" style={{ padding: '14px 14px 13px' }}>
      <div style={{ width: 34, height: 34, borderRadius: 11, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        {icon}
      </div>
      {loading ? (
        <div className="mb-skeleton" style={{ height: 22, width: '70%', marginBottom: 5 }} />
      ) : (
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>
          {value}
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--mb-text-muted)', fontWeight: 600 }}>{label}</div>
      {sub && !loading && (
        <div style={{ fontSize: 10.5, color: 'var(--mb-text-soft)', fontWeight: 500, marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}
