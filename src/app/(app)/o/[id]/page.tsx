import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { CategoryLabel } from "@/components/category-dot";
import { StatusControl } from "@/components/status-control";
import { db } from "@/db";
import { opportunities, opportunityRevisions, scores, userStatus } from "@/db/schema";
import { ELIGIBILITY_LABEL } from "@/lib/categories";
import { daysUntil, formatDate, formatStageDate, relativeDays } from "@/lib/format";
import { requireUser } from "@/lib/session";

const REQUIREMENT_LABEL: Record<string, string> = {
  resume: "履歷",
  recommendation: "推薦信",
  portfolio: "作品集",
  proposal: "提案或企劃書",
  transcript: "成績單",
  language_test: "語言成績",
  essay: "申請短文",
  interview: "面試",
};

const FIELD_LABEL: Record<string, string> = {
  title: "名稱",
  stages: "時程",
  deadlineAt: "截止日",
  deadlineEstimated: "預估標記",
  summary: "簡介",
  url: "連結",
  eligibility: "資格",
  compensation: "報酬與費用",
  requirements: "準備資料",
  prepDays: "準備天數",
  organizer: "主辦單位",
  tags: "標籤",
};

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[21px] font-semibold leading-7">{title}</h2>
      <div className="mt-3 divide-y divide-hairline/70 rounded-xl bg-grouped">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 px-4 py-3 text-[15px] sm:grid-cols-[140px_minmax(0,1fr)]">
      <div className="text-muted-foreground">{label}</div>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

export default async function OpportunityPage({ params }: PageProps<"/o/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [row] = await db
    .select({ o: opportunities, s: scores, st: userStatus })
    .from(opportunities)
    .leftJoin(scores, and(eq(scores.opportunityId, opportunities.id), eq(scores.userId, user.id)))
    .leftJoin(userStatus, and(eq(userStatus.opportunityId, opportunities.id), eq(userStatus.userId, user.id)))
    .where(eq(opportunities.id, id));
  if (!row) notFound();
  const { o, s, st } = row;

  const [children, revisions, parent] = await Promise.all([
    db.select().from(opportunities).where(eq(opportunities.parentId, o.id)).orderBy(asc(opportunities.title)),
    db
      .select()
      .from(opportunityRevisions)
      .where(eq(opportunityRevisions.opportunityId, o.id))
      .orderBy(desc(opportunityRevisions.createdAt))
      .limit(10),
    o.parentId
      ? db.select({ id: opportunities.id, title: opportunities.title }).from(opportunities).where(eq(opportunities.id, o.parentId))
      : Promise.resolve([]),
  ]);

  const days = o.deadlineAt ? daysUntil(o.deadlineAt) : null;
  const elig = o.eligibility;
  const comp = o.compensation;
  const teamSize =
    elig?.team_size && (elig.team_size.min || elig.team_size.max)
      ? elig.team_size.min === elig.team_size.max
        ? `${elig.team_size.min} 人`
        : `${elig.team_size.min ?? 1}–${elig.team_size.max ?? "不限"} 人`
      : null;

  return (
    <article className="max-w-[720px]">
      <Link
        href={parent[0] ? `/o/${parent[0].id}` : "/"}
        className="text-[13px] text-tint hover:underline"
      >
        {parent[0] ? parent[0].title : "所有機會"}
      </Link>

      <div className="mt-6 text-[13px] text-muted-foreground">
        <CategoryLabel category={o.category} />
      </div>
      <h1 className="mt-2 text-[34px] font-semibold leading-[40px] tracking-[-0.02em]">{o.title}</h1>
      {o.organizer && <p className="mt-2 text-[17px] text-muted-foreground">{o.organizer}</p>}

      <p className="mt-6 text-[17px] leading-7">
        {o.deadlineAt ? (
          <>
            {o.deadlineEstimated ? "預估" : ""}
            <span className="font-semibold">{formatDate(o.deadlineAt, true)}</span> 截止
            {days !== null && (
              <span className={days >= 0 && days <= 3 ? "text-urgent" : "text-muted-foreground"}>
                {"，"}
                {relativeDays(days)}
              </span>
            )}
            {o.prepDays ? <span className="text-muted-foreground">。大約需要 {o.prepDays} 天準備</span> : null}
          </>
        ) : (
          <span className="text-muted-foreground">沒有固定截止日，隨時可以申請。</span>
        )}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={o.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center rounded-full bg-tint px-5 text-[15px] font-medium text-white hover:opacity-90"
        >
          前往官方頁面
        </a>
        <StatusControl opportunityId={o.id} status={st?.status ?? null} />
      </div>

      {s && (
        <section className="mt-10 flex gap-5">
          <div className="text-[40px] font-semibold leading-none tracking-tight tnum">{s.score}</div>
          <div className="pt-0.5">
            <div className="text-[15px] font-medium">適合度，{ELIGIBILITY_LABEL[s.eligibility] ?? s.eligibility}資格</div>
            {s.reason && <p className="mt-1 text-[15px] leading-[22px] text-muted-foreground">{s.reason}</p>}
          </div>
        </section>
      )}

      {o.summary && <p className="mt-10 text-[17px] leading-7">{o.summary}</p>}

      {o.stages.length > 0 && (
        <Group title="時程">
          {o.stages.map((stage, i) => (
            <Row key={i} label={stage.label}>
              <span className="tnum">
                {formatStageDate(stage.start)}
                {stage.end ? ` 至 ${formatStageDate(stage.end)}` : ""}
              </span>
              {stage.estimated && <span className="ml-2 text-muted-foreground">預估</span>}
            </Row>
          ))}
        </Group>
      )}

      {(elig?.text || teamSize || elig?.nationality) && (
        <Group title="資格">
          {elig?.text && <Row label="條件">{elig.text}</Row>}
          {elig?.nationality && <Row label="國籍">{elig.nationality}</Row>}
          {teamSize && <Row label="組隊">{teamSize}</Row>}
        </Group>
      )}

      {comp && (comp.prize || comp.salary || comp.travel_support || comp.fee) && (
        <Group title="報酬與費用">
          {comp.prize && <Row label="獎金">{comp.prize}</Row>}
          {comp.salary && <Row label="薪資或津貼">{comp.salary}</Row>}
          {comp.travel_support && <Row label="旅費補助">{comp.travel_support}</Row>}
          {comp.fee && <Row label="費用">{comp.fee}</Row>}
        </Group>
      )}

      {o.requirements.length > 0 && (
        <Group title="要準備的東西">
          {o.requirements.map((r) => (
            <Row key={r} label={REQUIREMENT_LABEL[r] ?? "其他"}>
              {REQUIREMENT_LABEL[r] ? <span className="text-muted-foreground">需要</span> : r.replace(/^other:\s*/, "")}
            </Row>
          ))}
        </Group>
      )}

      {children.length > 0 && (
        <Group title={`可選項目（${children.length}）`}>
          {children.map((c) => (
            <Link key={c.id} href={`/o/${c.id}`} className="block px-4 py-3 text-[15px] hover:text-tint">
              {c.title}
              {c.summary && <span className="mt-0.5 block text-[13px] text-muted-foreground">{c.summary}</span>}
            </Link>
          ))}
        </Group>
      )}

      <Group title="資料來源">
        <Row label="地點">
          {o.locationMode === "online" ? "線上" : [o.city, o.country].filter(Boolean).join("，") || "未標示"}
        </Row>
        {o.sourceUrl && o.sourceUrl !== o.url && (
          <Row label="來源">
            <a href={o.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-tint hover:underline">
              {new URL(o.sourceUrl).hostname}
            </a>
          </Row>
        )}
        <Row label="最後確認">
          <span className="tnum">{formatDate(o.lastVerifiedAt, true)}</span>
          {o.confidence === "low" && <span className="ml-2 text-muted-foreground">未從官方頁面確認，請再核對</span>}
        </Row>
        {o.recurringAnnual && <Row label="週期">每年舉辦</Row>}
      </Group>

      {revisions.length > 0 && (
        <Group title="變更紀錄">
          {revisions.map((r) => (
            <Row key={r.id} label={formatDate(r.createdAt, true)}>
              {r.action === "create"
                ? "收錄"
                : `更新${Object.keys((r.after as object) ?? {})
                    .map((k) => FIELD_LABEL[k] ?? k)
                    .join("、")}`}
              <span className="ml-2 text-[13px] text-muted-foreground">{r.source}</span>
            </Row>
          ))}
        </Group>
      )}
    </article>
  );
}
