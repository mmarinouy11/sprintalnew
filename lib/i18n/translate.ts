import { getDictionary, type Dictionary } from "./dictionaries";
import { DEFAULT_LOCALE, type Locale } from "./config";

/**
 * Framework-free translation core (no React, no next/headers) so the SAME
 * resolver powers both the client `useT()` hook and server-side code (API
 * routes translating error codes into locale-specific messages, per spec 4.1).
 */

/** Dot-separated key paths into the (nested) dictionary, e.g. "auth.login.title". */
export type PathsOf<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : PathsOf<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = PathsOf<Dictionary>;

/** Optional named interpolation values, e.g. t("greeting", { name }). */
export type TParams = Record<string, string | number>;

export function resolvePath(dict: Dictionary, path: string): string | undefined {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict) as string | undefined;
}

export function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/** A bound translation function for a single locale. */
export type Translator = (key: TranslationKey, params?: TParams) => string;

/**
 * Build a translator for a locale. Falls back to the raw key (and, in dev,
 * warns) when a key is missing so nothing renders blank in production.
 * Usable anywhere — server or client.
 */
export function createTranslator(locale: Locale): Translator {
  const dict = getDictionary(locale) ?? getDictionary(DEFAULT_LOCALE);
  return (key, params) => {
    const value = resolvePath(dict, key);
    if (typeof value !== "string") {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] missing key "${key}" for locale "${locale}"`);
      }
      return key;
    }
    return interpolate(value, params);
  };
}
