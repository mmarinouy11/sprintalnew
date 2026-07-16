/**
 * Layout for the /auth/* routes — a centered card on the app background.
 * Server component; individual auth screens are client components.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm rounded-card border border-border bg-raised p-8 shadow-xl">
        {children}
      </div>
    </main>
  );
}
