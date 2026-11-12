"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { IN_APP_NAV_KEY } from "@/components/nav";

/**
 * Apple-style back control. Goes back in history when the previous page was inside the app (keeps the
 * list's filters and scroll position); otherwise — opened from a bookmark or a link elsewhere — goes to `href`.
 */
export function BackButton({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(e) => {
        let inApp = false;
        try {
          inApp = Number(sessionStorage.getItem(IN_APP_NAV_KEY) ?? 0) > 1;
        } catch {}
        if (inApp && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault();
          router.back();
        }
      }}
      className="-ml-1.5 inline-flex items-center gap-0.5 text-[15px] text-tint hover:opacity-80"
    >
      <ChevronLeft aria-hidden className="size-5" strokeWidth={2.25} />
      {label}
    </Link>
  );
}
