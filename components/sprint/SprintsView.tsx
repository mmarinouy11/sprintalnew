"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT, useLocale } from "@/lib/i18n";
import {
  sprintProgress,
  nextSignalCheckDue,
  nextStrategicReviewMilestone,
} from "@/lib/sprint";
import type { Sprint, SprintStatus } from "@/types/sprint";

function formatDate(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

const STATUS_STYLE: Record<SprintStatus, string> = {
  planned: "bg-sidebar text-muted",
  active: "bg-bet-active/15 text-bet-active",
  closed: "bg-sidebar text-muted line-through",
};

function StatusBadge({ status }: { status: SprintStatus }) {
  const t = useT();
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {t(`sprint.status.${status}` as const)}
    </span>
  );
}

function ProgressBar({ percent, muted }: { percent: number; muted?: boolean }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sidebar">
      <div
        className={`h-full rounded-full ${muted ? "bg-muted" : "bg-bet-active"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

type Toast = { message: string; kind: "error" | "success" } | null;

export function SprintsView({
  orgSlug,
  canManage,
  canCreate,
  closeEnabled,
  sprints,
}: {
  orgSlug: string;
  canManage: boolean;
  canCreate: boolean;
  closeEnabled: boolean;
  sprints: Sprint[];
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [toast, setToast] = useState<Toast>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const showToast = (message: string, kind: "error" | "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 4000);
  };

  async function post(path: string, sprintId: string, successKey: "activated" | "closed") {
    setBusy(sprintId);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sprintId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(t(`sprint.toast.${successKey}`), "success");
        router.refresh();
      } else {
        showToast(data.error ?? t("sprint.errors.generic"), "error");
      }
    } catch {
      showToast(t("sprint.errors.generic"), "error");
    } finally {
      setBusy(null);
    }
  }

  const active = sprints.find((s) => s.status === "active") ?? null;
  const hasActive = active !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-background-fg">
          {t("sprint.title")}
        </h1>
        {canCreate && (
          <Link
            href={`/${orgSlug}/new/sprint`}
            className="btn-primary rounded-md px-3 py-1.5 text-sm font-semibold"
          >
            {t("sprint.new")}
          </Link>
        )}
      </div>

      {sprints.length === 0 ? (
        <EmptyState orgSlug={orgSlug} canCreate={canCreate} />
      ) : (
        <div className="space-y-6">
          {active && (
            <ActiveSprintCard
              sprint={active}
              locale={locale}
              canManage={canManage}
              closeEnabled={closeEnabled}
              busy={busy === active.id}
              onClose={() => post("/api/sprint/close", active.id, "closed")}
            />
          )}

          <ul className="space-y-2">
            {sprints.map((s) => (
              <SprintRow
                key={s.id}
                sprint={s}
                locale={locale}
                canManage={canManage}
                closeEnabled={closeEnabled}
                hasActive={hasActive}
                busy={busy === s.id}
                onActivate={() => post("/api/sprint/activate", s.id, "activated")}
                onActivateBlocked={() => showToast(t("sprint.toast.activeExists"), "error")}
                onClose={() => post("/api/sprint/close", s.id, "closed")}
              />
            ))}
          </ul>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-lg ${
            toast.kind === "error"
              ? "border-signal-weak/40 bg-signal-weak/10 text-signal-weak"
              : "border-signal-strong/40 bg-signal-strong/10 text-signal-strong"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function EmptyState({ orgSlug, canCreate }: { orgSlug: string; canCreate: boolean }) {
  const t = useT();
  return (
    <div className="rounded-card border border-dashed border-border bg-raised/50 p-10 text-center">
      <h2 className="font-display text-lg font-semibold text-background-fg">
        {t("sprint.empty.title")}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{t("sprint.empty.body")}</p>
      {canCreate && (
        <Link
          href={`/${orgSlug}/new/sprint`}
          className="btn-primary mt-6 inline-block rounded-md px-4 py-2 text-sm font-semibold"
        >
          {t("sprint.empty.cta")}
        </Link>
      )}
    </div>
  );
}

function ActiveSprintCard({
  sprint,
  locale,
  canManage,
  closeEnabled,
  busy,
  onClose,
}: {
  sprint: Sprint;
  locale: string;
  canManage: boolean;
  closeEnabled: boolean;
  busy: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const progress = sprintProgress(sprint);
  // Signal/review history isn't wired yet (later prompts) — cadence is shown
  // from the sprint start, i.e. the first upcoming check/milestone.
  const nextCheck = nextSignalCheckDue(sprint, null);
  const nextReview = nextStrategicReviewMilestone(sprint, null);

  return (
    <div className="rounded-card border border-bet-active/30 bg-raised p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-background-fg">
              {sprint.name}
            </h2>
            <StatusBadge status={sprint.status} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {formatDate(sprint.start_date, locale)} → {formatDate(sprint.end_date, locale)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl text-bet-active">{progress.daysRemaining}</p>
          <p className="text-xs text-muted">{t("sprint.card.countdown", { days: progress.daysRemaining })}</p>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-xs text-muted">
          <span>{t("sprint.progress")}</span>
          <span>
            {t("sprint.daysElapsed", { elapsed: progress.daysElapsed, total: sprint.duration_days ?? 0 })}
          </span>
        </div>
        <ProgressBar percent={progress.percent} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-background p-3">
          <dt className="text-xs text-muted">{t("sprint.card.nextSignalCheck")}</dt>
          <dd className="mt-0.5 text-background-fg">
            {nextCheck ? formatDate(nextCheck.toISOString(), locale) : t("sprint.card.noUpcomingChecks")}
          </dd>
        </div>
        <div className="rounded-md bg-background p-3">
          <dt className="text-xs text-muted">{t("sprint.card.nextReview")}</dt>
          <dd className="mt-0.5 text-background-fg">
            {nextReview
              ? `${t("sprint.card.reviewMilestone", { percent: nextReview.milestone })} · ${formatDate(nextReview.dueAt.toISOString(), locale)}`
              : t("sprint.card.allReviewsDone")}
          </dd>
        </div>
      </dl>

      {canManage && closeEnabled && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-background-fg hover:bg-sidebar disabled:opacity-60"
          >
            {t("sprint.close")}
          </button>
        </div>
      )}
    </div>
  );
}

function SprintRow({
  sprint,
  locale,
  canManage,
  closeEnabled,
  hasActive,
  busy,
  onActivate,
  onActivateBlocked,
  onClose,
}: {
  sprint: Sprint;
  locale: string;
  canManage: boolean;
  closeEnabled: boolean;
  hasActive: boolean;
  busy: boolean;
  onActivate: () => void;
  onActivateBlocked: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const progress = sprintProgress(sprint);

  return (
    <li className="flex items-center gap-4 rounded-card border border-border bg-raised px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-background-fg">{sprint.name}</span>
          <StatusBadge status={sprint.status} />
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {formatDate(sprint.start_date, locale)} → {formatDate(sprint.end_date, locale)}
          {sprint.status === "active" && ` · ${t("sprint.daysRemaining", { days: progress.daysRemaining })}`}
        </p>
        <div className="mt-2 w-40">
          <ProgressBar percent={progress.percent} muted={sprint.status !== "active"} />
        </div>
      </div>

      {canManage && sprint.status === "planned" && (
        <button
          type="button"
          onClick={hasActive ? onActivateBlocked : onActivate}
          disabled={busy}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-background-fg hover:bg-sidebar disabled:opacity-60"
        >
          {t("sprint.activate")}
        </button>
      )}
      {canManage && closeEnabled && sprint.status === "active" && (
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-md border border-border px-3 py-1.5 text-sm text-background-fg hover:bg-sidebar disabled:opacity-60"
        >
          {t("sprint.close")}
        </button>
      )}
    </li>
  );
}
