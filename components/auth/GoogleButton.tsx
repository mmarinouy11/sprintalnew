"use client";

import { useState } from "react";
import { browserClient } from "@/lib/supabase/browser";

/**
 * Google OAuth button. Initiates the OAuth redirect via the browser client and
 * routes the return through /auth/callback, preserving plan intent (?plan=)
 * and any post-login `next` path.
 */
export function GoogleButton({
  label,
  plan,
  next,
}: {
  label: string;
  plan?: string | null;
  next?: string | null;
}) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    const callback = new URL("/auth/callback", window.location.origin);
    if (plan) callback.searchParams.set("plan", plan);
    if (next && next.startsWith("/")) callback.searchParams.set("next", next);

    const { error } = await browserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    if (error) setPending(false); // otherwise the browser is navigating away
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-background-fg transition-colors hover:bg-sidebar disabled:opacity-60"
    >
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
        />
      </svg>
      {label}
    </button>
  );
}
