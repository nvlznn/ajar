import { Suspense } from "react";
import { Nav, NavFrame } from "@/components/nav";
import { ListSkeleton } from "@/components/skeleton";
import { getDict } from "@/lib/locale";

async function LocalizedNav() {
  const { t } = await getDict();
  return <Nav labels={t.nav} />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<NavFrame />}>
        <LocalizedNav />
      </Suspense>
      {/* Each page calls requireUser() itself, inside this boundary. */}
      <main className="mx-auto w-full max-w-[980px] px-4 pb-24 pt-10 sm:px-6">
        <Suspense fallback={<ListSkeleton />}>{children}</Suspense>
      </main>
    </>
  );
}
