import { cn } from "@/lib/utils";

/** Static placeholders for loading.tsx — prefetched with the route so navigation paints instantly. */
export function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-grouped", className)} />;
}

function Rows({ n }: { n: number }) {
  return (
    <div className="divide-y divide-hairline/60">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="grid grid-cols-[52px_minmax(0,1fr)] gap-4 py-3.5">
          <Bone className="h-9 w-8" />
          <div className="space-y-2">
            <Bone className="h-4 w-2/3" />
            <Bone className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div role="status" aria-busy>
      <Bone className="h-10 w-56" />
      <Bone className="mt-3 h-4 w-72" />
      <Bone className="mt-8 h-[124px] w-full rounded-xl" />
      <Bone className="mt-14 h-7 w-40" />
      <Bone className="mt-4 h-8 w-full max-w-lg rounded-lg" />
      <div className="mt-8">
        <Rows n={6} />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div role="status" aria-busy className="max-w-[720px]">
      <Bone className="h-5 w-24" />
      <Bone className="mt-6 h-4 w-20" />
      <Bone className="mt-3 h-10 w-4/5" />
      <Bone className="mt-3 h-5 w-40" />
      <Bone className="mt-6 h-6 w-64" />
      <div className="mt-6 flex gap-3">
        <Bone className="h-9 w-32 rounded-full" />
        <Bone className="h-9 w-56 rounded-full" />
      </div>
      <Bone className="mt-10 h-12 w-3/4" />
      <Bone className="mt-10 h-40 w-full rounded-xl" />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div role="status" aria-busy>
      <Bone className="h-10 w-48" />
      <Bone className="mt-3 h-4 w-56" />
      <div className="mt-8 grid grid-cols-7 gap-px">
        {Array.from({ length: 35 }, (_, i) => (
          <Bone key={i} className="h-14 rounded-none sm:h-28" />
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div role="status" aria-busy className="max-w-[720px]">
      <Bone className="h-10 w-40" />
      <Bone className="mt-10 h-7 w-32" />
      <Bone className="mt-3 h-36 w-full rounded-xl" />
      <Bone className="mt-10 h-7 w-32" />
      <Bone className="mt-3 h-48 w-full rounded-xl" />
    </div>
  );
}
