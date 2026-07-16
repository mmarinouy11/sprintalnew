"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { Field, SubmitButton, ErrorBanner } from "@/components/auth/fields";

/**
 * Form to create a sub-area under `parentOrgId`. On success it redirects to the
 * NEW org with ?refresh=true, so the destination's OrgStoreBootstrap refreshes
 * the store (and then strips the param).
 */
export function NewSubAreaForm({
  parentOrgId,
  parentName,
}: {
  parentOrgId: string;
  parentName: string;
}) {
  const t = useT();
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/org/create-sub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parentOrgId, name }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/${data.orgSlug}/dashboard?refresh=true`);
        router.refresh();
      } else {
        setError(data.error ?? t("org.errors.generic"));
        setPending(false);
      }
    } catch {
      setError(t("org.errors.generic"));
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-xl font-semibold text-background-fg">
          {t("org.newSub.title")}
        </h1>
        <p className="text-sm text-muted">
          {t("org.newSub.subtitle", { parent: parentName })}
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field
          label={t("org.newSub.nameLabel")}
          type="text"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <SubmitButton pending={pending}>
            {pending ? t("common.loading") : t("org.newSub.submit")}
          </SubmitButton>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md px-3 py-2 text-sm text-muted hover:text-background-fg"
          >
            {t("org.newSub.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
