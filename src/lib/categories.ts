import type { CATEGORIES } from "@/lib/opportunity-input";

export type Category = (typeof CATEGORIES)[number];

/** Display names live in i18n.ts; this is only the dot color per category. */
export const CATEGORY_COLOR: Record<Category, string> = {
  hackathon: "var(--cat-blue)",
  exchange: "var(--cat-green)",
  internship: "var(--cat-orange)",
  lab: "var(--cat-purple)",
  competition: "var(--cat-red)",
  program: "var(--cat-indigo)",
  scholarship: "var(--cat-yellow)",
  startup: "var(--cat-pink)",
  open_source: "var(--cat-gray)",
  camp: "var(--cat-teal)",
  conference: "var(--cat-brown)",
};

export const STATUSES = ["interested", "preparing", "applied", "accepted", "rejected", "skipped"] as const;
export type TrackingStatus = (typeof STATUSES)[number];

export const TRACKING: TrackingStatus[] = ["interested", "preparing", "applied"];
