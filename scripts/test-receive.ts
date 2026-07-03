import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Verifies the receiving state-flip and the double-receive guard (the same
// guarded UPDATE the markReceived action runs).
async function main() {
  const { db } = await import("../db/index");
  const { returns, users } = await import("../db/schema");
  const { and, eq } = await import("drizzle-orm");

  const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  const [posted] = await db.select().from(returns).where(eq(returns.status, "posted")).limit(1);
  if (!posted) {
    console.log("No posted returns to receive — skipping.");
    process.exit(0);
  }

  const first = await db
    .update(returns)
    .set({ status: "received", receivedBy: admin.id, receivedAt: new Date(), receivingNotes: "Test receipt" })
    .where(and(eq(returns.id, posted.id), eq(returns.status, "posted")))
    .returning({ id: returns.id });

  const second = await db
    .update(returns)
    .set({ status: "received", receivedBy: admin.id, receivedAt: new Date() })
    .where(and(eq(returns.id, posted.id), eq(returns.status, "posted")))
    .returning({ id: returns.id });

  const [row] = await db.select().from(returns).where(eq(returns.id, posted.id));

  console.log(`Return ${posted.displayId}: firstUpdate=${first.length} secondUpdate=${second.length}`);
  console.log(`  status=${row.status} receivedBy=${row.receivedBy} receivedAt=${row.receivedAt?.toISOString?.() ?? row.receivedAt}`);

  if (first.length !== 1) throw new Error("Expected first receive to update 1 row");
  if (second.length !== 0) throw new Error("Double-receive guard failed");
  if (row.status !== "received") throw new Error("Status not flipped");
  console.log("PASS");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
