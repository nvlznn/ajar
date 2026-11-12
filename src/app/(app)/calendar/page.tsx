import Link from "next/link";
import { CategoryDot } from "@/components/category-dot";
import { taipei } from "@/lib/format";
import { getDict } from "@/lib/locale";
import { deadlinesInRange } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Calendar" };

const pad = (n: number) => String(n).padStart(2, "0");

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const user = await requireUser();
  const { t } = await getDict();
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
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h1 className="text-[34px] font-semibold leading-10 tracking-[-0.02em]">{t.monthTitle(y, mo)}</h1>
        <nav className="flex items-center gap-4 text-[15px] text-tint" aria-label={t.calendar.switchAria}>
          <Link href={`/calendar?m=${py}-${pad(pm)}`}>{t.calendar.prev}</Link>
          {!isThisMonth && <Link href="/calendar">{t.calendar.today}</Link>}
          <Link href={`/calendar?m=${ny}-${pad(nm)}`}>{t.calendar.next}</Link>
        </nav>
      </div>
      <p className="mt-1 text-[15px] text-muted-foreground">{t.calendar.count(items.length)}</p>

      <div className="mt-8 grid grid-cols-7 border-t border-hairline text-[13px]">
        {t.weekdaysShort.map((w, i) => (
          <div key={i} className="py-2 text-right text-[12px] text-muted-foreground sm:pr-2">
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
                    {list.length > 4 && <li className="px-1 text-muted-foreground">{t.calendar.more(list.length - 4)}</li>}
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
                <span className="w-10 shrink-0 text-muted-foreground tnum">{t.calendar.day(taipei(it.deadlineAt!).d)}</span>
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
