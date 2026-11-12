import { Star } from "lucide-react";
import { DeadlineRuler } from "@/components/deadline-ruler";
import { OpportunityRow } from "@/components/opportunity-row";
import { daysUntil } from "@/lib/format";
import { getDict } from "@/lib/locale";
import { listTracking } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Tracking" };

/** Stages in the order you act on them: what you're working on first. */
const STAGES = ["preparing", "interested", "applied"] as const;

export default async function TrackingPage() {
  const [user, { t }] = await Promise.all([requireUser(), getDict()]);
  const tracking = await listTracking(user.id);
  const now = new Date();

  // The 14-day ruler lives only on this page, and shows only what you're tracking.
  const soon = tracking.filter((it) => {
    if (!it.deadlineAt) return false;
    const n = daysUntil(it.deadlineAt, now);
    return n >= 0 && n <= 14;
  });

  return (
    <div>
      <h1 className="text-[34px] font-semibold leading-10 tracking-[-0.02em]">{t.home.tracking}</h1>
      <p className="mt-1 text-[15px] text-muted-foreground tnum">{t.home.count(tracking.length)}</p>

      {tracking.length === 0 ? (
        <div className="mt-12 flex max-w-md items-start gap-3 text-[15px] text-muted-foreground">
          <Star aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
          <p>{t.home.trackingEmpty}</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="next-14" className="mt-10">
            <h2 id="next-14" className="text-[21px] font-semibold leading-7">
              {t.home.title}
            </h2>
            <p className="mt-1 text-[15px] text-muted-foreground">{t.home.soon(soon.length)}</p>
            <div className="mt-6">
              <DeadlineRuler items={soon} t={t} now={now} />
            </div>
          </section>

          {STAGES.map((status) => {
            const group = tracking.filter((it) => it.status === status);
            if (!group.length) return null;
            return (
              <section key={status} className="mt-10">
                <h2 className="flex items-baseline justify-between border-b border-hairline pb-2">
                  <span className="text-[21px] font-semibold leading-7">{t.status[status]}</span>
                  <span className="text-[13px] text-muted-foreground tnum">{t.home.count(group.length)}</span>
                </h2>
                <ul className="divide-y divide-hairline/60">
                  {group.map((it) => (
                    <OpportunityRow key={it.id} it={it} t={t} now={now} showMonth hideStatus />
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
