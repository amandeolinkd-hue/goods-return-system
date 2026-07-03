import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";

// Creates one test user per non-admin role (idempotent). Password: test1234
async function main() {
  const { db } = await import("../db/index");
  const { users } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  const testUsers = [
    { name: "Kalbadevi Staff", email: "kalbadevi@ldsilk.com", role: "kalbadevi" as const },
    { name: "Bhiwandi Staff", email: "bhiwandi@ldsilk.com", role: "bhiwandi" as const },
  ];
  const passwordHash = await bcrypt.hash("test1234", 10);

  for (const u of testUsers) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1);
    if (existing.length) {
      console.log(`- ${u.email} already exists`);
      continue;
    }
    await db.insert(users).values({ ...u, passwordHash });
    console.log(`✓ created ${u.email} (${u.role}) — password test1234`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
