'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Leaf, Plus, Check } from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { MirabeeLogo } from '@/components/brand/mirabee-logo';
import { getCategories, createCategory } from '@/lib/actions/expenses';
import type { Category } from '@/lib/types';

/* ── Theme definitions ── */
const THEMES = [
  { key: 'default',  label: 'Warm Cream',      swatch: ['#6BA8BA', '#FDF8F3', '#E07A8C'] },
  { key: 'lavender', label: 'Lavender Dream',   swatch: ['#9B89C4', '#F9F7FD', '#E07A8C'] },
  { key: 'rose',     label: 'Rose Garden',      swatch: ['#D4849A', '#FEF8F9', '#8FAE8B'] },
  { key: 'sage',     label: 'Sage Garden',      swatch: ['#7FA882', '#F5FAF5', '#D4849A'] },
  { key: 'peach',    label: 'Peach Blossom',    swatch: ['#E8956A', '#FEF8F4', '#8FAE8B'] },
  { key: 'sky',      label: 'Sky Blue',         swatch: ['#5B9EC9', '#F4F9FD', '#E07A8C'] },
] as const;
type ThemeKey = typeof THEMES[number]['key'];

const CAT_ICONS: Record<string, string> = {
  'Flowers & Plants': '🌸', 'Wholesale Flowers': '🌷', 'Vases': '🏺',
  'Tape': '🪢', 'Supplies': '📦', 'Rent': '🏠', 'Utilities': '⚡',
  'Marketing': '📢', 'Payroll': '👥', 'Other': '•',
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--mb-text-muted)',
  textTransform: 'uppercase',
  marginBottom: 8,
  paddingLeft: 2,
};

export default function SettingsPage() {
  const router = useRouter();
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showAddCat, setShowAddCat]   = useState(false);
  const [newCatName, setNewCatName]   = useState('');
  const [newCatCogs, setNewCatCogs]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [theme, setTheme]             = useState<ThemeKey>('default');

  useEffect(() => {
    getCategories().then(setCategories).finally(() => setLoadingCats(false));
    const saved = localStorage.getItem('mirabee-theme') as ThemeKey | null;
    if (saved) setTheme(saved);
  }, []);

  function applyTheme(key: ThemeKey) {
    setTheme(key);
    localStorage.setItem('mirabee-theme', key);
    if (key === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', key);
    }
  }

  function handleSignOut() {
    if (typeof window !== 'undefined') localStorage.removeItem('mirabee-entry');
    router.replace('/');
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      await createCategory({ name: newCatName.trim(), is_cogs_default: newCatCogs });
      setCategories(await getCategories());
      setNewCatName('');
      setNewCatCogs(false);
      setShowAddCat(false);
    } catch (err) {
      console.error('Failed to add category:', err);
    } finally {
      setSaving(false);
    }
  }

  const settingsHeader = (
    <header className="mb-app-header">
      <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em' }}>
        Settings
      </span>
    </header>
  );

  return (
    <AppShell header={settingsHeader}>
      <div style={{ padding: '16px var(--mb-page-x)', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* ── Shop card ── */}
        <div className="mb-card-xl" style={{ padding: '20px 18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <MirabeeLogo size="md" showWordmark={false} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em' }}>
                Mirabee Flowers
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--mb-text-muted)', marginTop: 2 }}>
                Carlinville, IL
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--mb-border)', paddingTop: 13 }}>
            <p style={{ fontSize: 12.5, color: 'var(--mb-text-muted)', lineHeight: 1.55, margin: 0 }}>
              Built exclusively for{' '}
              <span style={{ fontWeight: 700, color: 'var(--mb-text)' }}>Jenni</span>
              {' '}at Mirabee Flowers by{' '}
              <span style={{ fontWeight: 700, color: 'var(--mb-blue)' }}>Deepen Patel</span>.
            </p>
          </div>
        </div>

        {/* ── Appearance ── */}
        <div>
          <div style={sectionLabel}>Appearance</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {THEMES.map(({ key, label, swatch }) => {
              const active = theme === key;
              return (
                <button
                  key={key}
                  onClick={() => applyTheme(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 13px',
                    borderRadius: 'var(--mb-r-md)',
                    border: `1.5px solid ${active ? 'var(--mb-blue)' : 'var(--mb-border)'}`,
                    background: active ? 'var(--mb-blue-xlight)' : 'var(--mb-card)',
                    cursor: 'pointer',
                    boxShadow: active ? 'none' : 'var(--mb-shadow-sm)',
                    textAlign: 'left',
                  }}
                >
                  {/* Swatch circles */}
                  <div style={{ display: 'flex', gap: -4, position: 'relative', flexShrink: 0 }}>
                    {swatch.map((color, i) => (
                      <div key={i} style={{
                        width: 14, height: 14, borderRadius: '50%',
                        background: color,
                        border: '1.5px solid rgba(255,255,255,0.8)',
                        marginLeft: i > 0 ? -5 : 0,
                        position: 'relative', zIndex: swatch.length - i,
                      }} />
                    ))}
                  </div>
                  <span style={{
                    flex: 1, fontSize: 12, fontWeight: active ? 700 : 600,
                    color: active ? 'var(--mb-blue-dark)' : 'var(--mb-text)',
                    lineHeight: 1.2,
                  }}>
                    {label}
                  </span>
                  {active && <Check size={13} color="var(--mb-blue)" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Categories ── */}
        <div>
          <div style={sectionLabel}>Categories</div>
          <div className="mb-card" style={{ overflow: 'hidden' }}>
            {loadingCats ? (
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className="mb-skeleton" style={{ width: 34, height: 34, borderRadius: 10 }} />
                    <div className="mb-skeleton" style={{ flex: 1, height: 13 }} />
                  </div>
                ))}
              </div>
            ) : (
              categories.map((cat, i) => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 16px',
                    borderBottom: i < categories.length - 1 ? '1px solid var(--mb-border)' : 'none',
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: cat.is_cogs_default ? 'var(--mb-green-light)' : 'var(--mb-blue-xlight)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {CAT_ICONS[cat.name] ?? '•'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--mb-text)' }}>
                      {cat.name}
                    </div>
                    {cat.is_cogs_default && (
                      <div style={{ fontSize: 10.5, color: 'var(--mb-green-dark)', fontWeight: 600, marginTop: 1 }}>
                        COGS default
                      </div>
                    )}
                  </div>
                  {cat.is_pinned && (
                    <span style={{
                      fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em',
                      background: 'var(--mb-blue-xlight)', color: 'var(--mb-blue-dark)',
                      padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase',
                    }}>
                      Pinned
                    </span>
                  )}
                </div>
              ))
            )}

            {/* Add category */}
            {!showAddCat ? (
              <button
                onClick={() => setShowAddCat(true)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 16px',
                  borderTop: categories.length > 0 ? '1px solid var(--mb-border)' : 'none',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--mb-blue)',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--mb-blue-xlight)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={15} color="var(--mb-blue)" />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Add category</span>
              </button>
            ) : (
              <div style={{ padding: '14px 16px', borderTop: categories.length > 0 ? '1px solid var(--mb-border)' : 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  autoFocus
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Category name"
                  className="mb-field"
                  style={{ fontSize: 14 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Leaf size={14} color="var(--mb-green)" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--mb-text)' }}>Default to COGS</span>
                  </div>
                  <button
                    onClick={() => setNewCatCogs(v => !v)}
                    className="mb-toggle"
                    data-checked={newCatCogs}
                    aria-checked={newCatCogs}
                    role="switch"
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setShowAddCat(false); setNewCatName(''); setNewCatCogs(false); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--mb-border)', background: 'var(--mb-bg)', fontSize: 13, fontWeight: 700, color: 'var(--mb-text-muted)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim() || saving}
                    style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: newCatName.trim() ? 'var(--mb-blue)' : 'var(--mb-border)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {saving ? 'Saving…' : <><Check size={13} /> Save</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sign out ── */}
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            width: '100%', padding: '14px',
            borderRadius: 'var(--mb-r-md)',
            border: '1.5px solid #F0C0CC',
            background: 'var(--mb-pink-light)',
            fontSize: 14.5, fontWeight: 700, color: '#993556',
            cursor: 'pointer', marginBottom: 8,
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>

      </div>
    </AppShell>
  );
}
