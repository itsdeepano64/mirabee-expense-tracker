'use client';

import { useEffect } from 'react';
import { getAppTheme, setAppTheme } from '@/lib/actions/settings';
import {
  applyThemeToDocument,
  cacheThemeLocally,
  getCachedTheme,
  isThemeKey,
} from '@/lib/theme';

/** Pulls the saved theme from Supabase and keeps the local cache in sync. */
export function ThemeSync() {
  useEffect(() => {
    async function syncTheme() {
      const cached = getCachedTheme();
      const { theme: remote, error } = await getAppTheme();

      if (error) {
        if (cached && isThemeKey(cached)) {
          applyThemeToDocument(cached);
        }
        return;
      }

      if (remote !== 'default') {
        if (cached !== remote) {
          applyThemeToDocument(remote);
          cacheThemeLocally(remote);
        }
        return;
      }

      if (cached && isThemeKey(cached) && cached !== 'default') {
        applyThemeToDocument(cached);
        const result = await setAppTheme(cached);
        if (!result.error) return;
      }

      applyThemeToDocument('default');
    }

    syncTheme();
  }, []);

  return null;
}