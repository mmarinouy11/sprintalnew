/**
 * i18n public surface.
 *
 * - Server: import { resolveLocale } from "@/lib/i18n" (reads cookie + Accept-Language).
 * - Client: import { useT, LocaleProvider } from "@/lib/i18n".
 *
 * resolve-locale is intentionally NOT re-exported here because it is
 * `server-only`; import it directly from "@/lib/i18n/resolve-locale" in server
 * components to avoid pulling next/headers into client bundles.
 */
export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";
export type { Locale } from "./config";
export { getDictionary, dictionaries } from "./dictionaries";
export type { Dictionary } from "./dictionaries";
export { LocaleProvider, useLocale } from "./provider";
export { useT } from "./use-t";
export type { TranslationKey, TParams } from "./use-t";
