"use client";

import { useT } from "@/lib/i18n";
import { useOrgStore } from "@/stores/orgStore";

/**
 * PLACEHOLDER dashboard — the org model's landing/redirect target. It renders a
 * small overview from the org store to prove data loads, the switcher works, and
 * the ?refresh=true handoff runs. The real dashboard is a later prompt; this is
 * intentionally minimal scaffolding.
 */
export default function DashboardPage() {
  const t = useT();
  const data = useOrgStore((s) => s.data);

  if (!data) {
    return <p className="text-sm text-muted">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-background-fg">
          {data.org.name}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t("org.levelBadge", { level: data.org.level })} · {data.rootPlan}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <Stat label={t("org.topbar.children")} value={data.children.length} />
        <Stat label={t("nav.bets")} value={data.activeBets.length} />
        <Stat
          label={t("org.topbar.siblings")}
          value={data.siblings.length}
        />
      </dl>

      <p className="text-xs text-muted">
        {data.limits.currentSubAreas}
        {data.limits.subAreaLimit !== null ? ` / ${data.limits.subAreaLimit}` : ""}{" "}
        areas · depth ≤ {data.limits.depthLimit}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-border bg-raised p-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-2xl text-background-fg">{value}</dd>
    </div>
  );
}
