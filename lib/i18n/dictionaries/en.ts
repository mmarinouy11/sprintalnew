/**
 * English dictionary (source of truth for keys).
 * Every user-visible string in the app must have a key here (rule #6).
 * es.ts and pt.ts mirror this shape via the `Dictionary` type.
 */
export const en = {
  common: {
    appName: "Sprintal",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
  },
  nav: {
    portfolio: "Portfolio",
    bets: "Bets",
    signals: "Signals",
    settings: "Settings",
  },
};

// Leaves are inferred as `string` (no `as const`), so es/pt only have to match
// the shape, not the exact English literals.
export type Dictionary = typeof en;
export default en;
