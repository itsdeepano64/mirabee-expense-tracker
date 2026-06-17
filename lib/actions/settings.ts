"use server";

import { createServerClient } from "@/lib/supabase/server";
import { isThemeKey, type ThemeKey } from "@/lib/theme";

const THEME_SETTING_KEY = "theme";

const THEME_SYNC_SETUP_MESSAGE =
  "Theme sync is setting up — your choice is saved on this device for now.";

function friendlySettingsError(message: string): string {
  if (
    message.includes("app_settings") ||
    message.includes("schema cache") ||
    message.includes("relation") ||
    message.includes("does not exist")
  ) {
    return THEME_SYNC_SETUP_MESSAGE;
  }
  return message;
}

export async function getAppTheme(): Promise<{
  theme: ThemeKey;
  error?: string;
}> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", THEME_SETTING_KEY)
    .maybeSingle();

  if (error) {
    return { theme: "default", error: friendlySettingsError(error.message) };
  }

  const value = data?.value ?? "default";
  const theme = isThemeKey(value) ? value : "default";
  return { theme };
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

  if (error) {
    return { error: friendlySettingsError(error.message) };
  }
  return { success: true, theme: theme as ThemeKey };
}