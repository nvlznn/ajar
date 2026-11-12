import Link from "next/link";
import { CategoryDot } from "@/components/category-dot";
import { taipei } from "@/lib/format";
import { deadlinesInRange } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "月曆" };

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const pad = (n: number) => String(n).padStart(2, "0");

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = taipei(new Date());
  const m = typeof sp.m === "string" && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : `${today.y}-${pad(today.m)}`;
  const [y, mo] = m.split("-").map(Number);

  const start = new Date(`${y}-${pad(mo)}-01T00:00:00+08:00`);
  const ny = mo === 12 ? y + 1 : y;
  const nm = mo === 12 ? 1 : mo + 1;
  const end = new Date(`${ny}-${pad(nm)}-01T00:00:00+08:00`);
  const py = mo === 1 ? y - 1 : y;
  const pm = mo === 1 ? 12 : mo - 1;

  const items = await deadlinesInRange(user.id, start, end);
  const byDay = new Map<number, typeof items>();
  for (const it of items) {
    const d = taipei(it.deadlineAt!).d;
    byDay.set(d, [...(byDay.get(d) ?? []), it]);
  }

  const firstDow = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const isThisMonth = today.y === y && today.m === mo;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-[34px] font-semibold leading-10 tracking-[-0.02em]">
          {y} 年 {mo} 月
        </h1>
        <nav className="flex items-center gap-4 text-[15px] text-tint" aria-label="切換月份">
          <Link href={`/calendar?m=${py}-${pad(pm)}`}>上個月</Link>
          {!isThisMonth && <Link href="/calendar">今天</Link>}
          <Link href={`/calendar?m=${ny}-${pad(nm)}`}>下個月</Link>
        </nav>
      </div>
      <p className="mt-1 text-[15px] text-muted-foreground">
        {items.length ? `這個月有 ${items.length} 個截止日。` : "這個月沒有截止日。"}
      </p>

      <div className="mt-8 grid grid-cols-7 border-t border-hairline text-[13px]">
        {WEEK.map((w) => (
          <div key={w} className="py-2 text-right text-[12px] text-muted-foreground sm:pr-2">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          const list = d ? (byDay.get(d) ?? []) : [];
          const isToday = isThisMonth && d === today.d;
          return (
            <div key={i} className="min-h-14 border-t border-hairline/70 px-0.5 py-1.5 sm:min-h-28 sm:px-1.5">
              {d && (
                <>
                  <div className="flex justify-end">
                    <span
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-full tnum",
                        isToday && "bg-urgent font-semibold text-white",
                      )}
                    >
                      {d}
                    </span>
                  </div>
                  <ul className="mt-1 hidden space-y-0.5 sm:block">
                    {list.slice(0, 4).map((it) => (
                      <li key={it.id}>
                        <Link
                          href={`/o/${it.id}`}
                          title={it.title}
                          className="flex items-center gap-1.5 rounded px-1 leading-5 hover:bg-grouped"
                        >
                          <CategoryDot category={it.category} className="size-1.5" />
                          <span className="truncate">{it.title}</span>
                        </Link>
                      </li>
                    ))}
                    {list.length > 4 && <li className="px-1 text-muted-foreground">還有 {list.length - 4} 項</li>}
                  </ul>
                  <div className="mt-1 flex flex-wrap justify-end gap-0.5 sm:hidden">
                    {list.slice(0, 6).map((it) => (
                      <CategoryDot key={it.id} category={it.category} className="size-1.5" />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Phones get the month as a list under the grid. */}
      {items.length > 0 && (
        <ul className="mt-8 divide-y divide-hairline/70 sm:hidden">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={`/o/${it.id}`} className="flex items-center gap-3 py-2.5 text-[15px]">
                <span className="w-10 shrink-0 text-muted-foreground tnum">{taipei(it.deadlineAt!).d} 日</span>
                <CategoryDot category={it.category} />
                <span className="truncate">{it.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
