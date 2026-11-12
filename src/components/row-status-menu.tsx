"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Check, Ellipsis, EyeOff, PencilLine, Send, Star, ThumbsDown, Trophy, Undo2, type LucideIcon } from "lucide-react";
import { setStatus } from "@/app/actions";
import type { TrackingStatus } from "@/lib/categories";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ICON: Record<TrackingStatus, LucideIcon> = {
  interested: Star,
  preparing: PencilLine,
  applied: Send,
  accepted: Trophy,
  rejected: ThumbsDown,
  skipped: EyeOff,
};
const ORDER: TrackingStatus[] = ["interested", "preparing", "applied", "accepted", "rejected", "skipped"];

/**
 * Row-level status menu on the list. Sits next to (not inside) the row link, revealed on hover/focus;
 * the trigger shows the current status icon when one is set.
 */
export function RowStatusMenu({
  opportunityId,
  status,
  labels,
}: {
  opportunityId: string;
  status: TrackingStatus | null;
  labels: Dict["status"];
}) {
  const [open, setOpen] = useState(false);
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [, start] = useTransition();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: TrackingStatus | null) => {
    setOpen(false);
    start(async () => {
      setOptimistic(next);
      await setStatus(opportunityId, next);
    });
  };

  const Current = optimistic ? ICON[optimistic] : Ellipsis;

  return (
    <div ref={root} className="absolute right-0 top-3">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={optimistic ? labels[optimistic] : labels.aria}
        title={optimistic ? labels[optimistic] : labels.aria}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full border border-hairline bg-background transition-opacity",
          optimistic ? "text-tint opacity-100" : "text-muted-foreground opacity-0 hover:text-foreground",
          "focus-visible:opacity-100 group-hover/row:opacity-100 max-sm:opacity-100",
          open && "opacity-100",
        )}
      >
        <Current
          aria-hidden
          className="size-4"
          strokeWidth={1.9}
          fill={optimistic === "interested" ? "currentColor" : "none"}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={labels.aria}
          className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-hairline bg-popover p-1 text-[13px] shadow-lg"
        >
          {ORDER.map((s) => {
            const Icon = ICON[s];
            return (
              <button
                key={s}
                type="button"
                role="menuitemradio"
                aria-checked={optimistic === s}
                onClick={() => choose(optimistic === s ? null : s)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-grouped",
                  s === "skipped" && "mt-1 border-t border-hairline/70 pt-2",
                )}
              >
                <Icon aria-hidden className="size-4 text-muted-foreground" strokeWidth={1.9} />
                <span className="flex-1">{labels[s]}</span>
                {optimistic === s && <Check aria-hidden className="size-4 text-tint" strokeWidth={2.25} />}
              </button>
            );
          })}
          {optimistic && (
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(null)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-muted-foreground hover:bg-grouped"
            >
              <Undo2 aria-hidden className="size-4" strokeWidth={1.9} />
              {labels.clear}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
