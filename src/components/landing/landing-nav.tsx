"use client";

import Link from "next/link";
import { useTransition } from "react";
import { setLocale } from "@/app/actions";
import type { Dict, Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LandingNav({ t, locale }: { t: Dict["landing"]["nav"]; locale: Locale }) {
  const [pending, start] = useTransition();
  const other: Locale = locale === "zh" ? "en" : "zh";
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex h-12 max-w-[980px] items-center gap-6 px-4 text-[13px] sm:px-6">
        <Link href="/welcome" className="text-[17px] font-semibold tracking-tight">
          Ajar
        </Link>
        <a href="#how" className="text-muted-foreground hover:text-foreground max-sm:hidden">
          {t.how}
        </a>
        <a href="#faq" className="text-muted-foreground hover:text-foreground max-sm:hidden">
          {t.faq}
        </a>
        <div className="ml-auto flex items-center gap-4">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                document.documentElement.lang = other === "en" ? "en" : "zh-Hant";
                await setLocale(other);
              })
            }
            className={cn("text-muted-foreground hover:text-foreground", pending && "opacity-60")}
          >
            {other === "en" ? "English" : "中文"}
          </button>
          <Link
            href="/login"
            className="inline-flex h-8 items-center rounded-full bg-foreground px-4 font-medium text-background hover:opacity-90"
          >
            {t.signIn}
          </Link>
        </div>
      </nav>
    </header>
  );
}
