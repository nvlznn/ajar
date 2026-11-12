import { LOCALE_COOKIE } from "@/lib/i18n";

export type ThemeSetting = "light" | "dark" | "system";
export const THEME_KEY = "ajar-theme";

/**
 * Runs in <head> before paint: resolve the stored theme setting to data-theme (following the OS while on
 * "system"), and set <html lang> from the locale cookie so the static shell is correct for screen readers.
 */
export const themeScript = `(function(){var h=document.documentElement;try{h.lang=/(?:^|; )${LOCALE_COOKIE}=en/.test(document.cookie)?"en":"zh-Hant"}catch(e){}try{var k="${THEME_KEY}",m=window.matchMedia("(prefers-color-scheme: dark)");function a(){var t=localStorage.getItem(k)||"system";h.dataset.theme=t==="system"?(m.matches?"dark":"light"):t}a();m.addEventListener("change",a);window.__ajarApplyTheme=a}catch(e){h.dataset.theme="light"}})();`;
