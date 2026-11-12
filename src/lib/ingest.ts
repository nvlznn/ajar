import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { opportunities, opportunityRevisions, scores, user, type Stage } from "@/db/schema";
import { allowedEmails } from "@/lib/owner";
import { opportunityInput, type OpportunityInput } from "@/lib/opportunity-input";

export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    for (const k of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|ref$|ref_src$)/i.test(k)) u.searchParams.delete(k);
    }
    u.searchParams.sort();
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.hostname}${path}${u.search}`;
  } catch {
    return raw.trim().toLowerCase();
  }
}

/** Date-only strings are interpreted in Asia/Taipei; deadlines default to end of that day. */
export function toInstant(s: string, endOfDay: boolean): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T${endOfDay ? "23:59:59" : "00:00:00"}+08:00`);
  }
  return new Date(s.replace(" ", "T"));
}

export function deriveDeadline(stages: Stage[]): { at: Date | null; estimated: boolean } {
  const regs = stages.filter((s) => s.kind === "registration_deadline");
  if (!regs.length) return { at: null, estimated: false };
  let best: { at: Date; estimated: boolean } | null = null;
  for (const s of regs) {
    const at = toInstant(s.end ?? s.start, true);
    if (Number.isNaN(at.getTime())) continue;
    if (!best || at > best.at) best = { at, estimated: !!s.estimated };
  }
  return best ?? { at: null, estimated: false };
}

function stableStringify(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (v instanceof Date) return JSON.stringify(v.toISOString());
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([, x]) => x !== null && x !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, x]) => `${JSON.stringify(k)}:${stableStringify(x)}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

const normTitle = (t: string) => t.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");

/** Same opportunity if one normalized title contains the other (tolerates small edits/suffixes). */
export function sameTitle(a: string, b: string): boolean {
  const x = normTitle(a);
  const y = normTitle(b);
  return x === y || x.includes(y) || y.includes(x);
}

const isEmpty = (v: unknown) =>
  v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

type Row = Omit<typeof opportunities.$inferInsert, "id" | "firstSeenAt" | "lastVerifiedAt" | "updatedAt">;
const COMPARED: (keyof Row)[] = [
  "parentId",
  "title",
  "category",
  "organizer",
  "url",
  "sourceUrl",
  "summary",
  "locationMode",
  "country",
  "city",
  "language",
  "stages",
  "deadlineAt",
  "deadlineEstimated",
  "eligibility",
  "compensation",
  "requirements",
  "prepDays",
  "recurringAnnual",
  "tags",
  "confidence",
];

function toRow(item: OpportunityInput, key: string, parentId: string | null): Row {
  const stages = (item.stages ?? []).map((s) => ({
    kind: s.kind,
    label: s.label,
    start: s.start,
    end: s.end ?? null,
    estimated: !!s.estimated,
  })) as Stage[];
  const deadline = deriveDeadline(stages);
  return {
    key,
    parentId,
    title: item.title.trim(),
    category: item.category,
    organizer: item.organizer ?? null,
    url: item.url,
    sourceUrl: item.source_url ?? null,
    summary: item.summary ?? null,
    locationMode: item.location?.mode ?? null,
    country: item.location?.country?.toUpperCase() ?? null,
    city: item.location?.city ?? null,
    language: item.language ?? null,
    stages,
    deadlineAt: deadline.at,
    deadlineEstimated: deadline.estimated,
    eligibility: item.eligibility ?? null,
    compensation: item.compensation ?? null,
    requirements: item.requirements ?? [],
    prepDays: item.prep_days_estimate ?? null,
    recurringAnnual: !!item.recurring_annual,
    tags: item.tags ?? [],
    confidence: item.confidence ?? null,
  };
}

async function ownerUserId(): Promise<string | null> {
  const email = allowedEmails()[0];
  if (!email) return null;
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  return row?.id ?? null;
}

export type IngestResult = {
  created: number;
  updated: number;
  unchanged: number;
  errors: { index: number; title?: string; error: string }[];
};

export async function ingest(rawItems: unknown[], source: string): Promise<IngestResult> {
  const result: IngestResult = { created: 0, updated: 0, unchanged: 0, errors: [] };
  const owner = await ownerUserId();

  const parsed: { index: number; item: OpportunityInput }[] = [];
  rawItems.forEach((raw, index) => {
    const r = opportunityInput.safeParse(raw);
    if (r.success) parsed.push({ index, item: r.data });
    else
      result.errors.push({
        index,
        title: (raw as { title?: string })?.title,
        error: r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      });
  });
  // Parents first so children can resolve parent_key.
  parsed.sort((a, b) => Number(!!a.item.parent_key) - Number(!!b.item.parent_key));

  for (const { index, item } of parsed) {
    try {
      let key = item.key?.trim() || normalizeUrl(item.url);
      if (!item.key?.trim()) {
        // Listing pages (e.g. a school's scholarship index) host many distinct opportunities under one URL.
        // If the URL key is taken by a clearly different title, key this item by URL + title instead.
        const [taken] = await db
          .select({ title: opportunities.title })
          .from(opportunities)
          .where(eq(opportunities.key, key));
        if (taken && !sameTitle(taken.title, item.title)) key = `${key}#${normTitle(item.title)}`;
      }
      let parentId: string | null = null;
      if (item.parent_key) {
        const pk = item.parent_key.includes("://") ? normalizeUrl(item.parent_key) : item.parent_key;
        const [p] = await db.select({ id: opportunities.id }).from(opportunities).where(eq(opportunities.key, pk));
        parentId = p?.id ?? null;
      }
      const incoming = toRow(item, key, parentId);
      const [existing] = await db.select().from(opportunities).where(eq(opportunities.key, key));

      let id: string;
      if (!existing) {
        const [ins] = await db.insert(opportunities).values(incoming).returning({ id: opportunities.id });
        id = ins.id;
        await db.insert(opportunityRevisions).values({ opportunityId: id, action: "create", after: incoming, source });
        result.created++;
      } else {
        id = existing.id;
        const merged = { ...incoming } as Record<string, unknown>;
        const before: Record<string, unknown> = {};
        const after: Record<string, unknown> = {};
        for (const f of COMPARED) {
          if (isEmpty(merged[f])) merged[f] = existing[f as keyof typeof existing];
          if (stableStringify(merged[f]) !== stableStringify(existing[f as keyof typeof existing])) {
            before[f] = existing[f as keyof typeof existing];
            after[f] = merged[f];
          }
        }
        if (Object.keys(after).length) {
          await db
            .update(opportunities)
            .set({ ...(merged as Row), lastVerifiedAt: sql`now()`, updatedAt: sql`now()` })
            .where(eq(opportunities.id, id));
          await db.insert(opportunityRevisions).values({ opportunityId: id, action: "update", before, after, source });
          result.updated++;
        } else {
          await db.update(opportunities).set({ lastVerifiedAt: sql`now()` }).where(eq(opportunities.id, id));
          result.unchanged++;
        }
      }

      if (item.fit && owner) {
        const values = {
          userId: owner,
          opportunityId: id,
          eligibility: item.fit.eligibility,
          score: Math.round(item.fit.score),
          reason: item.fit.reason ?? null,
        };
        await db
          .insert(scores)
          .values(values)
          .onConflictDoUpdate({
            target: [scores.userId, scores.opportunityId],
            set: { ...values, updatedAt: sql`now()` },
          });
      }
    } catch (e) {
      result.errors.push({ index, title: item.title, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}
