export const THEME_STORAGE_KEY = 'mirabee-theme';

export const THEME_KEYS = [
  'default',
  'lavender',
  'rose',
  'sage',
  'peach',
  'sky',
  'midnight-rose',
  'dark-forest',
  'velvet-plum',
  'slate-ocean',
  'charcoal-peach',
  'obsidian-gold',
  'deep-navy',
  'mocha',
  'dark-lavender',
  'noir-blush',
  'dark-sage',
  'twilight',
] as const;

export type ThemeKey = (typeof THEME_KEYS)[number];

export function isThemeKey(value: string): value is ThemeKey {
  return (THEME_KEYS as readonly string[]).includes(value);
}

export function applyThemeToDocument(key: string) {
  if (typeof document === 'undefined') return;
  if (key === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', key);
  }
}

export function cacheThemeLocally(key: string) {
  if (typeof window === 'undefined') return;
  if (key === 'default') {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    localStorage.setItem(THEME_STORAGE_KEY, key);
  }
}

export function getCachedTheme(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(THEME_STORAGE_KEY);
}