import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth/callback", "/auth/error"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) return true;
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true; // static files (icons, manifest, sw.js...)
  return false;
}

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return response;
  }

  // updateSession has already refreshed cookies onto `response`; check auth
  // via the cookie presence is unreliable, so re-derive from the response's
  // own Supabase client would be redundant here. Instead we rely on layouts
  // deeper in the tree (which run getUser()) for the authoritative check,
  // and only use this as a fast-path redirect for obviously signed-out
  // requests to protected sections.
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  if (!hasSupabaseCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js).*)",
  ],
};
