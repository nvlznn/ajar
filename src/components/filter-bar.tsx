"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ArrowDownUp, ChevronDown, Search } from "lucide-react";
import { CategoryIcon } from "@/components/category-dot";
import type { Category } from "@/lib/categories";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Native <select> with our own chevron, so the arrow sits a fixed, comfortable distance from the text. */
export function Select({
  className,
  wrapperClassName,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }) {
  return (
    <span className={cn("relative inline-flex", wrapperClassName)}>
      <select {...props} className={cn("h-8 appearance-none rounded-lg bg-grouped pl-3 pr-7 text-[13px]", className)}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={2}
      />
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-8 rounded-lg bg-grouped p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 text-[13px] transition-colors",
            value === o.value
              ? "border border-hairline bg-background text-foreground"
              : "border border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FilterBar({ labels, categories }: { labels: Dict["filters"]; categories: Dict["categories"] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const view = (params.get("view") ?? "open") as "open" | "ineligible" | "archived" | "skipped";
  // Single-select: picking the active chip again goes back to all categories.
  const current = (params.get("category") ?? "").split(",")[0] || null;
  const pick = (c: Category) => set("category", current === c ? null : c);

  return (
    <div className={cn("space-y-3 transition-opacity", pending && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-56">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            defaultValue={params.get("q") ?? ""}
            placeholder={labels.search}
            aria-label={labels.searchAria}
            onKeyDown={(e) => {
              if (e.key === "Enter") set("q", e.currentTarget.value.trim() || null);
            }}
            onBlur={(e) => {
              if ((params.get("q") ?? "") !== e.currentTarget.value.trim())
                set("q", e.currentTarget.value.trim() || null);
            }}
            className="h-8 w-full rounded-lg bg-grouped pl-8 pr-3 text-[13px] placeholder:text-muted-foreground"
          />
        </div>
        <Select
          aria-label={labels.minFit}
          value={params.get("fit") ?? ""}
          onChange={(e) => set("fit", e.target.value || null)}
        >
          <option value="">{labels.fitAll}</option>
          {[90, 80, 70, 60, 50, 40, 30, 20, 10].map((n) => (
            <option key={n} value={n}>
              {labels.fitTpl.replace("{n}", String(n))}
            </option>
          ))}
        </Select>
        <Segmented
          label={labels.show}
          value={view}
          onChange={(v) => set("view", v === "open" ? null : v)}
          options={[
            { value: "open", label: labels.open },
            { value: "ineligible", label: labels.withIneligible },
            { value: "archived", label: labels.archived },
            { value: "skipped", label: labels.skipped },
          ]}
        />
        <span className="inline-flex items-center gap-1.5 text-muted-foreground sm:ml-auto">
          <ArrowDownUp aria-hidden className="size-3.5" />
          <Select
            aria-label={labels.sort}
            value={params.get("sort") ?? "deadline"}
            onChange={(e) => set("sort", e.target.value === "deadline" ? null : e.target.value)}
            className="text-foreground"
          >
            <option value="deadline">{labels.sortDeadline}</option>
            <option value="fit">{labels.sortFit}</option>
            <option value="new">{labels.sortNew}</option>
            <option value="title">{labels.sortTitle}</option>
          </Select>
        </span>
      </div>

      {/* Category: single-select chips. Scrolls sideways on phones. */}
      <div
        role="radiogroup"
        aria-label={labels.category}
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        <button
          type="button"
          role="radio"
          aria-checked={current === null}
          onClick={() => set("category", null)}
          className={cn(
            "inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-[12px] transition-colors",
            current === null
              ? "border-foreground bg-foreground text-background"
              : "border-hairline text-muted-foreground hover:text-foreground",
          )}
        >
          {labels.allCategories}
        </button>
        {(Object.keys(categories) as Category[]).map((c) => {
          const on = current === c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(c)}
              className={cn(
                "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors",
                on
                  ? "border-foreground bg-foreground text-background"
                  : "border-hairline text-muted-foreground hover:text-foreground",
              )}
            >
              <CategoryIcon category={c} className={cn("size-3", on && "!text-background")} />
              {categories[c]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
