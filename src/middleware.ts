import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public admin route: login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Public API routes
  if (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/uploads/") ||
    pathname.startsWith("/api/events/") ||
    pathname.match(/^\/api\/displays\/[^/]+\/content$/)
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = sessionCookie ? await verifySessionCookie(sessionCookie) : false;

  if (!isAuthenticated) {
    // API routes get 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Admin pages redirect to login
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
