/**
 * i18n public surface.
 *
 * - Server: import { resolveLocale } from "@/lib/i18n/resolve-locale" (reads
 *   cookie + Accept-Language via next/headers — kept out of this barrel so it
 *   stays server-only). For plain locale-string translation on the server use
 *   { createTranslator } below.
 * - Client: import { useT, LocaleProvider } from "@/lib/i18n".
 */
export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";
export type { Locale } from "./config";
export { getDictionary, dictionaries } from "./dictionaries";
export type { Dictionary } from "./dictionaries";
export { LocaleProvider, useLocale } from "./provider";
export { useT } from "./use-t";
export { createTranslator } from "./translate";
export type { Translator, TranslationKey, TParams } from "./translate";
