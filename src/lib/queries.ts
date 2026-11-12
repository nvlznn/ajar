import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { opportunities, scores, userSettings, userStatus } from "@/db/schema";
import { TRACKING, type Category } from "@/lib/categories";

export type RegionMode = "focus" | "all";

export type ListFilters = {
  q?: string;
  category?: Category;
  /** default: hide ineligible */
  showIneligible?: boolean;
  /** default: hide past deadlines */
  showArchived?: boolean;
  regionMode: RegionMode;
};

export async function getSettings(userId: string) {
  const [s] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
  return { regionMode: (s?.regionMode ?? "focus") as RegionMode };
}

/** Taiwan, online, unknown location, or overseas with money attached / program-type items. */
const focusRegion = or(
  isNull(opportunities.country),
  eq(opportunities.country, "TW"),
  eq(opportunities.locationMode, "online"),
  sql`${opportunities.compensation}->>'travel_support' is not null`,
  sql`${opportunities.compensation}->>'salary' is not null`,
  inArray(opportunities.category, ["exchange", "program", "scholarship", "lab"]),
)!;

export async function listOpportunities(userId: string, f: ListFilters) {
  const now = new Date();
  const where: SQL[] = [isNull(opportunities.parentId)];
  if (!f.showArchived) where.push(or(isNull(opportunities.deadlineAt), gte(opportunities.deadlineAt, now))!);
  else where.push(lt(opportunities.deadlineAt, now));
  if (!f.showIneligible) where.push(or(isNull(scores.eligibility), ne(scores.eligibility, "ineligible"))!);
  if (f.regionMode === "focus") where.push(focusRegion);
  if (f.category) where.push(eq(opportunities.category, f.category));
  if (f.q) {
    const like = `%${f.q}%`;
    where.push(or(ilike(opportunities.title, like), ilike(opportunities.organizer, like), ilike(opportunities.summary, like))!);
  }
  where.push(or(isNull(userStatus.status), ne(userStatus.status, "skipped"))!);

  return db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      category: opportunities.category,
      organizer: opportunities.organizer,
      city: opportunities.city,
      country: opportunities.country,
      locationMode: opportunities.locationMode,
      deadlineAt: opportunities.deadlineAt,
      deadlineEstimated: opportunities.deadlineEstimated,
      prepDays: opportunities.prepDays,
      firstSeenAt: opportunities.firstSeenAt,
      score: scores.score,
      eligibility: scores.eligibility,
      status: userStatus.status,
    })
    .from(opportunities)
    .leftJoin(scores, and(eq(scores.opportunityId, opportunities.id), eq(scores.userId, userId)))
    .leftJoin(userStatus, and(eq(userStatus.opportunityId, opportunities.id), eq(userStatus.userId, userId)))
    .where(and(...where))
    .orderBy(f.showArchived ? desc(opportunities.deadlineAt) : sql`${opportunities.deadlineAt} asc nulls last`, desc(scores.score))
    .limit(1000);
}

export type ListItem = Awaited<ReturnType<typeof listOpportunities>>[number];

export async function listTracking(userId: string) {
  return db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      category: opportunities.category,
      deadlineAt: opportunities.deadlineAt,
      deadlineEstimated: opportunities.deadlineEstimated,
      status: userStatus.status,
    })
    .from(userStatus)
    .innerJoin(opportunities, eq(opportunities.id, userStatus.opportunityId))
    .where(and(eq(userStatus.userId, userId), inArray(userStatus.status, TRACKING)))
    .orderBy(sql`${opportunities.deadlineAt} asc nulls last`);
}

export async function deadlinesInRange(userId: string, from: Date, to: Date) {
  return db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      category: opportunities.category,
      deadlineAt: opportunities.deadlineAt,
      deadlineEstimated: opportunities.deadlineEstimated,
      eligibility: scores.eligibility,
      status: userStatus.status,
    })
    .from(opportunities)
    .leftJoin(scores, and(eq(scores.opportunityId, opportunities.id), eq(scores.userId, userId)))
    .leftJoin(userStatus, and(eq(userStatus.opportunityId, opportunities.id), eq(userStatus.userId, userId)))
    .where(
      and(
        isNull(opportunities.parentId),
        gte(opportunities.deadlineAt, from),
        lt(opportunities.deadlineAt, to),
        or(isNull(scores.eligibility), ne(scores.eligibility, "ineligible")),
        or(isNull(userStatus.status), ne(userStatus.status, "skipped")),
      ),
    )
    .orderBy(asc(opportunities.deadlineAt));
}
