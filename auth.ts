import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { authConfig } from "./auth.config";
import { db } from "@/db";
import { users } from "@/db/schema";

// One-tap office login. The login page sends `office` = "head" | "bhiwandi";
// we map it to the matching office user row (no password). Returning the real
// DB id keeps created_by / received_by attribution working.
const OFFICE_EMAIL: Record<string, string> = {
  head: "head-office@ldsilk.local",
  bhiwandi: "bhiwandi-office@ldsilk.local",
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: { office: { label: "Office", type: "text" } },
      authorize: async (raw) => {
        const office = String(raw?.office ?? "").trim().toLowerCase();
        const email = OFFICE_EMAIL[office];
        if (!email) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user || !user.active) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
