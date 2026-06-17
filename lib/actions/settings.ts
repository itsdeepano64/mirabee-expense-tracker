"use server";

import { createServerClient } from "@/lib/supabase/server";
import { isThemeKey, type ThemeKey } from "@/lib/theme";

const THEME_SETTING_KEY = "theme";

export async function getAppTheme(): Promise<ThemeKey> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", THEME_SETTING_KEY)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const value = data?.value ?? "default";
  return isThemeKey(value) ? value : "default";
}

export async function setAppTheme(theme: string) {
  if (!isThemeKey(theme)) {
    return { error: "Invalid theme" };
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: THEME_SETTING_KEY,
      value: theme,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) return { error: error.message };
  return { success: true, theme: theme as ThemeKey };
}