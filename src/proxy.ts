import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic gate only (cookie present). Pages re-check the session server-side via requireUser().
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except: auth + ingest APIs (own auth), tokenized calendar feed, login, static assets.
    "/((?!api/auth|api/ingest|cal/|login|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|jpg|webp)$).*)",
  ],
};
