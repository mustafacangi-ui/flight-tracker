import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const hostOnly =
    request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (
    hostOnly === "fiyatrotasi.com" &&
    request.nextUrl.pathname.startsWith("/auth/callback")
  ) {
    const target = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      "https://www.fiyatrotasi.com"
    );
    return NextResponse.redirect(target, 307);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.getUser();
  if (
    request.nextUrl.pathname.startsWith("/auth") &&
    process.env.NODE_ENV === "development"
  ) {
    console.log("[auth] middleware refresh", {
      path: request.nextUrl.pathname,
      err: error?.message,
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Skip static assets and PWA files; refresh session on everything else.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
