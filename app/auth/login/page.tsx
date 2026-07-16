"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n";
import { Field, SubmitButton, ErrorBanner, OrDivider } from "@/components/auth/fields";
import { GoogleButton } from "@/components/auth/GoogleButton";

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const plan = params.get("plan");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") ? t("auth.errors.generic") : null,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, next }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(data.redirect ?? "/auth/callback/complete");
        router.refresh();
      } else {
        setError(data.error ?? t("auth.errors.generic"));
        setPending(false);
      }
    } catch {
      setError(t("auth.errors.generic"));
      setPending(false);
    }
  }

  const forgotHref = "/auth/forgot-password";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-background-fg">
          {t("auth.login.title")}
        </h1>
        <p className="text-sm text-muted">{t("auth.login.subtitle")}</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field
          label={t("auth.common.email")}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="space-y-1">
          <Field
            label={t("auth.common.password")}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="text-right">
            <Link href={forgotHref} className="text-xs text-coach-accent hover:underline">
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
        </div>
        <SubmitButton pending={pending}>
          {pending ? t("common.loading") : t("auth.login.submit")}
        </SubmitButton>
      </form>

      <OrDivider label={t("auth.common.or")} />
      <GoogleButton label={t("auth.login.google")} plan={plan} next={next} />

      <p className="text-center text-sm text-muted">
        {t("auth.login.noAccount")}{" "}
        <Link href="/auth/signup" className="text-coach-accent hover:underline">
          {t("auth.login.signUpLink")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
