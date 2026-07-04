"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { parties, brokers, qualities, transports, partyBrokers } from "@/db/schema";
import { requireRole } from "@/lib/rbac";
import type { MasterType } from "@/lib/master-data";

export type QuickAddResult = { id?: number; name?: string; error?: string };

/**
 * Creates (or finds) a master-data entry directly from the entry form, so users
 * don't have to leave the form to add a missing party/broker/quality/transport.
 * When adding a broker with a party selected, it also maps the broker to that
 * party so it appears for that party next time.
 */
export async function quickAddMaster(
  type: MasterType,
  rawName: string,
  partyId?: number
): Promise<QuickAddResult> {
  await requireRole("admin", "kalbadevi");
  const name = rawName.trim();
  if (!name) return { error: "Please enter a name." };
  if (name.length > 255) return { error: "Name is too long." };

  try {
    let id: number | undefined;

    if (type === "parties") {
      const [row] = await db.insert(parties).values({ name }).onConflictDoNothing().returning({ id: parties.id });
      id = row?.id ?? (await db.select({ id: parties.id }).from(parties).where(eq(parties.name, name)).limit(1))[0]?.id;
    } else if (type === "brokers") {
      const [row] = await db.insert(brokers).values({ name }).onConflictDoNothing().returning({ id: brokers.id });
      id = row?.id ?? (await db.select({ id: brokers.id }).from(brokers).where(eq(brokers.name, name)).limit(1))[0]?.id;
      if (id && partyId) {
        await db.insert(partyBrokers).values({ partyId, brokerId: id }).onConflictDoNothing();
      }
    } else if (type === "qualities") {
      const [row] = await db.insert(qualities).values({ name }).onConflictDoNothing().returning({ id: qualities.id });
      id = row?.id ?? (await db.select({ id: qualities.id }).from(qualities).where(eq(qualities.name, name)).limit(1))[0]?.id;
    } else {
      const [row] = await db.insert(transports).values({ name }).onConflictDoNothing().returning({ id: transports.id });
      id = row?.id ?? (await db.select({ id: transports.id }).from(transports).where(eq(transports.name, name)).limit(1))[0]?.id;
    }

    if (!id) return { error: "Could not add. Please try again." };
    revalidatePath("/admin/master-data");
    return { id, name };
  } catch (e) {
    console.error("quickAddMaster failed", e);
    return { error: "Could not add. Please try again." };
  }
}
