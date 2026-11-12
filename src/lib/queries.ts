import "server-only";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { opportunities, opportunityRevisions, profiles, scores, userSettings, userStatus } from "@/db/schema";
import { TRACKING, type Category } from "@/lib/categories";

/**
 * Data access, cached with `use cache`.
 * Tags: "opportunities" (shared data; busted by /api/ingest), `user:<id>` (status/settings/scores),
 * `profile:<id>`. Lists also expire on their own within minutes so writes made outside Next
 * (e.g. scripts/ingest-file) show up without a deploy.
 */
const userTag = (id: string) => `user:${id}`;
const LIST_LIFE = { stale: 60, revalidate: 300, expire: 3600 };

/** Round "now" to 5 minutes so cached lists keyed on it are reused. */
export function nowBucket(d = new Date()): string {
  return new Date(Math.floor(d.getTime() / 300_000) * 300_000).toISOString();
}

export type RegionMode = "focus" | "all";

export const SORTS = ["deadline", "fit", "new", "title"] as const;
export type SortKey = (typeof SORTS)[number];

export type ListFilters = {
  q?: string;
  category?: Category;
  /** default: hide ineligible */
  showIneligible?: boolean;
  /** default: hide past deadlines */
  showArchived?: boolean;
  /** show only items marked "not interested" (status skipped), instead of hiding them */
  showSkipped?: boolean;
  /** hide items scoring below this (unscored items are hidden when > 0) */
  minFit?: number;
  sort?: SortKey;
};

export async function getSettings(userId: string) {
  "use cache";
  cacheTag(userTag(userId));
  cacheLife("max");
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

export async function listOpportunities(userId: string, f: ListFilters, now: string) {
  "use cache";
  cacheTag("opportunities", userTag(userId));
  cacheLife(LIST_LIFE);

  const at = new Date(now);
  const where: SQL[] = [isNull(opportunities.parentId)];
  if (!f.showArchived) where.push(or(isNull(opportunities.deadlineAt), gte(opportunities.deadlineAt, at))!);
  else where.push(lt(opportunities.deadlineAt, at));
  if (!f.showIneligible) where.push(or(isNull(scores.eligibility), ne(scores.eligibility, "ineligible"))!);
  // Region scope comes from the user's settings in the same query, so callers don't wait on it first.
  where.push(or(sql`coalesce(${userSettings.regionMode}, 'focus') = 'all'`, focusRegion)!);
  if (f.category) where.push(eq(opportunities.category, f.category));
  if (f.q) {
    const like = `%${f.q}%`;
    where.push(or(ilike(opportunities.title, like), ilike(opportunities.organizer, like), ilike(opportunities.summary, like))!);
  }
  if (f.showSkipped) where.push(eq(userStatus.status, "skipped"));
  else where.push(or(isNull(userStatus.status), ne(userStatus.status, "skipped"))!);
  if (f.minFit) where.push(gte(scores.score, f.minFit));

  const deadlineOrder = f.showArchived ? desc(opportunities.deadlineAt) : sql`${opportunities.deadlineAt} asc nulls last`;
  const order =
    f.sort === "fit"
      ? [sql`${scores.score} desc nulls last`, deadlineOrder]
      : f.sort === "new"
        ? [desc(opportunities.firstSeenAt), deadlineOrder]
        : f.sort === "title"
          ? [asc(opportunities.title)]
          : [deadlineOrder, desc(scores.score)];

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
    .leftJoin(userSettings, eq(userSettings.userId, userId))
    .leftJoin(scores, and(eq(scores.opportunityId, opportunities.id), eq(scores.userId, userId)))
    .leftJoin(userStatus, and(eq(userStatus.opportunityId, opportunities.id), eq(userStatus.userId, userId)))
    .where(and(...where))
    .orderBy(...order)
    .limit(1000);
}

export type ListItem = Awaited<ReturnType<typeof listOpportunities>>[number];

export async function listTracking(userId: string) {
  "use cache";
  cacheTag("opportunities", userTag(userId));
  cacheLife(LIST_LIFE);
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

/** Deadlines in [from, to). Pass bucketed/day-aligned ISO strings so the cache key is stable. */
export async function deadlinesInRange(userId: string, from: string, to: string) {
  "use cache";
  cacheTag("opportunities", userTag(userId));
  cacheLife(LIST_LIFE);
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
        gte(opportunities.deadlineAt, new Date(from)),
        lt(opportunities.deadlineAt, new Date(to)),
        or(isNull(scores.eligibility), ne(scores.eligibility, "ineligible")),
        or(isNull(userStatus.status), ne(userStatus.status, "skipped")),
      ),
    )
    .orderBy(asc(opportunities.deadlineAt));
}

/** Everything the detail page needs; independent queries run in parallel. */
export async function getOpportunity(id: string, userId: string) {
  "use cache";
  cacheTag("opportunities", `opp:${id}`, userTag(userId));
  cacheLife(LIST_LIFE);

  const [[row], children, revisions] = await Promise.all([
    db
      .select({ o: opportunities, s: scores, st: userStatus })
      .from(opportunities)
      .leftJoin(scores, and(eq(scores.opportunityId, opportunities.id), eq(scores.userId, userId)))
      .leftJoin(userStatus, and(eq(userStatus.opportunityId, opportunities.id), eq(userStatus.userId, userId)))
      .where(eq(opportunities.id, id)),
    db.select().from(opportunities).where(eq(opportunities.parentId, id)).orderBy(asc(opportunities.title)),
    db
      .select()
      .from(opportunityRevisions)
      .where(eq(opportunityRevisions.opportunityId, id))
      .orderBy(desc(opportunityRevisions.createdAt))
      .limit(10),
  ]);
  if (!row) return null;
  const [parent] = row.o.parentId
    ? await db
        .select({ id: opportunities.id, title: opportunities.title })
        .from(opportunities)
        .where(eq(opportunities.id, row.o.parentId))
    : [];
  return { ...row, children, revisions, parent: parent ?? null };
}

export async function getProfile(userId: string) {
  "use cache";
  cacheTag(`profile:${userId}`);
  cacheLife("max");
  const [p] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return p ?? null;
}

/** Aggregate counts for the public landing page (no personal data). */
export async function getPublicStats() {
  "use cache";
  cacheTag("opportunities");
  cacheLife("hours");
  const [r] = await db
    .select({ open: sql<number>`count(*)::int` })
    .from(opportunities)
    .where(and(isNull(opportunities.parentId), or(isNull(opportunities.deadlineAt), gte(opportunities.deadlineAt, sql`now()`))));
  return { open: r?.open ?? 0 };
}
