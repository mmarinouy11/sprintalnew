import { create } from "zustand";
import type { OrgData } from "@/types/org";

/**
 * Holds the current org's data from GET /api/org/data (spec section 2).
 *
 * - loadForSlug(slug): fetch data for an org (used on mount / navigation).
 * - refresh(): re-fetch the current org (used by the ?refresh=true effect after
 *   creating a sub-area).
 * - switchOrg(slug): make another org the active one and load it.
 *
 * Slug-guarded so a slow response for a previous org can't overwrite a newer
 * one. Client-only; never holds secrets or service_role data.
 */
type Status = "idle" | "loading" | "ready" | "error";

interface OrgStore {
  slug: string | null;
  data: OrgData | null;
  status: Status;
  error: string | null;
  loadForSlug: (slug: string) => Promise<void>;
  refresh: () => Promise<void>;
  switchOrg: (slug: string) => Promise<void>;
}

async function fetchOrgData(slug: string): Promise<OrgData> {
  const res = await fetch(`/api/org/data?slug=${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`org data request failed (${res.status})`);
  }
  return (await res.json()) as OrgData;
}

export const useOrgStore = create<OrgStore>((set, get) => ({
  slug: null,
  data: null,
  status: "idle",
  error: null,

  loadForSlug: async (slug) => {
    if (get().slug === slug && get().status === "loading") return;
    set({ slug, status: "loading", error: null });
    try {
      const data = await fetchOrgData(slug);
      if (get().slug === slug) set({ data, status: "ready" });
    } catch (e) {
      if (get().slug === slug) {
        set({ status: "error", error: (e as Error).message, data: null });
      }
    }
  },

  refresh: async () => {
    const slug = get().slug;
    if (!slug) return;
    try {
      const data = await fetchOrgData(slug);
      if (get().slug === slug) set({ data, status: "ready", error: null });
    } catch (e) {
      set({ status: "error", error: (e as Error).message });
    }
  },

  switchOrg: async (slug) => {
    await get().loadForSlug(slug);
  },
}));
