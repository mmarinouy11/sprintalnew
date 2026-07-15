/** Locale configuration shared by server and client i18n code. */
export const LOCALES = ["en", "es", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie that persists the user's explicit locale choice. */
export const LOCALE_COOKIE = "sprintal_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
