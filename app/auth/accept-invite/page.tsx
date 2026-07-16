"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n";
import { browserClient } from "@/lib/supabase/browser";
import { SubmitButton, ErrorBanner } from "@/components/auth/fields";

type InviteInfo = { email: string; role: string; orgName: string };
type Status = "loading" | "invalid" | "expired" | "ready";

function AcceptInvite() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        setStatus("invalid");
        return;
      }
      const [inviteRes, userRes] = await Promise.all([
        fetch(`/api/auth/invite?token=${encodeURIComponent(token)}`),
        browserClient().auth.getUser(),
      ]);
      if (!active) return;

      setCurrentEmail(userRes.data.user?.email ?? null);

      const data = await inviteRes.json();
      if (data.valid) {
        setInfo({ email: data.email, role: data.role, orgName: data.orgName });
        setStatus("ready");
      } else {
        setStatus(data.reason === "expired" ? "expired" : "invalid");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function accept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/${data.slug}/dashboard`);
        router.refresh();
      } else {
        setError(data.error ?? t("auth.errors.generic"));
        setAccepting(false);
      }
    } catch {
      setError(t("auth.errors.generic"));
      setAccepting(false);
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-muted">{t("auth.invite.validating")}</p>;
  }

  if (status === "invalid" || status === "expired") {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-background-fg">
          {t("auth.invite.invalidTitle")}
        </h1>
        <p className="text-sm text-muted">
          {status === "expired"
            ? t("auth.invite.expiredBody")
            : t("auth.invite.invalidBody")}
        </p>
        <Link href="/auth/login" className="text-sm text-coach-accent hover:underline">
          {t("auth.forgot.backToLogin")}
        </Link>
      </div>
    );
  }

  // status === "ready"
  const invite = info!;
  const returnTo = `/auth/accept-invite?token=${encodeURIComponent(token)}`;
  const signedInAsInvitee =
    currentEmail && currentEmail.toLowerCase() === invite.email.toLowerCase();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-background-fg">
          {t("auth.invite.title")}
        </h1>
        <p className="text-sm text-muted">
          {t("auth.invite.joinPrompt", { org: invite.orgName, role: invite.role })}
        </p>
      </header>

      <ErrorBanner message={error} />

      {signedInAsInvitee ? (
        <SubmitButton pending={accepting} onClick={accept}>
          {accepting ? t("common.loading") : t("auth.invite.accept")}
        </SubmitButton>
      ) : currentEmail ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {t("auth.invite.wrongAccount", { email: invite.email })}
          </p>
          <Link
            href={`/auth/login?next=${encodeURIComponent(returnTo)}`}
            className="text-sm text-coach-accent hover:underline"
          >
            {t("auth.invite.signInLink")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-muted">
            {t("auth.invite.signInPrompt", { email: invite.email })}
          </p>
          <div className="flex gap-4">
            <Link
              href={`/auth/login?next=${encodeURIComponent(returnTo)}`}
              className="text-coach-accent hover:underline"
            >
              {t("auth.invite.signInLink")}
            </Link>
            <Link
              href={`/auth/set-password?next=${encodeURIComponent(returnTo)}`}
              className="text-coach-accent hover:underline"
            >
              {t("auth.invite.createLink")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvite />
    </Suspense>
  );
}
