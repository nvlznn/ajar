"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "機會" },
  { href: "/calendar", label: "月曆" },
  { href: "/profile", label: "個人檔案" },
] as const;

/** Static frame (no runtime hooks) — used directly as the Suspense fallback. */
export function NavFrame({
  isActive = () => false,
  children,
}: {
  isActive?: (href: string) => boolean;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-11 max-w-[980px] items-center gap-5 px-4 text-[13px] sm:gap-7 sm:px-6">
        <Link href="/" className="text-[17px] font-semibold tracking-tight">
          Ajar
        </Link>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
            className={cn(
              "transition-colors",
              isActive(l.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-4">{children}</div>
      </nav>
    </header>
  );
}

export function Nav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/o/") : pathname.startsWith(href);

  return (
    <NavFrame isActive={isActive}>
      <span className="hidden text-muted-foreground sm:inline">{name}</span>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground"
        onClick={async () => {
          await authClient.signOut();
          router.push("/login");
        }}
      >
        登出
      </button>
    </NavFrame>
  );
}
