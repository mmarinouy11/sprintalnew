"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n";
import { Field, SubmitButton, ErrorBanner, OrDivider } from "@/components/auth/fields";
import { GoogleButton } from "@/components/auth/GoogleButton";

function SignupForm() {
  const t = useT();
  const params = useSearchParams();
  const plan = params.get("plan");

  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, orgName }),
      });
      const data = await res.json();
      if (res.ok) {
        // Identical response whether or not the email already exists.
        setDone(true);
      } else {
        setError(data.error ?? t("auth.errors.generic"));
      }
    } catch {
      setError(t("auth.errors.generic"));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-background-fg">
          {t("auth.signup.title")}
        </h1>
        <p className="text-sm text-muted">{t("auth.signup.checkEmail")}</p>
        <Link href="/auth/login" className="text-sm text-coach-accent hover:underline">
          {t("auth.signup.loginLink")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-background-fg">
          {t("auth.signup.title")}
        </h1>
        <p className="text-sm text-muted">{t("auth.signup.subtitle")}</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field
          label={t("auth.signup.orgNameLabel")}
          type="text"
          autoComplete="organization"
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
        <Field
          label={t("auth.common.email")}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label={t("auth.common.password")}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <SubmitButton pending={pending}>
          {pending ? t("common.loading") : t("auth.signup.submit")}
        </SubmitButton>
      </form>

      <OrDivider label={t("auth.common.or")} />
      <GoogleButton label={t("auth.signup.google")} plan={plan} />

      <p className="text-center text-sm text-muted">
        {t("auth.signup.haveAccount")}{" "}
        <Link href="/auth/login" className="text-coach-accent hover:underline">
          {t("auth.signup.loginLink")}
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
