import { redirect } from "next/navigation";
import { getServerSession, roleAtLeast } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";
import { getRootPlan } from "@/lib/org";
import { SprintsView } from "@/components/sprint/SprintsView";
import type { Sprint } from "@/types/sprint";

export const dynamic = "force-dynamic";

/**
 * /{orgSlug}/sprints — list of the org's sprints. Server-loads the data (rule
 * #1: service_role stays server-side, as in getServerSession) after the layout
 * has already guarded membership, then hands off to the interactive view.
 */
export default async function SprintsPage({
  params,
}: {
  params: { orgSlug: string };
}) {
  const session = await getServerSession({ orgSlug: params.orgSlug });
  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(`/${params.orgSlug}/sprints`)}`);
  }
  const org = session.orgs.find((o) => o.slug === params.orgSlug);
  if (!org) {
    redirect("/auth/callback/complete");
  }

  const { data: sprints } = await serviceClient()
    .from("sprints")
    .select(
      "id, org_id, name, status, start_date, end_date, duration_days, closed_at, created_at, updated_at",
    )
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const rootPlan = await getRootPlan(org.id);

  return (
    <SprintsView
      orgSlug={params.orgSlug}
      canManage={roleAtLeast(org.role, "admin")}
      canCreate={roleAtLeast(org.role, "editor")}
      closeEnabled={rootPlan !== "trial"}
      sprints={(sprints ?? []) as Sprint[]}
    />
  );
}
