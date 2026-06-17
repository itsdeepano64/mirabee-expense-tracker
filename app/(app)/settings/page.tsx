'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Check } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/shell/app-shell';
import { MirabeeLogo } from '@/components/brand/mirabee-logo';
import { CategoryManager } from '@/components/settings/category-manager';
import { setAppTheme, getAppTheme } from '@/lib/actions/settings';
import { clearEntrySession } from '@/lib/client/session';
import {
  applyThemeToDocument,
  cacheThemeLocally,
  getCachedTheme,
  type ThemeKey,
} from '@/lib/theme';

/* ── Theme definitions ── */
const LIGHT_THEMES = [
  { key: 'default',  label: 'Warm Cream',     swatch: ['#4AACC4', '#FFF5EC', '#E8567A'] },
  { key: 'lavender', label: 'Lavender Dream', swatch: ['#7C62D8', '#F0EAFC', '#E06088'] },
  { key: 'rose',     label: 'Rose Garden',    swatch: ['#E05078', '#FDEEF4', '#48A870'] },
  { key: 'sage',     label: 'Sage Garden',    swatch: ['#48A860', '#E8F8EA', '#D86080'] },
  { key: 'peach',    label: 'Peach Blossom',  swatch: ['#F07840', '#FFF0E4', '#58A878'] },
  { key: 'sky',      label: 'Sky Blue',       swatch: ['#3898D8', '#E4F4FC', '#E86888'] },
] as const;

const DARK_THEMES = [
  { key: 'midnight-rose',  label: 'Midnight Rose',   swatch: ['#E8859A', '#1A1218', '#5CC878'] },
  { key: 'dark-forest',    label: 'Dark Forest',     swatch: ['#5CC87C', '#101814', '#E07A8C'] },
  { key: 'velvet-plum',    label: 'Velvet Plum',     swatch: ['#B888D8', '#130E1C', '#E07A8C'] },
  { key: 'slate-ocean',    label: 'Slate Ocean',     swatch: ['#4AAEE0', '#0C1620', '#8FAE8B'] },
  { key: 'charcoal-peach', label: 'Charcoal Peach',  swatch: ['#ECA070', '#1A1410', '#8FAE8B'] },
  { key: 'obsidian-gold',  label: 'Obsidian Gold',   swatch: ['#D4A840', '#111108', '#8FAE8B'] },
  { key: 'deep-navy',      label: 'Deep Navy',       swatch: ['#6EA0F0', '#0A1020', '#E07A8C'] },
  { key: 'mocha',          label: 'Mocha',           swatch: ['#D49060', '#181208', '#8FAE8B'] },
  { key: 'dark-lavender',  label: 'Dark Lavender',   swatch: ['#A882E0', '#100C1C', '#E07A8C'] },
  { key: 'noir-blush',     label: 'Noir Blush',      swatch: ['#D890A8', '#120C10', '#8FAE8B'] },
  { key: 'dark-sage',      label: 'Dark Sage',       swatch: ['#70C488', '#0C1410', '#E07A8C'] },
  { key: 'twilight',       label: 'Twilight',        swatch: ['#8C88E8', '#0C0E1E', '#E07A8C'] },
] as const;

const ALL_THEMES = [...LIGHT_THEMES, ...DARK_THEMES];

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
  const [theme, setTheme] = useState<ThemeKey>('default');

  useEffect(() => {
    const cached = getCachedTheme() as ThemeKey | null;
    if (cached) {
      setTheme(cached);
      return;
    }

    getAppTheme()
      .then(({ theme: saved, error }) => {
        setTheme(saved);
        if (!error) {
          applyThemeToDocument(saved);
          cacheThemeLocally(saved);
        } else if (cached) {
          applyThemeToDocument(cached);
        }
      })
      .catch(() => setTheme('default'));
  }, []);

  async function applyTheme(key: string) {
    const themeKey = key as ThemeKey;
    setTheme(themeKey);
    applyThemeToDocument(themeKey);
    cacheThemeLocally(themeKey);

    const result = await setAppTheme(themeKey);
    if (result.error) {
      toast.warning(result.error);
    }
  }

  function handleSignOut() {
    clearEntrySession();
    router.replace('/');
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

          {/* Light themes */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--mb-text-soft)', marginBottom: 8, paddingLeft: 2, letterSpacing: '0.03em' }}>
            ☀️ Light
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {LIGHT_THEMES.map(({ key, label, swatch }) => (
              <ThemeButton key={key} themeKey={key} label={label} swatch={swatch} active={theme === key} onSelect={applyTheme} dark={false} />
            ))}
          </div>

          {/* Dark themes */}
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--mb-text-soft)', marginBottom: 8, paddingLeft: 2, letterSpacing: '0.03em' }}>
            🌙 Dark
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DARK_THEMES.map(({ key, label, swatch }) => (
              <ThemeButton key={key} themeKey={key} label={label} swatch={swatch} active={theme === key} onSelect={applyTheme} dark={true} />
            ))}
          </div>
        </div>

        <CategoryManager />

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

/* ── Reusable theme picker button ── */
function ThemeButton({
  themeKey, label, swatch, active, onSelect, dark,
}: {
  themeKey: string;
  label: string;
  swatch: readonly string[];
  active: boolean;
  onSelect: (k: string) => void; // eslint-disable-line
  dark: boolean;
}) {
  const cardBg   = dark ? swatch[1] : (active ? 'var(--mb-blue-xlight)' : 'var(--mb-card)');
  const border   = active ? 'var(--mb-blue)' : (dark ? 'transparent' : 'var(--mb-border)');
  const textColor = dark ? '#E8E0F0' : (active ? 'var(--mb-blue-dark)' : 'var(--mb-text)');

  return (
    <button
      onClick={() => onSelect(themeKey)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '10px 12px',
        borderRadius: 'var(--mb-r-md)',
        border: `1.5px solid ${border}`,
        background: cardBg,
        cursor: 'pointer',
        boxShadow: active ? `0 0 0 2px var(--mb-blue)` : 'var(--mb-shadow-sm)',
        textAlign: 'left',
        outline: 'none',
      }}
    >
      {/* Swatch dots */}
      <div style={{ display: 'flex', flexShrink: 0 }}>
        {swatch.map((color, i) => (
          <div key={i} style={{
            width: 13, height: 13, borderRadius: '50%',
            background: color,
            border: '1.5px solid rgba(255,255,255,0.6)',
            marginLeft: i > 0 ? -4 : 0,
            position: 'relative', zIndex: swatch.length - i,
          }} />
        ))}
      </div>
      <span style={{ flex: 1, fontSize: 11.5, fontWeight: active ? 700 : 600, color: textColor, lineHeight: 1.2 }}>
        {label}
      </span>
      {active && (
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--mb-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Check size={10} color="#fff" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}
