"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";
import { Field, SubmitButton, ErrorBanner } from "@/components/auth/fields";

/**
 * Post-invite / post-recovery password setter. Reached with an active session
 * established by the email link (via /auth/callback). Sets the password with
 * the browser client, then hands off to /auth/callback/complete to route the
 * user to their org.
 */
export default function SetPasswordPage() {
  const t = useT();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError(t("auth.errors.passwordTooShort"));
      return;
    }
    setPending(true);
    setError(null);

    const { error: updateError } = await browserClient().auth.updateUser({ password });
    if (updateError) {
      // Missing session (expired link) or weak password → recover via login.
      setError(t("auth.errors.generic"));
      setPending(false);
      return;
    }

    setDone(true);
    router.push("/auth/callback/complete");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-background-fg">
          {t("auth.setPassword.title")}
        </h1>
        <p className="text-sm text-muted">{t("auth.setPassword.subtitle")}</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field
          label={t("auth.common.password")}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <SubmitButton pending={pending || done}>
          {pending || done ? t("common.loading") : t("auth.setPassword.submit")}
        </SubmitButton>
      </form>
    </div>
  );
}
