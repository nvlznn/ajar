import Link from "next/link";
import { CategoryDot } from "@/components/category-dot";
import { DeadlineRuler } from "@/components/deadline-ruler";
import { FilterBar } from "@/components/filter-bar";
import { OpportunityRow } from "@/components/opportunity-row";
import { CATEGORY_COLOR, type Category } from "@/lib/categories";
import { daysUntil, taipei } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { getDict } from "@/lib/locale";
import { deadlinesInRange, getSettings, listOpportunities, listTracking, type ListItem } from "@/lib/queries";
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
  const user = await requireUser();
  const { t } = await getDict();
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const view = one("view");
  const category = one("category");

  const now = new Date();
  const { regionMode } = await getSettings(user.id);
  const [items, tracking, soon] = await Promise.all([
    listOpportunities(user.id, {
      q: one("q"),
      category: category && category in CATEGORY_COLOR ? (category as Category) : undefined,
      showIneligible: view === "ineligible",
      showArchived: view === "archived",
      regionMode,
    }),
    listTracking(user.id),
    deadlinesInRange(user.id, new Date(now.getTime() - 86_400_000), new Date(now.getTime() + 16 * 86_400_000)),
  ]);
  const soonCount = soon.filter((s) => {
    if (!s.deadlineAt) return false;
    const n = daysUntil(s.deadlineAt, now);
    return n >= 0 && n <= 14;
  }).length;
  const groups = groupByMonth(items, t);

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
          <h2 id="tracking" className="text-[21px] font-semibold leading-7">
            {t.home.tracking}
          </h2>
          <ul className="mt-3 divide-y divide-hairline/70 rounded-xl bg-grouped">
            {tracking.map((it) => {
              const d = it.deadlineAt ? daysUntil(it.deadlineAt, now) : null;
              return (
                <li key={it.id}>
                  <Link href={`/o/${it.id}`} className="flex items-center gap-3 px-4 py-2.5 text-[15px]">
                    <CategoryDot category={it.category} />
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
            {view === "archived" ? t.home.archived : t.home.all}
          </h2>
          <span className="text-[13px] text-muted-foreground tnum">{t.home.count(items.length)}</span>
        </div>
        <div className="mt-4">
          <FilterBar labels={t.filters} categories={t.categories} />
        </div>

        {items.length === 0 ? (
          <p className="mt-12 max-w-md text-[15px] text-muted-foreground">
            {one("q") || category ? t.home.emptyFiltered : t.home.empty}
          </p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="mt-8">
              <h3 className="border-b border-hairline pb-2 text-[13px] font-semibold text-muted-foreground">{g.label}</h3>
              <ul className="divide-y divide-hairline/60">
                {g.items.map((it) => (
                  <OpportunityRow key={it.id} it={it} t={t} now={now} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
