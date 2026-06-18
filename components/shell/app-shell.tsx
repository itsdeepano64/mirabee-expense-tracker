'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, PieChart, Settings, FileText } from 'lucide-react';
import { MirabeeLogo } from '@/components/brand/mirabee-logo';
import { InvoiceNotifications } from '@/components/notifications/invoice-notifications';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home',     Icon: Home     },
  { href: '/expenses',  label: 'Expenses', Icon: Receipt  },
  { href: '/invoices',  label: 'Invoices', Icon: FileText },
  { href: '/reports',   label: 'Reports',  Icon: PieChart },
  { href: '/settings',  label: 'Settings', Icon: Settings },
];

interface AppShellProps {
  children: React.ReactNode;
  /** Override the default header (e.g. for back-button pages) */
  header?: React.ReactNode;
  /** Hide the default logo header (for pages with custom headers) */
  hideHeader?: boolean;
}

export function AppShell({ children, header, hideHeader }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="mb-page">
      {/* ── Header ── */}
      {!hideHeader && (
        header ?? <DefaultHeader />
      )}

      {/* ── Scrollable content ── */}
      <main
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </main>

      {/* ── Bottom nav ── */}
      <nav className="mb-bottom-nav">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className="mb-nav-item"
              data-active={active}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span>{label}</span>
              {active && <span className="mb-nav-dot" aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function DefaultHeader() {
  return (
    <header className="mb-app-header">
      <MirabeeLogo size="sm" showWordmark direction="row" />
      <div style={{ display: 'flex', gap: 8 }}>
        <InvoiceNotifications />
        <Link href="/settings">
          <button className="mb-hdr-btn" aria-label="Settings">
            <Settings size={17} />
          </button>
        </Link>
      </div>
    </header>
  );
}
