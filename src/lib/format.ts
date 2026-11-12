const TZ = "Asia/Taipei";

/** Calendar parts of an instant in Asia/Taipei. `dow` is 0 (Sunday) – 6. */
export function taipei(d: Date) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  const y = Number(get("year"));
  const m = Number(get("month"));
  const day = Number(get("day"));
  const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return { y, m, d: day, dow, hh: get("hour"), mm: get("minute") };
}

/** Whole calendar days from today (Taipei) to the given instant's Taipei date. */
export function daysUntil(d: Date, now = new Date()): number {
  const a = taipei(now);
  const b = taipei(d);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

/** ISO instant of 00:00 Asia/Taipei, `offset` days from today. Stable all day → good cache key. */
export function taipeiDayStart(offset = 0, now = new Date()): string {
  const t = taipei(now);
  return new Date(Date.UTC(t.y, t.m - 1, t.d + offset) - 8 * 3_600_000).toISOString();
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
