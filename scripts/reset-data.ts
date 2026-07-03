import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Clears all business data (returns, items, master data) but KEEPS user
// accounts. Run before a fresh import. Resets identity sequences too.
async function main() {
  const { db } = await import("../db/index");
  const { sql } = await import("drizzle-orm");

  await db.execute(sql`
    TRUNCATE return_items, returns, party_brokers, parties, brokers, qualities, transports
    RESTART IDENTITY CASCADE
  `);
  // Reset the LD display-id sequence back to the start.
  await db.execute(sql`select setval('return_display_seq', 1, false)`);

  console.log("✓ Cleared returns, items and master data (users kept).");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
