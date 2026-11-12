import type { CATEGORIES } from "@/lib/opportunity-input";

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  hackathon: { label: "黑客松", color: "var(--cat-blue)" },
  exchange: { label: "出國交換", color: "var(--cat-green)" },
  internship: { label: "實習", color: "var(--cat-orange)" },
  lab: { label: "實驗室", color: "var(--cat-purple)" },
  competition: { label: "競賽", color: "var(--cat-red)" },
  program: { label: "計畫", color: "var(--cat-indigo)" },
  scholarship: { label: "獎學金", color: "var(--cat-yellow)" },
  startup: { label: "新創", color: "var(--cat-pink)" },
  open_source: { label: "開源", color: "var(--cat-gray)" },
  camp: { label: "營隊", color: "var(--cat-teal)" },
  conference: { label: "研討會", color: "var(--cat-brown)" },
};

export const STATUSES = ["interested", "preparing", "applied", "accepted", "rejected", "skipped"] as const;
export type TrackingStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<TrackingStatus, string> = {
  interested: "有興趣",
  preparing: "準備中",
  applied: "已申請",
  accepted: "錄取",
  rejected: "未錄取",
  skipped: "略過",
};

export const TRACKING: TrackingStatus[] = ["interested", "preparing", "applied"];

export const ELIGIBILITY_LABEL: Record<string, string> = {
  eligible: "符合",
  maybe: "可能",
  ineligible: "不符合",
};
