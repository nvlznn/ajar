import Link from "next/link";
import { CategoryLabel } from "@/components/category-dot";
import { NotInterestedButton } from "@/components/not-interested-button";
import type { Category, TrackingStatus } from "@/lib/categories";
import { daysUntil, taipei } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
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

function place(it: RowItem, t: Dict) {
  if (it.locationMode === "online") return t.common.online;
  return [it.city, it.country && it.country !== "TW" ? it.country : null].filter(Boolean).join(t.common.listSep) || null;
}

export function OpportunityRow({
  it,
  t,
  now = new Date(),
  restore = false,
  showMonth = false,
}: {
  it: RowItem;
  t: Dict;
  now?: Date;
  /** In the "not interested" view the quick action restores instead of hiding. */
  restore?: boolean;
  /** Without month headings (non-deadline sorts) the date column needs the month too. */
  showMonth?: boolean;
}) {
  const d = it.deadlineAt ? taipei(it.deadlineAt) : null;
  const days = it.deadlineAt ? daysUntil(it.deadlineAt, now) : null;
  const urgent = days !== null && days >= 0 && days <= 3;
  const isNew = now.getTime() - it.firstSeenAt.getTime() < 7 * 86_400_000;
  const where = place(it, t);
  const when = days !== null ? `${it.deadlineEstimated ? t.common.approx : ""}${t.relative(days)}` : "";
  const category = <CategoryLabel category={it.category} label={t.categories[it.category]} />;

  return (
    <li className="group/row relative">
      <Link
        href={`/o/${it.id}`}
        className="group -mx-3 grid grid-cols-[44px_minmax(0,1fr)] gap-x-4 rounded-lg py-3 pl-3 pr-12 transition-colors hover:bg-grouped sm:grid-cols-[52px_minmax(0,1fr)_auto]"
      >
        <div className="pt-0.5 tnum">
          {d ? (
            <>
              <div
                className={cn(
                  "font-semibold leading-6",
                  showMonth ? "text-[15px]" : "text-[20px]",
                  urgent && "text-urgent",
                )}
              >
                {showMonth ? `${d.m}/${d.d}` : d.d}
              </div>
              <div className="text-[12px] leading-4 text-muted-foreground">
                {it.deadlineEstimated ? t.common.estimated : t.weekdays[d.dow]}
              </div>
            </>
          ) : (
            <div className="text-[13px] leading-6 text-muted-foreground">{t.common.anytime}</div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="line-clamp-2 text-[15px] font-medium leading-[22px]">{it.title}</span>
            {isNew && <span className="shrink-0 text-[12px] font-medium text-tint">{t.common.new}</span>}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[13px] leading-[18px] text-muted-foreground">
            {it.organizer && <span className="truncate">{it.organizer}</span>}
            {where && <span>{where}</span>}
          </div>
          {/* Phones: metadata wraps under the title. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-[18px] text-muted-foreground sm:hidden">
            {category}
            {when && <span className={cn("tnum", urgent && "text-urgent")}>{when}</span>}
            {it.score !== null && (
              <span className="tnum">
                {it.score}
                {it.eligibility === "maybe" && <span> {t.eligibility.maybe}</span>}
              </span>
            )}
            {it.status && <span className="text-tint">{t.status[it.status]}</span>}
          </div>
        </div>

        <div className="hidden items-start gap-5 pt-0.5 text-[13px] leading-[22px] text-muted-foreground sm:flex">
          <span className="w-[96px]">{category}</span>
          <span className={cn("w-[76px] text-right tnum", urgent && "text-urgent")}>{when}</span>
          <span
            className="w-8 text-right tnum text-foreground"
            title={it.eligibility ? t.home.fitTitle(t.eligibility[it.eligibility as keyof Dict["eligibility"]] ?? "") : undefined}
          >
            {it.score ?? ""}
          </span>
          <span className="w-16 text-right text-tint">{it.status ? t.status[it.status] : ""}</span>
        </div>
      </Link>
      <NotInterestedButton
        opportunityId={it.id}
        restore={restore}
        label={restore ? t.status.restore : t.filters.markNotInterested}
      />
    </li>
  );
}
