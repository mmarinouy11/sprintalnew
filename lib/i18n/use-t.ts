"use client";

import { useCallback, useMemo } from "react";
import { getDictionary, type Dictionary } from "./dictionaries";
import { useLocale } from "./provider";

/**
 * Dot-separated key paths into the (nested) dictionary, e.g. "nav.portfolio".
 * Typed so a mistyped key is a compile error rather than a runtime miss.
 */
type PathsOf<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : PathsOf<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = PathsOf<Dictionary>;

/** Optional named interpolation values, e.g. t("greeting", { name }). */
export type TParams = Record<string, string | number>;

function resolvePath(dict: Dictionary, path: string): string | undefined {
  return path
    .split(".")
    .reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, dict) as string | undefined;
}

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/**
 * Client translation hook (rule #6). Reads the locale from <LocaleProvider>
 * (which the server seeds via resolveLocale()) and returns a `t()` function.
 *
 *   const t = useT();
 *   t("nav.portfolio");
 *
 * Falls back to the raw key if a translation is missing so nothing renders
 * blank in production.
 */
export function useT() {
  const locale = useLocale();
  const dict = useMemo(() => getDictionary(locale), [locale]);

  const t = useCallback(
    (key: TranslationKey, params?: TParams): string => {
      const value = resolvePath(dict, key);
      if (typeof value !== "string") {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.warn(`[i18n] missing key "${key}" for locale "${locale}"`);
        }
        return key;
      }
      return interpolate(value, params);
    },
    [dict, locale],
  );

  return t;
}
