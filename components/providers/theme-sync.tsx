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
      try {
        const remote = await getAppTheme();
        const cached = getCachedTheme();

        if (remote !== 'default') {
          if (cached !== remote) {
            applyThemeToDocument(remote);
            cacheThemeLocally(remote);
          }
          return;
        }

        if (cached && isThemeKey(cached) && cached !== 'default') {
          applyThemeToDocument(cached);
          await setAppTheme(cached);
          return;
        }

        applyThemeToDocument('default');
      } catch {
        const cached = getCachedTheme();
        if (cached && isThemeKey(cached)) {
          applyThemeToDocument(cached);
        }
      }
    }

    syncTheme();
  }, []);

  return null;
}