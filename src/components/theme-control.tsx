"use client";

import { useSyncExternalStore } from "react";
import { Segmented } from "@/components/filter-bar";
import { THEME_KEY, type ThemeSetting } from "@/lib/theme";

declare global {
  interface Window {
    __ajarApplyTheme?: () => void;
  }
}

const CHANGE = "ajar-theme-change";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb); // other tabs
  window.addEventListener(CHANGE, cb); // this tab
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE, cb);
  };
}

function read(): ThemeSetting {
  try {
    return (localStorage.getItem(THEME_KEY) as ThemeSetting) || "system";
  } catch {
    return "system";
  }
}

export function ThemeControl({ labels }: { labels: { theme: string; light: string; dark: string; system: string } }) {
  const value = useSyncExternalStore(subscribe, read, () => "system" as ThemeSetting);

  return (
    <Segmented
      label={labels.theme}
      value={value}
      onChange={(v) => {
        try {
          localStorage.setItem(THEME_KEY, v);
        } catch {}
        window.__ajarApplyTheme?.();
        window.dispatchEvent(new Event(CHANGE));
      }}
      options={[
        { value: "light", label: labels.light },
        { value: "dark", label: labels.dark },
        { value: "system", label: labels.system },
      ]}
    />
  );
}
