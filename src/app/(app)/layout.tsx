import { Suspense } from "react";
import { Nav, NavFrame } from "@/components/nav";
import { requireUser } from "@/lib/session";

async function UserNav() {
  const user = await requireUser();
  return <Nav name={user.name} />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<NavFrame />}>
        <UserNav />
      </Suspense>
      <main className="mx-auto w-full max-w-[980px] px-4 pb-24 pt-10 sm:px-6">
        <Suspense fallback={<div className="min-h-[60dvh]" aria-busy />}>{children}</Suspense>
      </main>
    </>
  );
}
