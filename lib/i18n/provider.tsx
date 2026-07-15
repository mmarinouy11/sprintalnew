"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./config";

/**
 * Holds the locale resolved on the server (via resolveLocale()) so that the
 * client `useT()` hook can read it without a round-trip. Wrap the app in
 * <LocaleProvider locale={resolveLocale()}> inside the root layout.
 */
const LocaleContext = createContext<Locale | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  const locale = useContext(LocaleContext);
  if (!locale) {
    throw new Error("useLocale must be used within a <LocaleProvider>");
  }
  return locale;
}
