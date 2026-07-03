import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";

async function main() {
  // Dynamic imports so dotenv runs before the DB client reads DATABASE_URL.
  const { db } = await import("../db/index");
  const { users } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@ldsilk.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "admin1234";
  const name = process.env.SEED_ADMIN_NAME || "Administrator";

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log(`Admin "${email}" already exists (id ${existing[0].id}). Nothing to do.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [u] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: "admin" })
    .returning();

  console.log("✓ Created admin user");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log(`  id:       ${u.id}`);
  console.log("Change this password after your first login (Users page).");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
