import type { Metadata } from "next";
import { Outfit, IBM_Plex_Mono } from "next/font/google";
import "../styles/globals.css";
import { LocaleProvider } from "@/lib/i18n";
import { resolveLocale } from "@/lib/i18n/resolve-locale";

/**
 * Outfit powers both display and body per spec section 6; exposed as two CSS
 * variables so the design system can diverge them later without touching JSX.
 */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const outfitBody = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sprintal",
  description: "Strategic portfolio management on a sprint cadence.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Locale is resolved on the server (cookie -> Accept-Language -> default)
  // and handed to the client useT() hook via <LocaleProvider> (rule #6).
  const locale = resolveLocale();

  return (
    <html
      lang={locale}
      data-theme="dark"
      className={`${outfit.variable} ${outfitBody.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
