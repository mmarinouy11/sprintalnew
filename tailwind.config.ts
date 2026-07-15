import type { Config } from "tailwindcss";

/**
 * Tailwind is wired to the CSS custom properties defined in styles/globals.css
 * (spec section 10). Tokens are the single source of truth — colors below are
 * `var(--token)` references, never raw hex, so themes stay in one place.
 *
 * Exception per architectural rule #7: primary buttons use the fixed brand
 * value #5C6AC4 directly, exposed here as `brand-fixed`, NOT `var(--brand)`.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        "background-fg": "var(--background-fg)",
        sidebar: "var(--sidebar)",
        "sidebar-fg": "var(--sidebar-fg)",
        raised: "var(--raised)",
        "raised-fg": "var(--raised-fg)",
        border: "var(--border)",
        muted: "var(--muted)",

        // Signal quality
        "signal-strong": "var(--signal-strong)",
        "signal-unclear": "var(--signal-unclear)",
        "signal-weak": "var(--signal-weak)",

        // Bet lifecycle states
        "bet-active": "var(--bet-active)",
        "bet-scaled": "var(--bet-scaled)",
        "bet-pivoted": "var(--bet-pivoted)",
        "bet-done": "var(--bet-done)",
        "bet-killed": "var(--bet-killed)",

        // AI coach
        "coach-accent": "var(--coach-accent)",

        // Fixed brand — primary buttons ONLY (architectural rule #7)
        "brand-fixed": "#5C6AC4",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
    },
  },
  plugins: [],
};

export default config;
