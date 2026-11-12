/**
 * Import a JSON array of opportunities (OpportunityInput[]) straight into the DB.
 *   npm run ingest:file -- path/to/items.json [source-label]
 * Remote agents should use POST /api/ingest instead; this is for local batches.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { ingest } from "@/lib/ingest";

const [file, source] = process.argv.slice(2);
if (!file) {
  console.error("usage: npm run ingest:file -- <items.json> [source]");
  process.exit(1);
}
const items = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(items)) throw new Error("expected a JSON array");

const res = await ingest(items, source ?? `file:${basename(file)}`);
console.log(JSON.stringify({ ...res, errors: res.errors.slice(0, 20), errorCount: res.errors.length }, null, 2));
