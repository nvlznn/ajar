import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";
import { allowedEmails } from "@/lib/owner";

// Remove this check to open up as SaaS.
function assertAllowed(email: string | null | undefined) {
  if (!email || !allowedEmails().includes(email.toLowerCase())) {
    throw new APIError("FORBIDDEN", { message: "This account is not allowed." });
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  // Signed session snapshot in a cookie: getSession() skips the DB for 5 minutes at a time.
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  // The owner user row is seeded before first login; link the Google account to it.
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  databaseHooks: {
    user: {
      create: {
        before: async (u) => {
          assertAllowed(u.email);
          return { data: u };
        },
      },
    },
    session: {
      create: {
        before: async (s) => {
          const [row] = await db
            .select({ email: user.email })
            .from(user)
            .where(eq(user.id, s.userId));
          assertAllowed(row?.email);
          return { data: s };
        },
      },
    },
  },
  plugins: [nextCookies()],
});
