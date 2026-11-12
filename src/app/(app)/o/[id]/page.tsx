import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  Hourglass,
  Link2,
  MapPin,
  Repeat,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BackButton } from "@/components/back-button";
import { CategoryLabel } from "@/components/category-dot";
import { StatusControl } from "@/components/status-control";
import { daysUntil, formatDate, formatStageDate } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { getDict } from "@/lib/locale";
import { getOpportunity } from "@/lib/queries";
import { requireUser } from "@/lib/session";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-[21px] font-semibold leading-7">{title}</h2>
      <div className="mt-3 divide-y divide-hairline/70 rounded-xl bg-grouped">{children}</div>
    </section>
  );
}

function Row({ label, icon: Icon, children }: { label: string; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 px-4 py-3 text-[15px] sm:grid-cols-[168px_minmax(0,1fr)]">
      <div className="flex items-start gap-2 text-muted-foreground">
        {Icon && <Icon aria-hidden className="mt-[3px] size-4 shrink-0" strokeWidth={1.9} />}
        <span>{label}</span>
      </div>
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

export default async function OpportunityPage({ params }: PageProps<"/o/[id]">) {
  const [user, { t, locale }, { id }] = await Promise.all([requireUser(), getDict(), params]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const data = await getOpportunity(id, user.id);
  if (!data) notFound();
  const { o, s, st, children, revisions, parent } = data;
  const L = t.detail;

  // Agent-written content: prefer the UI language, fall back to whichever exists.
  const summary = locale === "en" ? (o.summaryEn ?? o.summary) : (o.summary ?? o.summaryEn);
  const reason = s ? (locale === "en" ? (s.reasonEn ?? s.reason) : (s.reason ?? s.reasonEn)) : null;

  const days = o.deadlineAt ? daysUntil(o.deadlineAt) : null;
  const urgent = days !== null && days >= 0 && days <= 3;
  const elig = o.eligibility;
  const comp = o.compensation;
  const ts = elig?.team_size;
  const teamSize =
    ts && (ts.min || ts.max)
      ? ts.min === ts.max
        ? L.teamExact(ts.min!)
        : L.teamRange(ts.min ?? 1, ts.max ? String(ts.max) : L.unlimited)
      : null;
  const eligLabel = s ? (t.eligibility[s.eligibility as keyof Dict["eligibility"]] ?? s.eligibility) : "";

  return (
    <article className="max-w-[720px]">
      <BackButton href={parent ? `/o/${parent.id}` : "/"} label={parent ? parent.title : L.back} />

      <div className="mt-6 text-[13px] text-muted-foreground">
        <CategoryLabel category={o.category} label={t.categories[o.category]} />
      </div>
      <h1 className="mt-2 text-[34px] font-semibold leading-[40px] tracking-[-0.02em]">{o.title}</h1>
      {o.organizer && <p className="mt-2 text-[17px] text-muted-foreground">{o.organizer}</p>}

      <div className="mt-6 space-y-1.5 text-[17px] leading-7">
        <p className="flex items-start gap-2">
          <Clock aria-hidden className={`mt-1.5 size-4 shrink-0 ${urgent ? "text-urgent" : "text-muted-foreground"}`} strokeWidth={2} />
          {o.deadlineAt ? (
            <span>
              <span className="font-semibold">{L.due(formatDate(o.deadlineAt, true), o.deadlineEstimated)}</span>
              {days !== null && (
                <>
                  {t.common.listSep}
                  <span className={urgent ? "text-urgent" : "text-muted-foreground"}>{t.relative(days)}</span>
                </>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{L.rollingNote}</span>
          )}
        </p>
        {o.prepDays ? (
          <p className="flex items-start gap-2 text-muted-foreground">
            <Hourglass aria-hidden className="mt-1.5 size-4 shrink-0" strokeWidth={2} />
            <span>{L.prep(o.prepDays).replace(/^[。.]\s*/, "")}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={o.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1 rounded-full bg-tint pl-5 pr-4 text-[15px] font-medium text-white hover:opacity-90"
        >
          {L.open}
          <ArrowUpRight aria-hidden className="size-4" strokeWidth={2.25} />
        </a>
        <StatusControl opportunityId={o.id} status={st?.status ?? null} labels={t.status} />
      </div>

      {s && (
        <section className="mt-10 flex gap-5">
          <div className="text-[40px] font-semibold leading-none tracking-tight tnum">{s.score}</div>
          <div className="pt-0.5">
            <div className="text-[15px] font-medium">{L.fit(eligLabel)}</div>
            {reason && <p className="mt-1 text-[15px] leading-[22px] text-muted-foreground">{reason}</p>}
          </div>
        </section>
      )}

      {summary && <p className="mt-10 text-[17px] leading-7">{summary}</p>}

      {o.stages.length > 0 && (
        <Group title={L.timeline}>
          {o.stages.map((stage, i) => (
            <Row key={i} label={stage.label}>
              <span className="tnum">
                {formatStageDate(stage.start)}
                {stage.end ? `${L.to}${formatStageDate(stage.end)}` : ""}
              </span>
              {stage.estimated && <span className="ml-2 text-muted-foreground">{t.common.estimated}</span>}
            </Row>
          ))}
        </Group>
      )}

      {(elig?.text || teamSize || elig?.nationality) && (
        <Group title={L.eligibility}>
          {elig?.text && <Row label={L.conditions}>{elig.text}</Row>}
          {elig?.nationality && (
            <Row label={L.nationality} icon={Globe}>
              {elig.nationality}
            </Row>
          )}
          {teamSize && (
            <Row label={L.team} icon={Users}>
              {teamSize}
            </Row>
          )}
        </Group>
      )}

      {comp && (comp.prize || comp.salary || comp.travel_support || comp.fee) && (
        <Group title={L.money}>
          {comp.prize && <Row label={L.prize}>{comp.prize}</Row>}
          {comp.salary && <Row label={L.salary}>{comp.salary}</Row>}
          {comp.travel_support && <Row label={L.travel}>{comp.travel_support}</Row>}
          {comp.fee && <Row label={L.fee}>{comp.fee}</Row>}
        </Group>
      )}

      {o.requirements.length > 0 && (
        <Group title={L.prepare}>
          {o.requirements.map((r) => (
            <Row key={r} label={L.requirements[r] ?? L.other} icon={FileText}>
              {L.requirements[r] ? <span className="text-muted-foreground">{L.needed}</span> : r.replace(/^other:\s*/, "")}
            </Row>
          ))}
        </Group>
      )}

      {children.length > 0 && (
        <Group title={L.children(children.length)}>
          {children.map((c) => (
            <Link key={c.id} href={`/o/${c.id}`} className="flex items-center gap-3 px-4 py-3 text-[15px] hover:text-tint">
              <span className="min-w-0 flex-1">
                {c.title}
                {(locale === "en" ? (c.summaryEn ?? c.summary) : (c.summary ?? c.summaryEn)) && (
                  <span className="mt-0.5 block text-[13px] text-muted-foreground">
                    {locale === "en" ? (c.summaryEn ?? c.summary) : (c.summary ?? c.summaryEn)}
                  </span>
                )}
              </span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Group>
      )}

      <Group title={L.source}>
        <Row label={L.location} icon={o.locationMode === "online" ? Globe : MapPin}>
          {o.locationMode === "online"
            ? t.common.online
            : [o.city, o.country].filter(Boolean).join(t.common.listSep) || L.unknownLocation}
        </Row>
        {o.sourceUrl && o.sourceUrl !== o.url && (
          <Row label={L.from} icon={Link2}>
            <a
              href={o.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-tint hover:underline"
            >
              {new URL(o.sourceUrl).hostname.replace(/^www\./, "")}
              <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
          </Row>
        )}
        <Row label={L.verified} icon={BadgeCheck}>
          <span className="tnum">{formatDate(o.lastVerifiedAt, true)}</span>
          {o.confidence === "low" && (
            <span className="mt-1 flex items-start gap-1.5 text-[13px] leading-[18px] text-muted-foreground">
              <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0 text-cat-orange" strokeWidth={2} />
              {L.lowConfidence}
            </span>
          )}
        </Row>
        {o.recurringAnnual && (
          <Row label={L.cycle} icon={Repeat}>
            {L.annual}
          </Row>
        )}
      </Group>

      {revisions.length > 0 && (
        <Group title={L.history}>
          {revisions.map((r) => (
            <Row key={r.id} label={formatDate(r.createdAt, true)}>
              {r.action === "create"
                ? L.created
                : L.updated(
                    Object.keys((r.after as object) ?? {})
                      .map((k) => L.fields[k] ?? k)
                      .join(L.fieldSep),
                  )}
              <span className="ml-2 text-[13px] text-muted-foreground">{r.source}</span>
            </Row>
          ))}
        </Group>
      )}
    </article>
  );
}
