"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { CalendarDays, Settings, Sparkles, UserRound, type LucideIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { Dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Labels = Dict["nav"];

/** Static frame (no runtime hooks) — used as the Suspense fallback, without labels to avoid a wrong-language flash. */
export function NavFrame({
  labels,
  isActive = () => false,
}: {
  labels?: Labels;
  isActive?: (href: string) => boolean;
}) {
  const links: { href: string; label: string; icon: LucideIcon }[] = labels
    ? [
        { href: "/", label: labels.opportunities, icon: Sparkles },
        { href: "/calendar", label: labels.calendar, icon: CalendarDays },
        { href: "/profile", label: labels.profile, icon: UserRound },
      ]
    : [];
  const linkClass = (href: string) =>
    cn(
      "inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-grouped",
      isActive(href) ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-11 max-w-[980px] items-center gap-2 px-4 text-[13px] sm:px-6">
        <Link href="/" className="mr-3 text-[17px] font-semibold tracking-tight">
          Ajar
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            aria-label={l.label}
            title={l.label}
            className={linkClass(l.href)}
          >
            <l.icon aria-hidden className="size-[18px]" strokeWidth={1.9} />
          </Link>
        ))}
        {labels && (
          <Link
            href="/settings"
            aria-current={isActive("/settings") ? "page" : undefined}
            aria-label={labels.settings}
            title={labels.settings}
            className={cn("ml-auto", linkClass("/settings"))}
          >
            <Settings aria-hidden className="size-[18px]" strokeWidth={1.9} />
          </Link>
        )}
      </nav>
    </header>
  );
}

/** Count of pages viewed in this tab's session; > 1 means "back" stays inside the app. */
export const IN_APP_NAV_KEY = "ajar-in-app-nav";

export function Nav({ labels }: { labels: Labels }) {
  const pathname = usePathname();
  useEffect(() => {
    try {
      sessionStorage.setItem(IN_APP_NAV_KEY, String(Number(sessionStorage.getItem(IN_APP_NAV_KEY) ?? 0) + 1));
    } catch {}
  }, [pathname]);

  // Server Components can't write cookies, so keep Better Auth's session cookie-cache warm from here
  // (a Route Handler call refreshes it). Without this, pages fall back to a DB lookup per request.
  useEffect(() => {
    const refresh = () => authClient.getSession().catch(() => {});
    refresh();
    const id = setInterval(refresh, 4 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/o/") : pathname.startsWith(href);
  return <NavFrame labels={labels} isActive={isActive} />;
}
