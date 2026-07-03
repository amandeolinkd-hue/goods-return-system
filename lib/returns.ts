import { sql, inArray, eq } from "drizzle-orm";
import { db } from "@/db";
import { returns, returnItems, qualities } from "@/db/schema";
import type { ReturnInput } from "@/lib/validation";

/**
 * Inserts a return and its item lines atomically, assigning the next LD-####
 * id from the Postgres sequence. Returns the new display id.
 * Shared by the createReturn server action and integration tests.
 */
async function qualityNameMap(items: ReturnInput["items"]) {
  const qids = [...new Set(items.map((i) => i.qualityId))];
  const qrows = qids.length
    ? await db.select({ id: qualities.id, name: qualities.name }).from(qualities).where(inArray(qualities.id, qids))
    : [];
  return new Map(qrows.map((q) => [q.id, q.name]));
}

export async function insertReturn(
  data: ReturnInput,
  opts: { createdBy: number | null; attachmentUrl: string | null }
): Promise<{ id: number; displayId: string }> {
  const qname = await qualityNameMap(data.items);

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

    return { id: ret.id, displayId };
  });
}

/**
 * Updates an existing return's editable fields and fully replaces its item
 * lines. Leaves displayId, status and receiving info untouched.
 * `attachmentUrl` of `undefined` keeps the existing attachment.
 */
export async function updateReturnRecord(
  id: number,
  data: ReturnInput,
  opts: { attachmentUrl?: string | null }
): Promise<void> {
  const qname = await qualityNameMap(data.items);

  await db.transaction(async (tx) => {
    await tx
      .update(returns)
      .set({
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
        ...(opts.attachmentUrl !== undefined ? { attachmentUrl: opts.attachmentUrl } : {}),
      })
      .where(eq(returns.id, id));

    await tx.delete(returnItems).where(eq(returnItems.returnId, id));
    await tx.insert(returnItems).values(
      data.items.map((it) => ({
        returnId: id,
        qualityId: it.qualityId,
        qualityName: qname.get(it.qualityId) ?? null,
        quantity: it.quantity.toString(),
        pieces: it.pieces ?? null,
      }))
    );
  });
}
