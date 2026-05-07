import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";

const oauthGoogleCallback = "/api/auth/callback/google";

// `auth()` overlaps with the App Route handler overload; assert Next.js middleware shape.
const authMiddleware = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Not logged in → redirect to /login (except public pages)
  if (!session && pathname !== "/login" && pathname !== "/") {
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

export const config = {
  matcher: [
    "/photographer/:path*",
    "/scan/:path*",
    "/gallery/:path*",
    "/api/auth/callback/google/:path+",
  ],
};
