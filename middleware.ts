import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";

const oauthGoogleCallback = "/api/auth/callback/google";

// `auth()` overlaps with the App Route handler overload; assert Next.js middleware shape.
const authMiddleware = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Skip all auth routes to avoid any accidental callback/action mutation.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Not logged in → protect private pages and API routes
  if (!session && pathname !== "/login" && pathname !== "/") {
    // API routes should get a 401 JSON response, not a redirect to /login
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Regular user trying to access /photographer → redirect to /scan
  if (
    session?.user?.role === "user" &&
    pathname.startsWith("/photographer")
  ) {
    return NextResponse.redirect(new URL("/scan", req.url));
  }

  // Photographer accessing /scan or /gallery → redirect to dashboard
  if (
    session?.user?.role === "photographer" &&
    (pathname === "/scan" || pathname === "/gallery")
  ) {
    return NextResponse.redirect(new URL("/photographer", req.url));
  }

  return NextResponse.next();
}) as unknown as NextMiddleware;

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Google must redirect to exactly `/api/auth/callback/google`. Extra path
  // segments cause Auth.js UnknownAction (e.g. mis-typed redirect URI in Cloud Console).
  if (req.nextUrl.pathname.startsWith(`${oauthGoogleCallback}/`)) {
    const url = req.nextUrl.clone();
    url.pathname = oauthGoogleCallback;
    return NextResponse.redirect(url);
  }

  return authMiddleware(req, event);
}

// IMPORTANT: API proxy routes (/api/events, /api/upload, /api/photos, /api/match)
// are EXCLUDED from the matcher so that NextAuth's auth() wrapper never intercepts them.
// These routes proxy to the Python backend server-side and handle their own auth if needed.
// Previously, the catch-all pattern was matching these paths, causing NextAuth to return
// a generic 400 "Bad request." before the route handler could execute.
export const config = {
  matcher: [
    "/photographer/:path*",
    "/scan/:path*",
    "/gallery/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
