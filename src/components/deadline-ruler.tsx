import Link from "next/link";
import { CATEGORY_META, type Category } from "@/lib/categories";
import { daysUntil, taipei } from "@/lib/format";
import { cn } from "@/lib/utils";

type Item = { id: string; title: string; category: Category; deadlineAt: Date | null };

const DAYS = 15; // today + 14
const MAX_DOTS = 6;

/** The page's one expressive element: the next 14 days as a ruler, one dot per deadline. */
export function DeadlineRuler({ items, now = new Date() }: { items: Item[]; now?: Date }) {
  const byDay: Item[][] = Array.from({ length: DAYS }, () => []);
  for (const it of items) {
    if (!it.deadlineAt) continue;
    const n = daysUntil(it.deadlineAt, now);
    if (n >= 0 && n < DAYS) byDay[n].push(it);
  }

  return (
    <div className="grid grid-cols-[repeat(15,minmax(0,1fr))]" role="list" aria-label="接下來 14 天的截止日">
      {byDay.map((day, i) => {
        const date = new Date(now.getTime() + i * 86_400_000);
        const t = taipei(date);
        const weekend = t.weekday === "週六" || t.weekday === "週日";
        const urgent = i <= 3;
        const extra = day.length - MAX_DOTS;
        return (
          <div key={i} role="listitem" className="flex flex-col items-center">
            <div className="flex h-[88px] flex-col-reverse items-center gap-[5px] pb-2">
              {day.slice(0, MAX_DOTS).map((it) => (
                <Link
                  key={it.id}
                  href={`/o/${it.id}`}
                  title={`${it.title}（${CATEGORY_META[it.category].label}）`}
                  aria-label={it.title}
                  className="block size-2.5 rounded-full transition-transform hover:scale-125"
                  style={{ backgroundColor: CATEGORY_META[it.category].color }}
                />
              ))}
              {extra > 0 && <span className="text-[11px] leading-none text-muted-foreground tnum">+{extra}</span>}
            </div>
            <div className="relative h-px w-full bg-hairline">
              <span
                className={cn(
                  "absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2",
                  i === 0 ? "bg-tint" : "bg-hairline",
                )}
              />
            </div>
            <div
              className={cn(
                "mt-2.5 text-center text-[11px] leading-[14px] tnum",
                i === 0 ? "font-semibold text-tint" : weekend ? "text-muted-foreground/70" : "text-muted-foreground",
                // On narrow screens only label every other day.
                i % 2 === 1 && "max-sm:invisible",
              )}
            >
              <div>{i === 0 ? "今天" : `${t.m}/${t.d}`}</div>
              <div className={cn("max-sm:hidden", urgent && i > 0 && day.length ? "text-urgent" : "")}>
                {t.weekday.slice(1)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
