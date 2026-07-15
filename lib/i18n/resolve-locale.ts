import "server-only";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
} from "./config";

/**
 * Server-side locale resolution (rule #6).
 * Order of precedence:
 *   1. The explicit `sprintal_locale` cookie, if set to a supported locale.
 *   2. The best match from the browser's Accept-Language header.
 *   3. DEFAULT_LOCALE ("en").
 *
 * Call this in the root layout / server components and pass the result into
 * <LocaleProvider> so the client `useT()` hook has the resolved locale.
 */
export function resolveLocale(): Locale {
  const cookieLocale = cookies().get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  const acceptLanguage = headers().get("accept-language");
  return matchAcceptLanguage(acceptLanguage);
}

/** Parse an Accept-Language header and pick the highest-quality supported locale. */
export function matchAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      const quality = qPart ? Number.parseFloat(qPart) : 1;
      return { tag: tag.toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    const found = LOCALES.find((locale) => locale === base);
    if (found) return found;
  }

  return DEFAULT_LOCALE;
}
