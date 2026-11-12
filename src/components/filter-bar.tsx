"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { setRegionMode } from "@/app/actions";
import { CATEGORY_META } from "@/lib/categories";
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

export function FilterBar({ regionMode }: { regionMode: "focus" | "all" }) {
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

  const view = params.get("view") ?? "open";

  return (
    <div className={cn("flex flex-wrap items-center gap-2 transition-opacity", pending && "opacity-60")}>
      <input
        type="search"
        defaultValue={params.get("q") ?? ""}
        placeholder="搜尋名稱或主辦單位"
        aria-label="搜尋"
        onKeyDown={(e) => {
          if (e.key === "Enter") set("q", e.currentTarget.value.trim() || null);
        }}
        onBlur={(e) => {
          if ((params.get("q") ?? "") !== e.currentTarget.value.trim()) set("q", e.currentTarget.value.trim() || null);
        }}
        className="h-8 w-full rounded-lg bg-grouped px-3 text-[13px] placeholder:text-muted-foreground sm:w-56"
      />
      <select
        aria-label="類別"
        value={params.get("category") ?? ""}
        onChange={(e) => set("category", e.target.value || null)}
        className="h-8 rounded-lg bg-grouped px-2.5 text-[13px]"
      >
        <option value="">所有類別</option>
        {Object.entries(CATEGORY_META).map(([k, v]) => (
          <option key={k} value={k}>
            {v.label}
          </option>
        ))}
      </select>
      <Segmented
        label="顯示"
        value={view as "open" | "ineligible" | "archived"}
        onChange={(v) => set("view", v === "open" ? null : v)}
        options={[
          { value: "open", label: "開放中" },
          { value: "ineligible", label: "含不符合" },
          { value: "archived", label: "已截止" },
        ]}
      />
      <div className="sm:ml-auto">
        <Segmented
          label="地區範圍"
          value={regionMode}
          onChange={(v) => start(() => setRegionMode(v))}
          options={[
            { value: "focus", label: "台灣與有補助" },
            { value: "all", label: "全世界" },
          ]}
        />
      </div>
    </div>
  );
}
