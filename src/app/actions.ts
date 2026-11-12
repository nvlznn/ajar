"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n";
import { db } from "@/db";
import { profiles, userSettings, userStatus } from "@/db/schema";
import { STATUSES, type TrackingStatus } from "@/lib/categories";
import { PROFILE_FIELDS } from "@/lib/profile-fields";
import { requireUser } from "@/lib/session";

export async function setStatus(opportunityId: string, status: TrackingStatus | null) {
  const u = await requireUser();
  if (status === null) {
    await db
      .delete(userStatus)
      .where(and(eq(userStatus.userId, u.id), eq(userStatus.opportunityId, opportunityId)));
  } else {
    if (!STATUSES.includes(status)) throw new Error("invalid status");
    await db
      .insert(userStatus)
      .values({ userId: u.id, opportunityId, status })
      .onConflictDoUpdate({
        target: [userStatus.userId, userStatus.opportunityId],
        set: { status, updatedAt: sql`now()` },
      });
  }
  revalidatePath("/", "layout");
}

export async function setLocale(locale: Locale) {
  await requireUser();
  if (!isLocale(locale)) throw new Error("invalid locale");
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function setRegionMode(mode: "focus" | "all") {
  const u = await requireUser();
  await db
    .insert(userSettings)
    .values({ userId: u.id, regionMode: mode })
    .onConflictDoUpdate({ target: userSettings.userId, set: { regionMode: mode } });
  revalidatePath("/", "layout");
}


export async function saveProfile(formData: FormData) {
  const u = await requireUser();
  const fields: Record<string, string> = {};
  for (const key of PROFILE_FIELDS) {
    const v = String(formData.get(`f_${key}`) ?? "").trim();
    if (v) fields[key] = v;
  }
  const markdown = String(formData.get("markdown") ?? "");
  await db
    .insert(profiles)
    .values({ userId: u.id, fields, markdown })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { fields, markdown, version: sql`${profiles.version} + 1`, updatedAt: sql`now()` },
    });
  revalidatePath("/profile");
}
