import "server-only";
import { cookies } from "next/headers";
import { DICTS, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : "zh";
}

export async function getDict() {
  const locale = await getLocale();
  return { locale, t: DICTS[locale] };
}
