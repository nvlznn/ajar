import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { opportunities } from "@/db/schema";
import { ingest } from "@/lib/ingest";

function authorized(req: NextRequest): boolean {
  const expected = process.env.INGEST_TOKEN;
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

/** Agents/scrapers push items here. Body: { source: string, items: OpportunityInput[] } */
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { source?: unknown; items?: unknown } | null;
  if (!body || typeof body.source !== "string" || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "expected { source: string, items: [] }" }, { status: 400 });
  }
  if (body.items.length > 500) {
    return NextResponse.json({ error: "max 500 items per request" }, { status: 413 });
  }
  return NextResponse.json(await ingest(body.items, body.source));
}

/** Lightweight index of what's already stored — lets agents dedupe and pick items to re-verify. */
export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const rows = await db
    .select({
      key: opportunities.key,
      title: opportunities.title,
      category: opportunities.category,
      url: opportunities.url,
      deadlineAt: opportunities.deadlineAt,
      deadlineEstimated: opportunities.deadlineEstimated,
      lastVerifiedAt: opportunities.lastVerifiedAt,
    })
    .from(opportunities)
    .orderBy(asc(opportunities.deadlineAt));
  return NextResponse.json({ count: rows.length, items: rows });
}
