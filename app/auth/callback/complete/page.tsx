import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * /auth/callback/complete — resolve the user's home org after auth.
 *
 *   - no session       -> /auth/login (session recovery)
 *   - returning w/ org  -> /{orgSlug}/dashboard
 *   - new user, no org  -> /onboarding (plan intent forwarded)
 *
 * NOTE: a `?next=` path (session recovery) takes precedence when present.
 * The spec's "/{orgSlug}/onboarding" needs a slug, which a no-org user does not
 * have yet; onboarding (a later prompt) owns creating the org and its slug, so
 * we send no-org users to /onboarding for now.
 */
export default async function CompletePage({
  searchParams,
}: {
  searchParams: { plan?: string; next?: string };
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const next = searchParams.next;
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }

  if (session.currentOrg) {
    redirect(`/${session.currentOrg.slug}/dashboard`);
  }

  const plan = searchParams.plan ? `?plan=${encodeURIComponent(searchParams.plan)}` : "";
  redirect(`/onboarding${plan}`);
}
