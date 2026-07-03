import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Inserts a small set of sample master data for local testing.
// Idempotent: re-running will not duplicate rows. Real data arrives via db:import.
async function main() {
  const { db } = await import("../db/index");
  const { parties, brokers, qualities, transports, partyBrokers } = await import("../db/schema");
  const { sql } = await import("drizzle-orm");

  const partyNames = ["Ambica Textiles", "Shree Fabrics", "Kohinoor Silk Mills"];
  const brokerNames = ["Rajesh Broker", "Mahesh Traders", "Suresh & Co"];
  const qualityNames = ["Georgette 60g", "Chiffon 40g", "Crepe 80g", "Satin 90g"];
  const transportNames = ["VRL Logistics", "Gati Transport", "Local Tempo"];

  const partyRows = await db
    .insert(parties)
    .values(partyNames.map((name) => ({ name })))
    .onConflictDoNothing()
    .returning();
  const brokerRows = await db
    .insert(brokers)
    .values(brokerNames.map((name) => ({ name })))
    .onConflictDoNothing()
    .returning();
  await db.insert(qualities).values(qualityNames.map((name) => ({ name }))).onConflictDoNothing();
  await db.insert(transports).values(transportNames.map((name) => ({ name }))).onConflictDoNothing();

  // Resolve ids (returning is empty for already-existing rows, so re-read).
  const allParties = await db.select().from(parties);
  const allBrokers = await db.select().from(brokers);
  void partyRows;
  void brokerRows;

  // Map every party to two brokers.
  const mappings: { partyId: number; brokerId: number }[] = [];
  for (const p of allParties) {
    for (const b of allBrokers.slice(0, 2)) {
      mappings.push({ partyId: p.id, brokerId: b.id });
    }
  }
  if (mappings.length) {
    await db.insert(partyBrokers).values(mappings).onConflictDoNothing();
  }

  const counts = await db.execute(sql`
    select
      (select count(*) from parties) as parties,
      (select count(*) from brokers) as brokers,
      (select count(*) from qualities) as qualities,
      (select count(*) from transports) as transports,
      (select count(*) from party_brokers) as party_brokers
  `);
  console.log("✓ Sample master data ready:", counts.rows[0]);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
