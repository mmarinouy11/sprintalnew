import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Middleware: keeps the Supabase session cookie fresh on every request and
 * guards org-scoped routes.
 *
 * Any first path segment that isn't a public/reserved route is treated as an
 * `[orgSlug]`. Unauthenticated users hitting such a route are redirected to
 * /auth/login with `?next=` so they return to where they were after signing in
 * (session recovery). auth/api/_next/static are excluded via the matcher below.
 */
const PUBLIC_SEGMENTS = new Set(["", "pricing", "onboarding"]);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session (and its cookies) if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const firstSegment = pathname.split("/")[1] ?? "";
  const isOrgRoute = firstSegment.length > 0 && !PUBLIC_SEGMENTS.has(firstSegment);

  if (isOrgRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Run on everything except Next internals, static files, and the routes that
  // manage their own auth (api, auth). Excluding paths with a file extension.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|auth|.*\\..*).*)"],
};
