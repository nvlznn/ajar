import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  primaryKey,
  index,
  pgEnum,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// ─── Auth (Better Auth) ────────────────────────────────────────────────────
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Shared opportunity layer ──────────────────────────────────────────────
export const categoryEnum = pgEnum("category", [
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
]);

export type Stage = {
  kind:
    | "registration_open"
    | "registration_deadline"
    | "preliminary"
    | "final"
    | "result"
    | "event_start"
    | "event_end"
    | "other";
  label: string;
  start: string; // YYYY-MM-DD or ISO datetime
  end?: string | null;
  estimated?: boolean;
};

export type Eligibility = {
  text?: string | null;
  student_levels?: string[] | null;
  nationality?: string | null;
  team_size?: { min?: number | null; max?: number | null } | null;
};

export type Compensation = {
  prize?: string | null;
  salary?: string | null;
  travel_support?: string | null;
  fee?: string | null;
};

export const opportunities = pgTable(
  "opportunities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Dedupe key: normalized URL unless the source supplies one (e.g. exchange partner schools). */
    key: text("key").notNull().unique(),
    parentId: uuid("parent_id").references((): AnyPgColumn => opportunities.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    category: categoryEnum("category").notNull(),
    organizer: text("organizer"),
    url: text("url").notNull(),
    sourceUrl: text("source_url"),
    summary: text("summary"),
    summaryEn: text("summary_en"),
    locationMode: text("location_mode"), // online | onsite | hybrid
    country: text("country"),
    city: text("city"),
    language: text("language"),
    stages: jsonb("stages").$type<Stage[]>().notNull().default([]),
    /** Final registration deadline, derived from stages at ingest. Null = rolling. */
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    deadlineEstimated: boolean("deadline_estimated").notNull().default(false),
    eligibility: jsonb("eligibility").$type<Eligibility>(),
    compensation: jsonb("compensation").$type<Compensation>(),
    requirements: text("requirements").array().notNull().default([]),
    prepDays: integer("prep_days"),
    recurringAnnual: boolean("recurring_annual").notNull().default(false),
    tags: text("tags").array().notNull().default([]),
    confidence: text("confidence"), // high | low
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("opportunities_deadline_idx").on(t.deadlineAt), index("opportunities_parent_idx").on(t.parentId)],
);

export const opportunityRevisions = pgTable(
  "opportunity_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // create | update
    before: jsonb("before"),
    after: jsonb("after").notNull(),
    source: text("source").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("revisions_opportunity_idx").on(t.opportunityId)],
);

// ─── Per-user layer ────────────────────────────────────────────────────────
export const scores = pgTable(
  "scores",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    eligibility: text("eligibility").notNull(), // eligible | maybe | ineligible
    score: integer("score").notNull(),
    reason: text("reason"),
    reasonEn: text("reason_en"),
    profileVersion: integer("profile_version"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.opportunityId] })],
);

export const statusEnum = pgEnum("tracking_status", [
  "interested",
  "preparing",
  "applied",
  "accepted",
  "rejected",
  "skipped",
]);

export const userStatus = pgTable(
  "user_status",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    status: statusEnum("status").notNull(),
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.opportunityId] })],
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** focus = Taiwan + online + funded overseas; all = everything */
  regionMode: text("region_mode").notNull().default("focus"),
  icsToken: text("ics_token"),
  discordWebhookUrl: text("discord_webhook_url"),
});

// Profile — three layers + attachments (structured fields feed future auto-fill)
export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  /** Layer 1: structured key/value fields (name_en, dob, gpa, phone, links…). */
  fields: jsonb("fields").$type<Record<string, string>>().notNull().default({}),
  /** Free-form master profile (markdown) — what scoring agents read. */
  markdown: text("markdown").notNull().default(""),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profileEntries = pgTable("profile_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // education | work | project | award | skill | activity
  title: text("title").notNull(),
  org: text("org"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  descriptionZh: text("description_zh"),
  descriptionEn: text("description_en"),
  url: text("url"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const answerBank = pgTable("answer_bank", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  questionKey: text("question_key").notNull(), // motivation | failure | leadership | why_me …
  question: text("question").notNull(),
  answerZh: text("answer_zh"),
  answerEn: text("answer_en"),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // resume | transcript | certificate | other
  filename: text("filename").notNull(),
  blobUrl: text("blob_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ApplicationQuestion = {
  id: string;
  prompt: string;
  limit?: string | null;
  draft?: string | null;
  final?: string | null;
};

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  opportunityId: uuid("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  questions: jsonb("questions").$type<ApplicationQuestion[]>().notNull().default([]),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Professor CRM (phase 3) ───────────────────────────────────────────────
export const professors = pgTable("professors", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  institution: text("institution").notNull(),
  department: text("department"),
  title: text("title"),
  researchAreas: text("research_areas").array().notNull().default([]),
  homepage: text("homepage"),
  email: text("email"),
  acceptsUndergrad: text("accepts_undergrad"),
  recentWork: text("recent_work"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const professorContacts = pgTable(
  "professor_contacts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    professorId: uuid("professor_id")
      .notNull()
      .references(() => professors.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("not_contacted"), // not_contacted | emailed | interview | joined
    score: integer("score"),
    reason: text("reason"),
    note: text("note"),
    lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.professorId] })],
);
