import type { Locale } from "../config";
import { en, type Dictionary } from "./en";
import { es } from "./es";
import { pt } from "./pt";

/** All dictionaries keyed by locale. */
export const dictionaries: Record<Locale, Dictionary> = { en, es, pt };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
