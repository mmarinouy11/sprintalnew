"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";
import { Field, SubmitButton } from "@/components/auth/fields";

/**
 * Forgot-password screen. Sends a Supabase reset email whose link returns
 * through /auth/callback and on to /auth/set-password. Always shows the same
 * confirmation message so it never reveals whether the email exists.
 */
export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      "/auth/set-password",
    )}`;
    // Ignore the result deliberately — response is identical either way.
    await browserClient().auth.resetPasswordForEmail(email, { redirectTo });
    setSent(true);
    setPending(false);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-background-fg">
          {t("auth.forgot.title")}
        </h1>
        <p className="text-sm text-muted">{t("auth.forgot.subtitle")}</p>
      </header>

      {sent ? (
        <p className="rounded-md border border-border bg-background px-3 py-2 text-sm text-background-fg">
          {t("auth.forgot.sent")}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label={t("auth.common.email")}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <SubmitButton pending={pending}>
            {pending ? t("common.loading") : t("auth.forgot.submit")}
          </SubmitButton>
        </form>
      )}

      <p className="text-center text-sm">
        <Link href="/auth/login" className="text-coach-accent hover:underline">
          {t("auth.forgot.backToLogin")}
        </Link>
      </p>
    </div>
  );
}
