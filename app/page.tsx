/**
 * Placeholder home route.
 *
 * Intentionally minimal: the task is skeleton-only (no pages or business logic
 * yet), but the App Router needs a root route to build and run. This exists
 * solely so `next dev` / `next build` succeed and is expected to be replaced.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <h1 className="font-display text-2xl text-background-fg">Sprintal</h1>
        <p className="mt-2 text-sm text-muted">
          Skeleton initialized. No pages yet.
        </p>
      </div>
    </main>
  );
}
