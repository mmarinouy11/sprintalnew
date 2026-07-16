"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOrgStore } from "@/stores/orgStore";

/**
 * Initializes the org store for the current [orgSlug] route and handles the
 * post-create ?refresh=true handoff: when present, re-fetches the org and then
 * strips the param from the URL. Renders nothing.
 */
export function OrgStoreBootstrap({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const currentSlug = useOrgStore((s) => s.slug);
  const loadForSlug = useOrgStore((s) => s.loadForSlug);
  const refresh = useOrgStore((s) => s.refresh);

  // Load whenever the active slug changes.
  useEffect(() => {
    if (currentSlug !== slug) {
      void loadForSlug(slug);
    }
  }, [slug, currentSlug, loadForSlug]);

  // Honor ?refresh=true, then remove it so back/forward doesn't re-trigger.
  useEffect(() => {
    if (params.get("refresh") !== "true") return;
    void refresh();
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.delete("refresh");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [params, pathname, router, refresh]);

  return null;
}
