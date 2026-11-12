import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Deduped per request. With Better Auth's cookieCache this is usually a cookie read, not a DB query. */
export const requireUser = cache(async () => {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) redirect("/login");
  return s.user;
});
