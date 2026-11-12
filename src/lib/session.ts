import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireUser() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) redirect("/login");
  return s.user;
}
