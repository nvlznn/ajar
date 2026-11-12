import { Inbox } from "lucide-react";
import { FilterBar } from "@/components/filter-bar";
import { OpportunityRow } from "@/components/opportunity-row";
import { CATEGORY_COLOR, type Category } from "@/lib/categories";
import { taipei } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { getDict } from "@/lib/locale";
import { SORTS, listOpportunities, nowBucket, type ListItem, type SortKey } from "@/lib/queries";
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
  // ?category=internship — single category (old multi-value links use the first one)
  const categories = (one("category") ?? "")
    .split(",")
    .slice(0, 1)
    .filter((c): c is Category => c in CATEGORY_COLOR);
  const sortParam = one("sort");
  const sort: SortKey = SORTS.includes(sortParam as SortKey) ? (sortParam as SortKey) : "deadline";
  // Fit threshold in steps of 10 (10–90).
  const fitN = Number(one("fit"));
  const minFit = Number.isInteger(fitN) && fitN >= 10 && fitN <= 90 && fitN % 10 === 0 ? fitN : undefined;

  const now = new Date();
  const items = await listOpportunities(
    user.id,
    {
      q: one("q"),
      categories,
      showIneligible: view === "ineligible",
      showArchived: view === "archived",
      showSkipped: view === "skipped",
      minFit,
      sort,
    },
    nowBucket(now),
  );
  // Month headings only make sense when the list is in deadline order.
  const groups = sort === "deadline" ? groupByMonth(items, t) : [{ label: "", items }];
  const filtered = Boolean(one("q") || categories.length || minFit || view === "skipped");

  return (
    <div>
      <section aria-labelledby="all">
        <div className="flex items-baseline justify-between">
          <h1 id="all" className="text-[34px] font-semibold leading-10 tracking-[-0.02em]">
            {view === "archived" ? t.home.archived : view === "skipped" ? t.filters.skipped : t.home.all}
          </h1>
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
                  <OpportunityRow key={it.id} it={it} t={t} now={now} showMonth={!g.label} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
