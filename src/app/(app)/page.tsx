import Link from "next/link";
import { CategoryIcon } from "@/components/category-dot";
import { Inbox, Star } from "lucide-react";
import { DeadlineRuler } from "@/components/deadline-ruler";
import { FilterBar } from "@/components/filter-bar";
import { OpportunityRow } from "@/components/opportunity-row";
import { CATEGORY_COLOR, type Category } from "@/lib/categories";
import { daysUntil, taipei, taipeiDayStart } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { getDict } from "@/lib/locale";
import { SORTS, deadlinesInRange, listOpportunities, listTracking, nowBucket, type ListItem, type SortKey } from "@/lib/queries";
import { requireUser } from "@/lib/session";

function groupByMonth(items: ListItem[], t: Dict) {
  const thisYear = taipei(new Date()).y;
  const groups = new Map<string, { label: string; items: ListItem[] }>();
  for (const it of items) {
    let key = "rolling";
    let label = t.home.rolling;
    if (it.deadlineAt) {
      const d = taipei(it.deadlineAt);
      key = `${d.y}-${String(d.m).padStart(2, "0")}`;
      label = t.monthHeading(d.y, d.m, d.y === thisYear);
    }
    if (!groups.has(key)) groups.set(key, { label, items: [] });
    groups.get(key)!.items.push(it);
  }
  return [...groups.values()];
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const [user, { t }, sp] = await Promise.all([requireUser(), getDict(), searchParams]);
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const view = one("view");
  const category = one("category");
  const sortParam = one("sort");
  const sort: SortKey = SORTS.includes(sortParam as SortKey) ? (sortParam as SortKey) : "deadline";
  const minFit = [40, 60, 80].includes(Number(one("fit"))) ? Number(one("fit")) : undefined;

  const now = new Date();
  const [items, tracking, soon] = await Promise.all([
    listOpportunities(
      user.id,
      {
        q: one("q"),
        category: category && category in CATEGORY_COLOR ? (category as Category) : undefined,
        showIneligible: view === "ineligible",
        showArchived: view === "archived",
        showSkipped: view === "skipped",
        minFit,
        sort,
      },
      nowBucket(now),
    ),
    listTracking(user.id),
    deadlinesInRange(user.id, taipeiDayStart(0, now), taipeiDayStart(15, now)),
  ]);
  const soonCount = soon.filter((s) => {
    if (!s.deadlineAt) return false;
    const n = daysUntil(s.deadlineAt, now);
    return n >= 0 && n <= 14;
  }).length;
  // Month headings only make sense when the list is in deadline order.
  const groups = sort === "deadline" ? groupByMonth(items, t) : [{ label: "", items }];
  const filtered = Boolean(one("q") || category || minFit || view === "skipped");

  return (
    <div>
      <section aria-labelledby="next-14">
        <h1 id="next-14" className="text-[34px] font-semibold leading-10 tracking-[-0.02em]">
          {t.home.title}
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">{t.home.soon(soonCount)}</p>
        <div className="mt-8">
          <DeadlineRuler items={soon} t={t} now={now} />
        </div>
      </section>

      {tracking.length > 0 && (
        <section aria-labelledby="tracking" className="mt-14">
          <h2 id="tracking" className="flex items-center gap-2 text-[21px] font-semibold leading-7">
            <Star aria-hidden className="size-5 text-tint" strokeWidth={2} fill="currentColor" />
            {t.home.tracking}
          </h2>
          <ul className="mt-3 divide-y divide-hairline/70 rounded-xl bg-grouped">
            {tracking.map((it) => {
              const d = it.deadlineAt ? daysUntil(it.deadlineAt, now) : null;
              return (
                <li key={it.id}>
                  <Link href={`/o/${it.id}`} className="flex items-center gap-3 px-4 py-2.5 text-[15px]">
                    <CategoryIcon category={it.category} />
                    <span className="min-w-0 flex-1 truncate">{it.title}</span>
                    <span className="shrink-0 text-[13px] text-tint">{it.status && t.status[it.status]}</span>
                    <span
                      className={`w-20 shrink-0 text-right text-[13px] tnum ${d !== null && d >= 0 && d <= 3 ? "text-urgent" : "text-muted-foreground"}`}
                    >
                      {d !== null ? t.relative(d) : t.common.anytime}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="all" className="mt-14">
        <div className="flex items-baseline justify-between">
          <h2 id="all" className="text-[21px] font-semibold leading-7">
            {view === "archived" ? t.home.archived : view === "skipped" ? t.filters.skipped : t.home.all}
          </h2>
          <span className="text-[13px] text-muted-foreground tnum">{t.home.count(items.length)}</span>
        </div>
        <div className="mt-4">
          <FilterBar labels={t.filters} categories={t.categories} />
        </div>

        {items.length === 0 ? (
          <div className="mt-12 flex max-w-md items-start gap-3 text-[15px] text-muted-foreground">
            <Inbox aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
            <p>{filtered ? t.home.emptyFiltered : t.home.empty}</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.label || "all"} className="mt-8">
              {g.label && (
                <h3 className="border-b border-hairline pb-2 text-[13px] font-semibold text-muted-foreground">
                  {g.label}
                </h3>
              )}
              <ul className={g.label ? "divide-y divide-hairline/60" : "divide-y divide-hairline/60 border-t border-hairline"}>
                {g.items.map((it) => (
                  <OpportunityRow key={it.id} it={it} t={t} now={now} restore={view === "skipped"} showMonth={!g.label} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
