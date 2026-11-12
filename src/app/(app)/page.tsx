import Link from "next/link";
import { CategoryDot } from "@/components/category-dot";
import { DeadlineRuler } from "@/components/deadline-ruler";
import { FilterBar } from "@/components/filter-bar";
import { OpportunityRow } from "@/components/opportunity-row";
import { CATEGORY_META, STATUS_LABEL, type Category } from "@/lib/categories";
import { daysUntil, relativeDays, taipei } from "@/lib/format";
import { deadlinesInRange, getSettings, listOpportunities, listTracking, type ListItem } from "@/lib/queries";
import { requireUser } from "@/lib/session";

function groupByMonth(items: ListItem[]) {
  const groups = new Map<string, { label: string; items: ListItem[] }>();
  for (const it of items) {
    let key = "rolling";
    let label = "沒有固定截止日";
    if (it.deadlineAt) {
      const t = taipei(it.deadlineAt);
      key = `${t.y}-${String(t.m).padStart(2, "0")}`;
      label = t.y === taipei(new Date()).y ? `${t.m} 月` : `${t.y} 年 ${t.m} 月`;
    }
    if (!groups.has(key)) groups.set(key, { label, items: [] });
    groups.get(key)!.items.push(it);
  }
  return [...groups.values()];
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const view = one("view");
  const category = one("category");

  const now = new Date();
  const { regionMode } = await getSettings(user.id);
  const [items, tracking, soon] = await Promise.all([
    listOpportunities(user.id, {
      q: one("q"),
      category: category && category in CATEGORY_META ? (category as Category) : undefined,
      showIneligible: view === "ineligible",
      showArchived: view === "archived",
      regionMode,
    }),
    listTracking(user.id),
    deadlinesInRange(user.id, new Date(now.getTime() - 86_400_000), new Date(now.getTime() + 16 * 86_400_000)),
  ]);
  const soonCount = soon.filter((s) => s.deadlineAt && daysUntil(s.deadlineAt, now) >= 0 && daysUntil(s.deadlineAt, now) <= 14).length;
  const groups = groupByMonth(items);

  return (
    <div>
      <section aria-labelledby="next-14">
        <h1 id="next-14" className="text-[34px] font-semibold leading-10 tracking-[-0.02em]">
          接下來 14 天
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          {soonCount ? `${soonCount} 個截止日。點一下圓點看是哪一個。` : "這兩週沒有截止日。"}
        </p>
        <div className="mt-8">
          <DeadlineRuler items={soon} now={now} />
        </div>
      </section>

      {tracking.length > 0 && (
        <section aria-labelledby="tracking" className="mt-14">
          <h2 id="tracking" className="text-[21px] font-semibold leading-7">
            追蹤中
          </h2>
          <ul className="mt-3 divide-y divide-hairline/70 rounded-xl bg-grouped">
            {tracking.map((t) => {
              const d = t.deadlineAt ? daysUntil(t.deadlineAt, now) : null;
              return (
                <li key={t.id}>
                  <Link href={`/o/${t.id}`} className="flex items-center gap-3 px-4 py-2.5 text-[15px]">
                    <CategoryDot category={t.category} />
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <span className="shrink-0 text-[13px] text-tint">{t.status && STATUS_LABEL[t.status]}</span>
                    <span
                      className={`w-16 shrink-0 text-right text-[13px] tnum ${d !== null && d >= 0 && d <= 3 ? "text-urgent" : "text-muted-foreground"}`}
                    >
                      {d !== null ? relativeDays(d) : "隨時"}
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
            {view === "archived" ? "已截止" : "所有機會"}
          </h2>
          <span className="text-[13px] text-muted-foreground tnum">{items.length} 項</span>
        </div>
        <div className="mt-4">
          <FilterBar regionMode={regionMode} />
        </div>

        {items.length === 0 ? (
          <p className="mt-12 max-w-md text-[15px] text-muted-foreground">
            {one("q") || category
              ? "沒有符合篩選條件的機會。試著清除搜尋或換一個類別。"
              : "還沒有任何機會。第一次搜尋完成、寫入資料庫後，會依截止日排在這裡。"}
          </p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="mt-8">
              <h3 className="border-b border-hairline pb-2 text-[13px] font-semibold text-muted-foreground">
                {g.label}
              </h3>
              <ul className="divide-y divide-hairline/60">
                {g.items.map((it) => (
                  <OpportunityRow key={it.id} it={it} now={now} />
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
