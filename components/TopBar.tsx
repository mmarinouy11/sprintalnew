"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useOrgStore } from "@/stores/orgStore";
import type { OrgSummary } from "@/types/org";
import type { Role } from "@/types";

/** Small pill showing the org level, e.g. "L2". */
function LevelBadge({ level }: { level: number }) {
  const t = useT();
  return (
    <span className="rounded bg-sidebar px-1.5 py-0.5 font-mono text-[10px] text-muted">
      {t("org.levelBadge", { level })}
    </span>
  );
}

/** Role label, or a read-only tag for orgs the user isn't a member of. */
function RoleTag({ role }: { role: Role | null }) {
  const t = useT();
  if (!role) {
    return <span className="text-[11px] text-muted">{t("org.readOnly")}</span>;
  }
  return (
    <span className="text-[11px] text-coach-accent">
      {t(`org.roles.${role}` as const)}
    </span>
  );
}

/** One switchable entry. Member orgs navigate; read-only orgs are inert. */
function SwitcherRow({
  org,
  onNavigate,
}: {
  org: OrgSummary;
  onNavigate: (slug: string) => void;
}) {
  const content = (
    <div className="flex w-full items-center justify-between gap-2">
      <span className="flex items-center gap-2 truncate">
        <span className="truncate text-sm text-background-fg">{org.name}</span>
        <LevelBadge level={org.level} />
      </span>
      <RoleTag role={org.role} />
    </div>
  );

  if (org.isMember) {
    return (
      <button
        type="button"
        onClick={() => onNavigate(org.slug)}
        className="w-full rounded-md px-2 py-1.5 text-left hover:bg-sidebar"
      >
        {content}
      </button>
    );
  }
  return (
    <div
      className="w-full cursor-default rounded-md px-2 py-1.5 opacity-70"
      title="read-only"
    >
      {content}
    </div>
  );
}

function Section({ label, orgs, onNavigate }: {
  label: string;
  orgs: OrgSummary[];
  onNavigate: (slug: string) => void;
}) {
  if (orgs.length === 0) return null;
  return (
    <div className="space-y-0.5">
      <p className="px-2 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      {orgs.map((o) => (
        <SwitcherRow key={o.id} org={o} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

/**
 * TopBar (spec section 2): current org + level badge, an org switcher showing
 * the tree/siblings/parent with role indicators, and an owner-only "New Area"
 * button. Reads everything from the org store.
 */
export function TopBar() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const data = useOrgStore((s) => s.data);
  const status = useOrgStore((s) => s.status);
  const switchOrg = useOrgStore((s) => s.switchOrg);

  const navigate = (slug: string) => {
    setOpen(false);
    void switchOrg(slug);
    router.push(`/${slug}/dashboard`);
  };

  if (!data) {
    return (
      <header className="flex h-14 items-center border-b border-border bg-sidebar px-4">
        <span className="text-sm text-muted">
          {status === "error" ? t("org.errors.generic") : t("common.loading")}
        </span>
      </header>
    );
  }

  const isOwner = data.role === "owner";
  // ancestors are root-first, so the immediate parent is the last entry.
  const parent = data.ancestors.length
    ? [data.ancestors[data.ancestors.length - 1]]
    : [];

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-border bg-sidebar px-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-raised"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="font-display text-sm font-semibold text-background-fg">
            {data.org.name}
          </span>
          <LevelBadge level={data.org.level} />
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 4l4 4 4-4" stroke="currentColor" fill="none" className="text-muted" />
          </svg>
        </button>
        <RoleTag role={data.role} />
      </div>

      {isOwner && (
        <button
          type="button"
          disabled={!data.limits.canCreateSubArea}
          onClick={() => router.push(`/${data.org.slug}/new/sub-org`)}
          className="btn-primary rounded-md px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          title={
            data.limits.canCreateSubArea ? undefined : t("org.errors.depthLimit")
          }
        >
          {t("org.topbar.newArea")}
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute left-4 top-14 z-20 max-h-[70vh] w-72 overflow-auto rounded-card border border-border bg-raised p-1 shadow-xl"
          >
            <Section label={t("org.topbar.parent")} orgs={parent} onNavigate={navigate} />
            <Section
              label={t("org.topbar.siblings")}
              orgs={data.siblings}
              onNavigate={navigate}
            />
            <Section
              label={t("org.topbar.children")}
              orgs={data.children}
              onNavigate={navigate}
            />
          </div>
        </>
      )}
    </header>
  );
}
