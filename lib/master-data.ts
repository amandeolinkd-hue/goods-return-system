import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { parties, brokers, qualities, transports, partyBrokers } from "@/db/schema";

export type Option = { id: number; name: string };

export type FormMasterData = {
  parties: Option[];
  qualities: Option[];
  transports: Option[];
  brokersByParty: Record<number, Option[]>;
};

/** Loads everything the entry form needs (replaces the old getFormData). */
export async function getFormMasterData(): Promise<FormMasterData> {
  const [partyRows, qualityRows, transportRows, mappingRows] = await Promise.all([
    db.select().from(parties).orderBy(asc(parties.name)),
    db.select().from(qualities).orderBy(asc(qualities.name)),
    db.select().from(transports).orderBy(asc(transports.name)),
    db
      .select({
        partyId: partyBrokers.partyId,
        brokerId: brokers.id,
        brokerName: brokers.name,
      })
      .from(partyBrokers)
      .innerJoin(brokers, eq(partyBrokers.brokerId, brokers.id)),
  ]);

  const brokersByParty: Record<number, Option[]> = {};
  for (const m of mappingRows) {
    (brokersByParty[m.partyId] ??= []).push({ id: m.brokerId, name: m.brokerName });
  }
  for (const key of Object.keys(brokersByParty)) {
    brokersByParty[Number(key)].sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    parties: partyRows.map((p) => ({ id: p.id, name: p.name })),
    qualities: qualityRows.map((q) => ({ id: q.id, name: q.name })),
    transports: transportRows.map((t) => ({ id: t.id, name: t.name })),
    brokersByParty,
  };
}
