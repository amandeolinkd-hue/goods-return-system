import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Integration test for the core return-insert path (sequence + return + items).
// Exercises the SAME code the createReturn action uses, then verifies the row.
async function main() {
  const { db } = await import("../db/index");
  const { parties, brokers, qualities, returns, returnItems } = await import("../db/schema");
  const { insertReturn } = await import("../lib/returns");
  const { eq } = await import("drizzle-orm");

  const [party] = await db.select().from(parties).limit(1);
  const [broker] = await db.select().from(brokers).limit(1);
  const qs = await db.select().from(qualities).limit(2);
  if (!party || !broker || qs.length < 2) {
    throw new Error("Run `npm run seed:sample` first (need parties, brokers, qualities).");
  }

  const displayId = await insertReturn(
    {
      billNo: "TEST-001",
      entryFor: "Lorry Receipt (LR)",
      trackingNo: "LR-9999",
      dated: "2026-07-03",
      postedOn: "2026-07-03",
      partyId: party.id,
      brokerId: broker.id,
      transportId: undefined,
      totalValue: 12345.5,
      transportValue: 500,
      otherCharges: undefined,
      returnReason: "Bad Quality",
      customReason: undefined,
      items: [
        { qualityId: qs[0].id, quantity: 100.5, pieces: 5 },
        { qualityId: qs[1].id, quantity: 60, pieces: 3 },
      ],
    },
    { createdBy: null, attachmentUrl: null }
  );

  const [row] = await db.select().from(returns).where(eq(returns.displayId, displayId));
  const items = await db.select().from(returnItems).where(eq(returnItems.returnId, row.id));

  console.log("✓ Inserted", displayId, "party=", party.name, "items=", items.length);
  console.log("  totalValue=", row.totalValue, "status=", row.status);
  console.log(
    "  lines:",
    items.map((i) => `${i.qualityName} x${i.quantity} (${i.pieces} pcs)`).join(" | ")
  );

  if (items.length !== 2) throw new Error("Expected 2 item rows");
  if (!/^LD-\d{4,}$/.test(displayId)) throw new Error("Bad display id format");
  console.log("PASS");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
