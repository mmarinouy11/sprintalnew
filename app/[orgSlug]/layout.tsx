import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { TopBar } from "@/components/TopBar";
import { OrgStoreBootstrap } from "@/components/org/OrgStoreBootstrap";

/**
 * Layout for org-scoped routes (/{orgSlug}/*). Verifies the signed-in user is a
 * member of this org (middleware only checks that they're signed in), mounts the
 * org store for the slug, and renders the shared TopBar.
 */
export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { orgSlug: string };
}) {
  const session = await getServerSession({ orgSlug: params.orgSlug });
  if (!session) {
    redirect(`/auth/login?next=${encodeURIComponent(`/${params.orgSlug}`)}`);
  }

  const isMember = session.orgs.some((o) => o.slug === params.orgSlug);
  if (!isMember) {
    // Signed in but not a member of this org — send them to their own home.
    redirect("/auth/callback/complete");
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <OrgStoreBootstrap slug={params.orgSlug} />
      </Suspense>
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
