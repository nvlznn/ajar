const TZ = "Asia/Taipei";
const WEEKDAY = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

/** Calendar parts of an instant in Asia/Taipei. */
export function taipei(d: Date) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const y = Number(get("year"));
  const m = Number(get("month"));
  const day = Number(get("day"));
  const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return { y, m, d: day, weekday: WEEKDAY[dow], hh: get("hour"), mm: get("minute"), ymd: `${get("year")}-${get("month")}-${get("day")}` };
}

/** Whole calendar days from today (Taipei) to the given instant's Taipei date. */
export function daysUntil(d: Date, now = new Date()): number {
  const a = taipei(now);
  const b = taipei(d);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

export function relativeDays(n: number): string {
  if (n === 0) return "今天";
  if (n === 1) return "明天";
  if (n < 0) return `${-n} 天前`;
  return `${n} 天後`;
}

export function formatDate(d: Date, withYear = false): string {
  const t = taipei(d);
  return withYear ? `${t.y}/${t.m}/${t.d}` : `${t.m}/${t.d}`;
}

/** Stage dates are stored as strings: show YYYY-MM-DD as-is (Taipei), datetimes converted. */
export function formatStageDate(s: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return `${y}/${m}/${d}`;
  }
  const t = taipei(new Date(s));
  return `${t.y}/${t.m}/${t.d} ${t.hh}:${t.mm}`;
}
