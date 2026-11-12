"use client";

import { useTransition } from "react";
import { EyeOff, Undo2 } from "lucide-react";
import { setStatus } from "@/app/actions";
import { cn } from "@/lib/utils";

/**
 * Row-level quick action. Sits next to (not inside) the row link, revealed on hover/focus.
 * In the "not interested" view it restores the item instead.
 */
export function NotInterestedButton({
  opportunityId,
  restore,
  label,
}: {
  opportunityId: string;
  restore: boolean;
  label: string;
}) {
  const [pending, start] = useTransition();
  const Icon = restore ? Undo2 : EyeOff;
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={pending}
      onClick={() => start(() => setStatus(opportunityId, restore ? null : "skipped"))}
      className={cn(
        "absolute right-0 top-3 inline-flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground",
        "border border-hairline opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/row:opacity-100",
        "max-sm:opacity-100",
        pending && "opacity-50",
      )}
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.9} />
    </button>
  );
}
