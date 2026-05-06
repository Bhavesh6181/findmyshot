import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
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
});

export const config = {
  matcher: ["/photographer/:path*", "/scan/:path*", "/gallery/:path*"],
};
