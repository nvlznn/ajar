"use client";

import { useOptimistic, useTransition } from "react";
import { setLocale } from "@/app/actions";
import { Segmented } from "@/components/filter-bar";
import type { Locale } from "@/lib/i18n";

export function LanguageControl({ value, label }: { value: Locale; label: string }) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [, start] = useTransition();
  return (
    <Segmented
      label={label}
      value={optimistic}
      onChange={(v) =>
        start(async () => {
          setOptimistic(v);
          document.documentElement.lang = v === "en" ? "en" : "zh-Hant";
          await setLocale(v);
        })
      }
      // Each language is named in itself so it can be found from either UI.
      options={[
        { value: "zh", label: "中文" },
        { value: "en", label: "English" },
      ]}
    />
  );
}
