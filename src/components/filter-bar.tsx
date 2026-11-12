"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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

  const view = (params.get("view") ?? "open") as "open" | "ineligible" | "archived";

  return (
    <div className={cn("flex flex-wrap items-center gap-2 transition-opacity", pending && "opacity-60")}>
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
      <select
        aria-label={labels.category}
        value={params.get("category") ?? ""}
        onChange={(e) => set("category", e.target.value || null)}
        className="h-8 rounded-lg bg-grouped px-2.5 text-[13px]"
      >
        <option value="">{labels.allCategories}</option>
        {Object.entries(categories).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <Segmented
        label={labels.show}
        value={view}
        onChange={(v) => set("view", v === "open" ? null : v)}
        options={[
          { value: "open", label: labels.open },
          { value: "ineligible", label: labels.withIneligible },
          { value: "archived", label: labels.archived },
        ]}
      />
    </div>
  );
}
