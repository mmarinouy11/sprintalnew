import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { NewSubAreaForm } from "@/components/org/NewSubAreaForm";

export const dynamic = "force-dynamic";

/**
 * /{orgSlug}/new/sub-org — owner-only form to create a nested area.
 *
 * Server-guards ownership before rendering: non-owners are bounced to the
 * dashboard (the TopBar only shows "New Area" to owners, so reaching here as a
 * non-owner is either a stale link or tampering — either way, no form).
 */
export default async function NewSubOrgPage({
  params,
}: {
  params: { orgSlug: string };
}) {
  const session = await getServerSession({ orgSlug: params.orgSlug });
  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(`/${params.orgSlug}/new/sub-org`)}`);
  }

  const org = session.orgs.find((o) => o.slug === params.orgSlug);
  if (!org) {
    redirect("/auth/callback/complete");
  }
  if (org.role !== "owner") {
    redirect(`/${params.orgSlug}/dashboard`);
  }

  return <NewSubAreaForm parentOrgId={org.id} parentName={org.name} />;
}
