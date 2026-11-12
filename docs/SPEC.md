# Ajar — Spec

`ajar.noky.dev` · repo `nvlznn/ajar` (private) · agreed 2026-11-12

Ajar collects every opportunity a student can join or apply for (hackathons, exchange, internships, labs, competitions, programs, …) from anywhere on the web, and organizes them by deadline. Phase 1: single user (Ino). Architecture is SaaS-ready from day one.

## Principles
- **Two data layers.** Opportunity data is neutral and shared. Everything personal (status, scores, profile, applications) is per-user.
- **Collect broadly, filter at display time.** Never drop an opportunity at ingest because of eligibility; score it instead.
- **All writes go through `POST /api/ingest`** (bearer token). Agents never hold DB credentials. Ingest validates, dedupes, and writes a revision row.

## Scope
- Categories: `hackathon`, `exchange`, `internship`, `lab`, `competition`, `program` (gov/foundation, e.g. 青年百億), `scholarship`, `startup`, `open_source`, `camp`, `conference` (CFPs).
- Time: open deadlines; annually recurring items not yet announced (dates estimated from last year, flagged `estimated`); expired items archived (hidden by default).
- Region: worldwide. User setting toggles between "Taiwan + online + funded overseas programs" and "everything".
- Internships: summer 2027, part-time during semester (checked against availability: no Sundays, no Sat after 17:00), off-cycle / co-op.
- Exchange: NTU university-level call as parent item; partner schools as child items (GPA, language threshold, quota). Other channels (college-level, Erasmus+, JASSO) are their own items.
- Labs: separate professor CRM (NTU CSIE/IM/Finance/Econ/EE + Academia Sinica CITI/IIS/Econ). Status: not contacted → emailed → interview → joined. Overseas research internships are normal opportunities.
- Eligibility: every item gets `eligible | maybe | ineligible` + fit score 0–100 + one-line reason. `ineligible` hidden by default.

## Data model (Neon Postgres)
- `opportunities` — title (original language), category, organizer, url, source, location, language, multi-stage timeline (each stage can be `estimated`), eligibility, compensation, requirements, `prep_days_estimate`, `recurring_annual`, `last_verified_at`, `parent_id` (exchange schools).
- `opportunity_revisions` — before/after + source for every insert/update (audit, revert, "changed this week").
- `professors` — CRM.
- Profile, 3 layers + attachments: structured fields (name, DOB, GPA, test scores, links…), experience entries (education/work/projects/awards/skills, zh+en), answer bank (reusable essay answers, versioned). Attachments (resume, transcript) in private Vercel Blob.
- `scores` (per user × opportunity) — eligibility, score, reason; recomputed in bulk when profile changes.
- `user_status` — interested → preparing → applied → result.
- `applications` — questions for an opportunity, per-question drafts, final submitted version. Foundation for auto-fill.

## Ingestion
- Long-tail: Claude Code cloud routines (cost 0, uses subscription). New-item search weekly (Sunday night). Re-verify weekly; items due within 14 days every 2–3 days.
- Structured sources (Devpost, MLH, 104, Cake): scrapers on GitHub Actions, daily.
- New items auto-publish with a 🆕 badge.
- SaaS later: Claude API automation (paid plan).

## Web app
- Next.js (App Router) + Tailwind + shadcn/ui on Vercel.
- **Visual design: Apple-like, minimalistic** (supersedes the earlier Notion reference). Clean and neat. **No glow** — no glowing shadows, colored shadows, gradient halos, or neon accents. Tokens and layout in [DESIGN.md](DESIGN.md).
- Auth: Better Auth + Google OAuth; allowlist `nxzvnn@gmail.com`; whole site private.
- UI in Traditional Chinese; titles kept in original language.
- Home: "due within 14 days" + "tracking" on top, deadline-sorted table below (cards on mobile), calendar tab.
- Profile editor; saving triggers rescoring.
- Settings page: theme (light / dark / system, per device), interface language (中文 / English, cookie; strings in `src/lib/i18n.ts`, opportunity content not translated), region scope, account + sign out.
- Auto-fill v1: generate per-question drafts from profile + answer bank. Browser extension later.

## Notifications
- `Notifier` abstraction. First: Discord webhook (bot with buttons later).
  - `#提醒` fires at `deadline − prep_days_estimate` (not a fixed 7 days).
  - `#每週摘要` Monday 09:00 Asia/Taipei.
  - `#新機會` new high-fit items.
- Calendar: tokenized `.ics` URL with items marked interested or beyond.

## Delivery
1. Skeleton: schema, auth, ingest API, list/detail, profile page, profile import. In parallel: search items due within 30 days → temp JSON.
2. First large crawl: deadlines through 2027-12-31 + recurring + past year history; 300–500+ items; parallel agents per category; score.
3. Automation: routines, GitHub Actions scrapers, Discord, `.ics`, professor CRM.
