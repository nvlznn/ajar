# Ajar

Collects opportunities a student can apply for (hackathons, exchange, internships, labs, competitions, programs, scholarships, …) and organizes them by deadline. Single-user for now, built to become SaaS later.

**Stack:** Next.js 16 (App Router) · Tailwind + shadcn/ui · Neon Postgres + Drizzle · Better Auth (Google) · Vercel

## Setup

Create `.env.local`:

```bash
DATABASE_URL=              # Neon pooled connection
DATABASE_URL_UNPOOLED=     # Neon direct connection (migrations)
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OWNER_EMAILS=              # comma-separated allowlist
OWNER_NAME=
INGEST_TOKEN=              # bearer token for /api/ingest
```

```bash
npm install
npm run db:migrate
npm run seed:owner   # creates the owner user; imports private/profile.md if present
npm run dev
```

## Adding opportunities

All writes go through the ingest API:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "source": "manual", "items": [ ... ] }'   # max 500 items
```

`GET /api/ingest` returns what is already stored, so agents can dedupe. For local batches: `npm run ingest:file -- items.json [source]`.

## Scripts

| Command | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | Checks |
| `npm run db:generate` / `db:migrate` | Drizzle migrations |

## Docs

- [docs/SPEC.md](docs/SPEC.md) — scope, data model, roadmap
- [docs/DESIGN.md](docs/DESIGN.md) — visual design
- [docs/SOURCES.md](docs/SOURCES.md) — data sources
