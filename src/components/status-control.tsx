"use client";

import { useOptimistic, useTransition } from "react";
import { EyeOff, PencilLine, Send, Star, Undo2, type LucideIcon } from "lucide-react";
import { setStatus } from "@/app/actions";
import type { TrackingStatus } from "@/lib/categories";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PRIMARY: TrackingStatus[] = ["interested", "preparing", "applied"];
const ICON: Partial<Record<TrackingStatus, LucideIcon>> = { interested: Star, preparing: PencilLine, applied: Send };
const OUTCOME: TrackingStatus[] = ["accepted", "rejected"];

export function StatusControl({
  opportunityId,
  status,
  labels,
}: {
  opportunityId: string;
  status: TrackingStatus | null;
  labels: Dict["status"];
}) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, start] = useTransition();

  const choose = (next: TrackingStatus | null) =>
    start(async () => {
      setOptimistic(next);
      await setStatus(opportunityId, next);
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label={labels.aria} className="inline-flex h-9 rounded-full bg-grouped p-0.5">
        {PRIMARY.map((s) => {
          const Icon = ICON[s]!;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={optimistic === s}
              onClick={() => choose(optimistic === s ? null : s)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors",
                optimistic === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                aria-hidden
                className="size-3.5"
                strokeWidth={2}
                fill={s === "interested" && optimistic === s ? "currentColor" : "none"}
              />
              {labels[s]}
            </button>
          );
        })}
      </div>
      <select
        aria-label={labels.outcome}
        value={optimistic && OUTCOME.includes(optimistic) ? optimistic : ""}
        onChange={(e) => choose((e.target.value || null) as TrackingStatus | null)}
        className="h-9 rounded-full bg-grouped px-3.5 text-[13px] text-muted-foreground"
      >
        <option value="">{labels.outcome}</option>
        {OUTCOME.map((s) => (
          <option key={s} value={s}>
            {labels[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-pressed={optimistic === "skipped"}
        onClick={() => choose(optimistic === "skipped" ? null : "skipped")}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors",
          optimistic === "skipped"
            ? "bg-foreground text-background"
            : "bg-grouped text-muted-foreground hover:text-foreground",
        )}
      >
        {optimistic === "skipped" ? (
          <Undo2 aria-hidden className="size-3.5" strokeWidth={2} />
        ) : (
          <EyeOff aria-hidden className="size-3.5" strokeWidth={2} />
        )}
        {optimistic === "skipped" ? labels.restore : labels.notInterested}
      </button>
    </div>
  );
}
