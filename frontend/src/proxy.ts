import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("fc26_token")?.value;
  const { pathname } = request.nextUrl;

  // Protected paths
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/players") ||
    pathname.startsWith("/teams") ||
    pathname.startsWith("/auction-pool") ||
    pathname.startsWith("/auction") ||
    pathname.startsWith("/statistics") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/export") ||
    pathname.startsWith("/watchlist") ||
    pathname.startsWith("/squad");

  const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isProtectedPath && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthPath && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/players/:path*",
    "/teams/:path*",
    "/auction-pool/:path*",
    "/auction/:path*",
    "/statistics/:path*",
    "/history/:path*",
    "/export/:path*",
    "/watchlist/:path*",
    "/squad/:path*",
    "/login",
    "/register",
  ],
};
