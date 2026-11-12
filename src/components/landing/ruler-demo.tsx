"use client";

import { useMemo, useState } from "react";
import { CategoryIcon } from "@/components/category-dot";
import { CATEGORY_COLOR, type Category } from "@/lib/categories";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Illustrative items only (generic names, no real organizations). Offsets are days from today. */
const SAMPLE: { category: Category; day: number; fit: number }[] = [
  { category: "hackathon", day: 0, fit: 72 },
  { category: "internship", day: 2, fit: 95 },
  { category: "exchange", day: 2, fit: 81 },
  { category: "internship", day: 3, fit: 88 },
  { category: "open_source", day: 5, fit: 64 },
  { category: "program", day: 6, fit: 77 },
  { category: "competition", day: 8, fit: 58 },
  { category: "conference", day: 9, fit: 83 },
  { category: "startup", day: 11, fit: 70 },
  { category: "scholarship", day: 12, fit: 61 },
  { category: "camp", day: 13, fit: 55 },
  { category: "hackathon", day: 14, fit: 79 },
];

const DAYS = 15;

function taipeiDay(offset: number) {
  const d = new Date(Date.now() + offset * 86_400_000);
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric", weekday: "short" }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { label: `${get("month")}/${get("day")}`, weekend: ["Sat", "Sun"].includes(get("weekday")) };
}

export function RulerDemo({ t, categories }: { t: Dict["landing"]["demo"]; categories: Dict["categories"] }) {
  const items = useMemo(() => SAMPLE.map((s, i) => ({ ...s, id: i, title: t.titles[i] })), [t.titles]);
  const present = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const [filter, setFilter] = useState<Category | null>(null);
  const [selected, setSelected] = useState(1);

  const visible = items.filter((i) => !filter || i.category === filter);
  const current = visible.find((i) => i.id === selected) ?? visible[0] ?? null;
  const rel = (n: number) => (n === 0 ? t.today : n === 1 ? t.tomorrow : t.daysTpl.replace("{n}", String(n)));

  return (
    <div className="rounded-2xl border border-hairline/70 bg-grouped p-5 text-left sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-[17px] font-semibold">{t.label}</div>
        <div className="text-[13px] text-muted-foreground">{t.hint}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.label}>
        {[null, ...present].map((c) => (
          <button
            key={c ?? "all"}
            type="button"
            role="radio"
            aria-checked={filter === c}
            onClick={() => setFilter(c)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors",
              filter === c
                ? "border-foreground bg-foreground text-background"
                : "border-hairline bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {c && <CategoryIcon category={c} className={cn("size-3", filter === c && "!text-background")} />}
            {c ? categories[c] : t.all}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-[repeat(15,minmax(0,1fr))]">
        {Array.from({ length: DAYS }, (_, d) => {
          const day = visible.filter((i) => i.day === d);
          const info = taipeiDay(d);
          return (
            <div key={d} className="flex flex-col items-center">
              <div className="flex h-16 flex-col-reverse items-center gap-1.5 pb-2">
                {day.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    aria-label={`${it.title}, ${rel(it.day)}`}
                    aria-pressed={current?.id === it.id}
                    onClick={() => setSelected(it.id)}
                    onMouseEnter={() => setSelected(it.id)}
                    onFocus={() => setSelected(it.id)}
                    className={cn(
                      "size-3 rounded-full transition-transform hover:scale-125",
                      current?.id === it.id && "scale-125 outline outline-1 outline-offset-2 outline-foreground",
                    )}
                    style={{ backgroundColor: CATEGORY_COLOR[it.category] }}
                  />
                ))}
              </div>
              <div className="relative h-px w-full bg-hairline">
                <span className={cn("absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2", d === 0 ? "bg-tint" : "bg-hairline")} />
              </div>
              <div
                className={cn(
                  "mt-2 text-[11px] tnum",
                  d === 0 ? "font-semibold text-tint" : info.weekend ? "text-muted-foreground/70" : "text-muted-foreground",
                  d % 2 === 1 && "max-sm:invisible",
                )}
              >
                {d === 0 ? t.today : info.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 min-h-[88px] rounded-xl bg-background p-4 sm:p-5" aria-live="polite">
        {current ? (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <CategoryIcon category={current.category} />
                {categories[current.category]}
              </div>
              <div className="mt-1 text-[17px] font-semibold leading-6">{current.title}</div>
              <div className={cn("mt-1 text-[13px] tnum", current.day <= 3 ? "text-urgent" : "text-muted-foreground")}>
                {rel(current.day)}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[34px] font-semibold leading-none tracking-tight tnum">{current.fit}</div>
              <div className="mt-1 text-[12px] text-muted-foreground">{t.fit}</div>
            </div>
          </div>
        ) : (
          <p className="text-[15px] text-muted-foreground">{t.empty}</p>
        )}
      </div>
    </div>
  );
}
