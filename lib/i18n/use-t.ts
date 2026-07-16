"use client";

import { useMemo } from "react";
import { useLocale } from "./provider";
import { createTranslator, type Translator } from "./translate";

/**
 * Client translation hook (rule #6). Reads the locale from <LocaleProvider>
 * (seeded on the server via resolveLocale()) and returns a `t()` function.
 *
 *   const t = useT();
 *   t("nav.portfolio");
 *
 * The resolver itself lives in translate.ts so server code can share it.
 */
export function useT(): Translator {
  const locale = useLocale();
  return useMemo(() => createTranslator(locale), [locale]);
}
