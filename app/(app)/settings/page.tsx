'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut, ChevronRight, Tag, Store, Info,
  Leaf, Plus, Check,
} from 'lucide-react';
import { AppShell } from '@/components/shell/app-shell';
import { MirabeeLogo } from '@/components/brand/mirabee-logo';
import { getCategories, createCategory } from '@/lib/actions/expenses';
import type { Category } from '@/lib/types';

/* ── Helpers ── */
const CAT_ICONS: Record<string, string> = {
  'Flowers & Plants': '🌸', 'Wholesale Flowers': '🌷', 'Vases': '🏺',
  'Tape': '🪢', 'Supplies': '📦', 'Rent': '🏠', 'Utilities': '⚡',
  'Marketing': '📢', 'Payroll': '👥', 'Other': '•',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--mb-text-muted)',
  textTransform: 'uppercase',
  marginBottom: 8,
  paddingLeft: 4,
};

export default function SettingsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCogs, setNewCatCogs] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoadingCats(false));
  }, []);

  function handleSignOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mirabee-entry');
    }
    router.replace('/');
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      await createCategory({ name: newCatName.trim(), is_cogs_default: newCatCogs });
      const updated = await getCategories();
      setCategories(updated);
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

        {/* ── Shop identity card ── */}
        <div className="mb-card-xl" style={{ padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <MirabeeLogo size="md" showWordmark={false} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--mb-text)', letterSpacing: '-0.02em' }}>
                Mirabee Flowers
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--mb-text-muted)', marginTop: 2 }}>
                Carlinville, IL
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, background: 'var(--mb-green-light)', borderRadius: 6, padding: '2px 8px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--mb-green-dark)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Categories ── */}
        <div>
          <div style={labelStyle}>Categories</div>
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

            {/* Add category row */}
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
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'var(--mb-blue-xlight)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Plus size={15} color="var(--mb-blue)" />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Add category</span>
              </button>
            ) : (
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--mb-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  autoFocus
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Category name"
                  className="mb-field"
                  style={{ fontSize: 14 }}
                />
                {/* COGS toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Leaf size={14} color="var(--mb-green)" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--mb-text)' }}>
                      Default to COGS
                    </span>
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
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: '1.5px solid var(--mb-border)',
                      background: 'var(--mb-bg)', fontSize: 13, fontWeight: 700,
                      color: 'var(--mb-text-muted)', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCatName.trim() || saving}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                      background: newCatName.trim() ? 'var(--mb-blue)' : 'var(--mb-border)',
                      fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                      opacity: saving ? 0.7 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    {saving ? 'Saving…' : <><Check size={13} /> Save</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── App info ── */}
        <div>
          <div style={labelStyle}>App</div>
          <div className="mb-card" style={{ overflow: 'hidden' }}>
            {[
              { icon: <Tag size={15} />, label: 'Version', value: '1.0.0', bg: 'var(--mb-blue-xlight)', color: 'var(--mb-blue)' },
              { icon: <Store size={15} />, label: 'Business', value: 'Mirabee Flowers', bg: '#F6F0EA', color: 'var(--mb-text-muted)' },
              { icon: <Info size={15} />, label: 'Built for', value: 'Jenni 💐', bg: 'var(--mb-pink-light)', color: 'var(--mb-pink)' },
            ].map(({ icon, label, value, bg, color }, i, arr) => (
              <div
                key={label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--mb-border)' : 'none',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {icon}
                </div>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--mb-text)' }}>{label}</span>
                <span style={{ fontSize: 13, color: 'var(--mb-text-muted)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
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
            cursor: 'pointer',
            marginBottom: 8,
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>

      </div>
    </AppShell>
  );
}
