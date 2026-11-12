import { z } from "zod";

export const CATEGORIES = [
  "hackathon",
  "exchange",
  "internship",
  "lab",
  "competition",
  "program",
  "scholarship",
  "startup",
  "open_source",
  "camp",
  "conference",
] as const;

export const STAGE_KINDS = [
  "registration_open",
  "registration_deadline",
  "preliminary",
  "final",
  "result",
  "event_start",
  "event_end",
  "other",
] as const;

const dateish = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/, "expected YYYY-MM-DD or ISO datetime");

export const stageInput = z.object({
  kind: z.enum(STAGE_KINDS),
  label: z.string(),
  start: dateish,
  end: dateish.nullish(),
  estimated: z.boolean().nullish(),
});

/** One opportunity as produced by agents / scrapers. Unknown → null. */
export const opportunityInput = z.object({
  /** Optional explicit dedupe key; defaults to normalized url. */
  key: z.string().nullish(),
  /** Key (or url) of the parent item, e.g. exchange partner school → NTU exchange call. */
  parent_key: z.string().nullish(),
  title: z.string().min(1),
  category: z.enum(CATEGORIES),
  organizer: z.string().nullish(),
  url: z.string().url(),
  source_url: z.string().nullish(),
  summary: z.string().nullish(),
  location: z
    .object({
      mode: z.enum(["online", "onsite", "hybrid"]).nullish(),
      country: z.string().nullish(),
      city: z.string().nullish(),
    })
    .nullish(),
  language: z.string().nullish(),
  stages: z.array(stageInput).default([]),
  eligibility: z
    .object({
      text: z.string().nullish(),
      student_levels: z.array(z.string()).nullish(),
      nationality: z.string().nullish(),
      team_size: z.object({ min: z.number().nullish(), max: z.number().nullish() }).nullish(),
    })
    .nullish(),
  compensation: z
    .object({
      prize: z.string().nullish(),
      salary: z.string().nullish(),
      travel_support: z.string().nullish(),
      fee: z.string().nullish(),
    })
    .nullish(),
  requirements: z.array(z.string()).nullish(),
  prep_days_estimate: z.number().int().nonnegative().nullish(),
  recurring_annual: z.boolean().nullish(),
  tags: z.array(z.string()).nullish(),
  confidence: z.enum(["high", "low"]).nullish(),
  /** Fit for the owner (phase 1). Stored in the per-user scores table, never on the shared row. */
  fit: z
    .object({
      eligibility: z.enum(["eligible", "maybe", "ineligible"]),
      score: z.number().min(0).max(100),
      reason: z.string().nullish(),
    })
    .nullish(),
});

export type OpportunityInput = z.infer<typeof opportunityInput>;
