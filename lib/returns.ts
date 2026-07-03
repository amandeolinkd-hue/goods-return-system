import { sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import { returns, returnItems, qualities } from "@/db/schema";
import type { ReturnInput } from "@/lib/validation";

/**
 * Inserts a return and its item lines atomically, assigning the next LD-####
 * id from the Postgres sequence. Returns the new display id.
 * Shared by the createReturn server action and integration tests.
 */
export async function insertReturn(
  data: ReturnInput,
  opts: { createdBy: number | null; attachmentUrl: string | null }
): Promise<string> {
  // Snapshot quality names alongside their ids.
  const qids = [...new Set(data.items.map((i) => i.qualityId))];
  const qrows = qids.length
    ? await db.select({ id: qualities.id, name: qualities.name }).from(qualities).where(inArray(qualities.id, qids))
    : [];
  const qname = new Map(qrows.map((q) => [q.id, q.name]));

  return db.transaction(async (tx) => {
    const seq = await tx.execute(sql`select nextval('return_display_seq') as n`);
    const n = Number((seq.rows[0] as { n: string | number }).n);
    const displayId = "LD-" + String(n).padStart(4, "0");

    const [ret] = await tx
      .insert(returns)
      .values({
        displayId,
        billNo: data.billNo || null,
        entryFor: data.entryFor,
        trackingNo: data.trackingNo || null,
        dated: data.dated,
        postedOn: data.postedOn || null,
        partyId: data.partyId,
        brokerId: data.brokerId,
        transportId: data.transportId ?? null,
        totalValue: data.totalValue?.toString() ?? null,
        transportValue: data.transportValue?.toString() ?? null,
        otherCharges: data.otherCharges?.toString() ?? null,
        returnReason: data.returnReason,
        customReason: data.returnReason === "Other" ? data.customReason || null : null,
        attachmentUrl: opts.attachmentUrl,
        status: "posted",
        createdBy: opts.createdBy,
      })
      .returning({ id: returns.id });

    await tx.insert(returnItems).values(
      data.items.map((it) => ({
        returnId: ret.id,
        qualityId: it.qualityId,
        qualityName: qname.get(it.qualityId) ?? null,
        quantity: it.quantity.toString(),
        pieces: it.pieces ?? null,
      }))
    );

    return displayId;
  });
}
