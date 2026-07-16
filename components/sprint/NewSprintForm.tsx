"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useT, useLocale } from "@/lib/i18n";
import { Field, SubmitButton, ErrorBanner } from "@/components/auth/fields";
import type { DurationBand } from "@/lib/sprint";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(startIso: string, days: number): string | null {
  const t = Date.parse(startIso);
  if (Number.isNaN(t) || !Number.isFinite(days)) return null;
  return new Date(t + days * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Sprint creation form. Duration defaults to the level's default and is
 * constrained to its band; the end date is computed live from start + duration.
 */
export function NewSprintForm({
  slug,
  orgName,
  level,
  band,
}: {
  slug: string;
  orgName: string;
  level: number;
  band: DurationBand;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [duration, setDuration] = useState(String(band.default));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const endDate = useMemo(() => {
    const days = Number(duration);
    const iso = addDaysIso(startDate, days);
    if (!iso) return null;
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(iso));
  }, [startDate, duration, locale]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/sprint/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          startDate,
          durationDays: Number(duration),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/${slug}/sprints`);
        router.refresh();
      } else {
        setError(data.error ?? t("sprint.errors.generic"));
        setPending(false);
      }
    } catch {
      setError(t("sprint.errors.generic"));
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-1">
        <h1 className="font-display text-xl font-semibold text-background-fg">
          {t("sprint.newForm.title")}
        </h1>
        <p className="text-sm text-muted">
          {t("sprint.newForm.subtitle", { org: orgName })}
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorBanner message={error} />
        <Field
          label={t("sprint.newForm.nameLabel")}
          type="text"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label={t("sprint.newForm.startDateLabel")}
          type="date"
          required
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <div>
          <Field
            label={t("sprint.newForm.durationLabel")}
            type="number"
            required
            min={band.min}
            max={band.max}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <p className="mt-1 text-xs text-muted">
            {t("sprint.newForm.durationHint", {
              level,
              min: band.min,
              max: band.max,
              default: band.default,
            })}
          </p>
        </div>
        {endDate && (
          <p className="text-sm text-muted">
            {t("sprint.newForm.endDatePreview", { date: endDate })}
          </p>
        )}
        <div className="flex items-center gap-3">
          <SubmitButton pending={pending}>
            {pending ? t("common.loading") : t("sprint.newForm.submit")}
          </SubmitButton>
          <button
            type="button"
            onClick={() => router.push(`/${slug}/sprints`)}
            className="rounded-md px-3 py-2 text-sm text-muted hover:text-background-fg"
          >
            {t("sprint.newForm.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
