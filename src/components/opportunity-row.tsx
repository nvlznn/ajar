import Link from "next/link";
import { CategoryLabel } from "@/components/category-dot";
import { ELIGIBILITY_LABEL, STATUS_LABEL, type Category, type TrackingStatus } from "@/lib/categories";
import { daysUntil, relativeDays, taipei } from "@/lib/format";
import { cn } from "@/lib/utils";

export type RowItem = {
  id: string;
  title: string;
  category: Category;
  organizer: string | null;
  city: string | null;
  country: string | null;
  locationMode: string | null;
  deadlineAt: Date | null;
  deadlineEstimated: boolean;
  firstSeenAt: Date;
  score: number | null;
  eligibility: string | null;
  status: TrackingStatus | null;
};

function place(it: RowItem) {
  if (it.locationMode === "online") return "線上";
  return [it.city, it.country && it.country !== "TW" ? it.country : null].filter(Boolean).join("，") || null;
}

export function OpportunityRow({ it, now = new Date() }: { it: RowItem; now?: Date }) {
  const t = it.deadlineAt ? taipei(it.deadlineAt) : null;
  const days = it.deadlineAt ? daysUntil(it.deadlineAt, now) : null;
  const urgent = days !== null && days >= 0 && days <= 3;
  const isNew = now.getTime() - it.firstSeenAt.getTime() < 7 * 86_400_000;
  const where = place(it);

  const meta = (
    <>
      <CategoryLabel category={it.category} />
      {days !== null && (
        <span className={cn("tnum", urgent && "text-urgent")}>
          {it.deadlineEstimated ? "約 " : ""}
          {relativeDays(days)}
        </span>
      )}
      {it.score !== null && (
        <span className="tnum">
          {it.score}
          {it.eligibility === "maybe" && <span className="text-muted-foreground"> 可能符合</span>}
        </span>
      )}
      {it.status && <span className="text-tint">{STATUS_LABEL[it.status]}</span>}
    </>
  );

  return (
    <li>
      <Link
        href={`/o/${it.id}`}
        className="group -mx-3 grid grid-cols-[44px_minmax(0,1fr)] gap-x-4 rounded-lg px-3 py-3 transition-colors hover:bg-grouped sm:grid-cols-[52px_minmax(0,1fr)_auto]"
      >
        <div className="pt-0.5 tnum">
          {t ? (
            <>
              <div className={cn("text-[20px] font-semibold leading-6", urgent && "text-urgent")}>{t.d}</div>
              <div className="text-[12px] leading-4 text-muted-foreground">
                {it.deadlineEstimated ? "預估" : t.weekday}
              </div>
            </>
          ) : (
            <div className="text-[13px] leading-6 text-muted-foreground">隨時</div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="line-clamp-2 text-[15px] font-medium leading-[22px]">{it.title}</span>
            {isNew && <span className="shrink-0 text-[12px] font-medium text-tint">新</span>}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] leading-[18px] text-muted-foreground">
            {it.organizer && <span className="truncate">{it.organizer}</span>}
            {where && <span>{where}</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-[18px] text-muted-foreground sm:hidden">
            {meta}
          </div>
        </div>

        <div className="hidden items-start gap-5 pt-0.5 text-[13px] leading-[22px] text-muted-foreground sm:flex">
          <span className="w-[72px]">
            <CategoryLabel category={it.category} />
          </span>
          <span className={cn("w-[60px] text-right tnum", urgent && "text-urgent")}>
            {days !== null ? `${it.deadlineEstimated ? "約 " : ""}${relativeDays(days)}` : ""}
          </span>
          <span
            className="w-8 text-right tnum text-foreground"
            title={it.eligibility ? `適合度，${ELIGIBILITY_LABEL[it.eligibility]}` : "適合度"}
          >
            {it.score ?? ""}
          </span>
          <span className="w-12 text-right text-tint">{it.status ? STATUS_LABEL[it.status] : ""}</span>
        </div>
      </Link>
    </li>
  );
}
