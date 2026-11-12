import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic gate only (cookie present). Pages re-check the session server-side via requireUser().
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    // Signed-out visitors see the landing page at "/" (URL unchanged); everything else asks them to sign in.
    if (request.nextUrl.pathname === "/") return NextResponse.rewrite(new URL("/welcome", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except: auth + ingest APIs (own auth), tokenized calendar feed, login, static assets.
    "/((?!api/auth|api/ingest|cal/|login|welcome|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|jpg|webp)$).*)",
  ],
};
