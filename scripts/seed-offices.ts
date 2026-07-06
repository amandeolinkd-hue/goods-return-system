import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Ensures the two "office" login accounts exist. These back the one-tap
// Head Office / Bhiwandi Office logins and are recorded as created_by /
// received_by on entries. Passwords are unused (login is office-based).
async function main() {
  const { db } = await import("../db/index");
  const { users } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  const PLACEHOLDER = "office-login-no-password";
  const offices = [
    { name: "Head Office", email: "head-office@ldsilk.local", role: "admin" as const },
    { name: "Bhiwandi Office", email: "bhiwandi-office@ldsilk.local", role: "bhiwandi" as const },
  ];

  for (const o of offices) {
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, o.email)).limit(1);
    if (existing.length) {
      // keep role/name in sync in case they were changed
      await db.update(users).set({ name: o.name, role: o.role, active: true }).where(eq(users.email, o.email));
      console.log(`- ${o.name} already exists (id ${existing[0].id}) — synced`);
    } else {
      const [row] = await db
        .insert(users)
        .values({ name: o.name, email: o.email, role: o.role, passwordHash: PLACEHOLDER })
        .returning({ id: users.id });
      console.log(`✓ created ${o.name} (id ${row.id}, role ${o.role})`);
    }
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
