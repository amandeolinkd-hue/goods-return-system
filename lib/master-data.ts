import { asc, eq, sql, ilike, count } from "drizzle-orm";
import { db } from "@/db";
import { parties, brokers, qualities, transports, partyBrokers } from "@/db/schema";

export type Option = { id: number; name: string };

export type MasterType = "parties" | "brokers" | "qualities" | "transports";

/** Paginated, searchable list of a master-data table (for the admin page). */
export async function getMasterList(
  type: MasterType,
  q: string,
  page: number,
  pageSize = 25
) {
  const like = `%${q}%`;
  const offset = (Math.max(1, page) - 1) * pageSize;

  let rows: Option[] = [];
  let total = 0;

  if (type === "parties") {
    const where = q ? ilike(parties.name, like) : undefined;
    [rows, [{ n: total }]] = await Promise.all([
      db.select({ id: parties.id, name: parties.name }).from(parties).where(where).orderBy(asc(parties.name)).limit(pageSize).offset(offset),
      db.select({ n: count() }).from(parties).where(where),
    ]);
  } else if (type === "brokers") {
    const where = q ? ilike(brokers.name, like) : undefined;
    [rows, [{ n: total }]] = await Promise.all([
      db.select({ id: brokers.id, name: brokers.name }).from(brokers).where(where).orderBy(asc(brokers.name)).limit(pageSize).offset(offset),
      db.select({ n: count() }).from(brokers).where(where),
    ]);
  } else if (type === "qualities") {
    const where = q ? ilike(qualities.name, like) : undefined;
    [rows, [{ n: total }]] = await Promise.all([
      db.select({ id: qualities.id, name: qualities.name }).from(qualities).where(where).orderBy(asc(qualities.name)).limit(pageSize).offset(offset),
      db.select({ n: count() }).from(qualities).where(where),
    ]);
  } else {
    const where = q ? ilike(transports.name, like) : undefined;
    [rows, [{ n: total }]] = await Promise.all([
      db.select({ id: transports.id, name: transports.name }).from(transports).where(where).orderBy(asc(transports.name)).limit(pageSize).offset(offset),
      db.select({ n: count() }).from(transports).where(where),
    ]);
  }

  return {
    rows,
    total,
    page: Math.max(1, page),
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Row counts for each master table (for the tab badges). */
export async function getMasterCounts() {
  const [r] = await db
    .execute(
      sql`select
        (select count(*)::int from parties) as parties,
        (select count(*)::int from brokers) as brokers,
        (select count(*)::int from qualities) as qualities,
        (select count(*)::int from transports) as transports`
    )
    .then((res) => res.rows as { parties: number; brokers: number; qualities: number; transports: number }[]);
  return r;
}

/** Cheap existence check — does any party/quality master data exist yet? */
export async function hasMasterData(): Promise<boolean> {
  const [row] = await db.execute(
    sql`select exists(select 1 from parties) and exists(select 1 from qualities) as ok`
  ).then((r) => r.rows as { ok: boolean }[]);
  return !!row?.ok;
}

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
