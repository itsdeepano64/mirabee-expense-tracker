'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Receipt, Leaf, PieChart, Search } from 'lucide-react';

const FEATURES = [
  {
    icon: Receipt,
    bg: 'var(--mb-blue-xlight)',
    color: 'var(--mb-blue)',
    title: 'Log expenses',
    sub: 'Fast entry with receipt photos',
  },
  {
    icon: Leaf,
    bg: 'var(--mb-green-light)',
    color: 'var(--mb-green)',
    title: 'Track COGS',
    sub: 'Inventory & cost of goods',
  },
  {
    icon: PieChart,
    bg: 'var(--mb-pink-light)',
    color: 'var(--mb-pink)',
    title: 'Reports',
    sub: 'PDF & CSV export',
  },
  {
    icon: Search,
    bg: '#F6F0EA',
    color: 'var(--mb-text-muted)',
    title: 'Filter & search',
    sub: 'Find any expense fast',
  },
];

export default function LandingPage() {
  const router = useRouter();

  function handleEnter() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mirabee-entry', 'jenni');
    }
    router.push('/dashboard');
  }

  return (
    <div
      className="mb-page"
      style={{ background: 'var(--mb-bg)', overflowY: 'auto' }}
    >
      {/* ── Hero ── */}
      <div
        style={{
          background: 'var(--mb-card)',
          padding: '40px 28px 32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--mb-border)',
        }}
      >
        {/* Decorative blobs */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: -50, left: -40,
          width: 160, height: 160, borderRadius: '50%',
          background: 'var(--mb-blue-xlight)', opacity: 0.7,
          pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: -60, right: -30,
          width: 130, height: 130, borderRadius: '50%',
          background: 'var(--mb-pink-light)', opacity: 0.8,
          pointerEvents: 'none',
        }} />

        {/* Actual logo image */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 20 }}>
          <div style={{
            width: 104,
            height: 104,
            borderRadius: 28,
            overflow: 'hidden',
            margin: '0 auto',
            border: '2px solid var(--mb-blue-light)',
            background: '#fff',
            boxShadow: 'var(--mb-shadow-md)',
          }}>
            <Image
              src="/mirabee-flowers-logo.png"
              alt="Mirabee Flowers"
              width={104}
              height={104}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              unoptimized
              priority
            />
          </div>
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--mb-text)',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            position: 'relative',
            zIndex: 1,
            margin: 0,
          }}
        >
          Mirabee Flowers
        </h1>
        <p
          style={{
            fontSize: 14,
            color: 'var(--mb-text-muted)',
            marginTop: 8,
            lineHeight: 1.55,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Track shop expenses, receipts &amp; inventory<br />— all in one place.
        </p>

        {/* Divider */}
        <div style={{
          width: 36, height: 3, background: 'var(--mb-border)',
          borderRadius: 2, margin: '24px auto 22px',
          position: 'relative', zIndex: 1,
        }} />

        {/* Jenni button */}
        <button
          onClick={handleEnter}
          className="mb-btn-jenni"
          style={{ position: 'relative', zIndex: 1 }}
        >
          Jenni 💐 &nbsp;Enter app
        </button>
        <p style={{
          fontSize: 11,
          color: 'var(--mb-text-soft)',
          marginTop: 10,
          position: 'relative',
          zIndex: 1,
        }}>
          Your personal expense tracker
        </p>
      </div>

      {/* ── Feature cards ── */}
      <div style={{ padding: '20px var(--mb-page-x)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}
        >
          {FEATURES.map(({ icon: Icon, bg, color, title, sub }) => (
            <div
              key={title}
              className="mb-card"
              style={{ padding: '14px 12px', textAlign: 'center' }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 9px',
              }}>
                <Icon size={16} color={color} strokeWidth={2} />
              </div>
              <div style={{
                fontSize: 12.5, fontWeight: 700,
                color: 'var(--mb-text)', marginBottom: 3,
              }}>
                {title}
              </div>
              <div style={{
                fontSize: 11, color: 'var(--mb-text-muted)', lineHeight: 1.35,
              }}>
                {sub}
              </div>
            </div>
          ))}
        </div>

        <p style={{
          textAlign: 'center', fontSize: 11,
          color: 'var(--mb-text-soft)', marginTop: 24, marginBottom: 8,
        }}>
          Mirabee Flowers · Carlinville, IL
        </p>
      </div>
    </div>
  );
}
