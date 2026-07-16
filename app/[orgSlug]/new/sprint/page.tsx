import { redirect } from "next/navigation";
import { getServerSession, roleAtLeast } from "@/lib/auth";
import { durationBandForLevel } from "@/lib/sprint";
import { NewSprintForm } from "@/components/sprint/NewSprintForm";

export const dynamic = "force-dynamic";

/**
 * /{orgSlug}/new/sprint — sprint creation form. Editor+ only; viewers are
 * bounced to the sprint list.
 */
export default async function NewSprintPage({
  params,
}: {
  params: { orgSlug: string };
}) {
  const session = await getServerSession({ orgSlug: params.orgSlug });
  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(`/${params.orgSlug}/new/sprint`)}`);
  }
  const org = session.orgs.find((o) => o.slug === params.orgSlug);
  if (!org) {
    redirect("/auth/callback/complete");
  }
  if (!roleAtLeast(org.role, "editor")) {
    redirect(`/${params.orgSlug}/sprints`);
  }

  const band = durationBandForLevel(org.level);

  return (
    <NewSprintForm
      slug={params.orgSlug}
      orgName={org.name}
      level={org.level}
      band={band}
    />
  );
}
