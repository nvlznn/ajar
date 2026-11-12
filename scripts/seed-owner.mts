/**
 * Create the owner user (first OWNER_EMAILS entry) before first Google login, and import
 * the profile from private/profile.md (gitignored — never commit personal data).
 *   npm run seed:owner
 * Re-running only fills empty structured fields and replaces the markdown if the file changed.
 */
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { profiles, user } from "@/db/schema";
import { allowedEmails } from "@/lib/owner";

const email = allowedEmails()[0];
if (!email) throw new Error("OWNER_EMAILS is empty");

let [owner] = await db.select().from(user).where(eq(user.email, email));
if (!owner) {
  [owner] = await db
    .insert(user)
    .values({ id: randomUUID(), name: process.env.OWNER_NAME ?? "Owner", email, emailVerified: true })
    .returning();
  console.log(`created user ${email}`);
} else {
  console.log(`user ${email} exists`);
}

const mdPath = "private/profile.md";
const fieldsPath = "private/profile-fields.json";
const markdown = existsSync(mdPath) ? readFileSync(mdPath, "utf8") : "";
const seedFields: Record<string, string> = existsSync(fieldsPath) ? JSON.parse(readFileSync(fieldsPath, "utf8")) : {};

const [existing] = await db.select().from(profiles).where(eq(profiles.userId, owner.id));
if (!existing) {
  await db.insert(profiles).values({ userId: owner.id, markdown, fields: seedFields });
  console.log(`profile created (${markdown.length} chars, ${Object.keys(seedFields).length} fields)`);
} else {
  const fields = { ...seedFields, ...existing.fields };
  const changed = (markdown && markdown !== existing.markdown) || Object.keys(fields).length !== Object.keys(existing.fields).length;
  if (changed) {
    await db
      .update(profiles)
      .set({
        fields,
        markdown: markdown || existing.markdown,
        version: sql`${profiles.version} + 1`,
        updatedAt: sql`now()`,
      })
      .where(eq(profiles.userId, owner.id));
    console.log("profile updated");
  } else {
    console.log("profile unchanged");
  }
}
