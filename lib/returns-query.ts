import { and, or, eq, ilike, gte, lte, desc, sql, count, asc } from "drizzle-orm";
import { db } from "@/db";
import {
  returns,
  returnItems,
  parties,
  brokers,
  transports,
  qualities,
  users,
} from "@/db/schema";

export type ReturnStatus = "posted" | "received";

export type ReturnsFilter = {
  search?: string;
  status?: ReturnStatus;
  partyId?: number;
  reason?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;

function buildWhere(f: ReturnsFilter) {
  const conds = [];
  if (f.search) {
    const q = `%${f.search}%`;
    conds.push(
      or(
        ilike(returns.displayId, q),
        ilike(returns.billNo, q),
        ilike(returns.trackingNo, q),
        ilike(parties.name, q),
        ilike(brokers.name, q)
      )
    );
  }
  if (f.status) conds.push(eq(returns.status, f.status));
  if (f.partyId) conds.push(eq(returns.partyId, f.partyId));
  if (f.reason) conds.push(eq(returns.returnReason, f.reason));
  if (f.dateFrom) conds.push(gte(returns.dated, f.dateFrom));
  if (f.dateTo) conds.push(lte(returns.dated, f.dateTo));
  return conds.length ? and(...conds) : undefined;
}

export async function getReturnsList(f: ReturnsFilter) {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = f.pageSize ?? DEFAULT_PAGE_SIZE;
  const where = buildWhere(f);

  const rowsPromise = db
    .select({
      id: returns.id,
      displayId: returns.displayId,
      dated: returns.dated,
      billNo: returns.billNo,
      trackingNo: returns.trackingNo,
      status: returns.status,
      returnReason: returns.returnReason,
      totalValue: returns.totalValue,
      partyName: parties.name,
      brokerName: brokers.name,
      createdAt: returns.createdAt,
      receivedAt: returns.receivedAt,
      bhiwandiTransportValue: returns.bhiwandiTransportValue,
      bhiwandiCharges: returns.bhiwandiCharges,
      itemCount: sql<number>`(select count(*)::int from ${returnItems} ri where ri.return_id = ${returns.id})`,
    })
    .from(returns)
    .leftJoin(parties, eq(returns.partyId, parties.id))
    .leftJoin(brokers, eq(returns.brokerId, brokers.id))
    .where(where)
    .orderBy(desc(returns.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const countPromise = db
    .select({ n: count() })
    .from(returns)
    .leftJoin(parties, eq(returns.partyId, parties.id))
    .leftJoin(brokers, eq(returns.brokerId, brokers.id))
    .where(where);

  const [rows, [{ n: total }]] = await Promise.all([rowsPromise, countPromise]);

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type ReturnListRow = Awaited<ReturnType<typeof getReturnsList>>["rows"][number];

const creator = users;

export async function getReturnDetail(id: number) {
  const [row] = await db
    .select({
      id: returns.id,
      displayId: returns.displayId,
      billNo: returns.billNo,
      entryFor: returns.entryFor,
      trackingNo: returns.trackingNo,
      dated: returns.dated,
      postedOn: returns.postedOn,
      partyId: returns.partyId,
      brokerId: returns.brokerId,
      transportId: returns.transportId,
      partyName: parties.name,
      brokerName: brokers.name,
      transportName: transports.name,
      totalValue: returns.totalValue,
      transportValue: returns.transportValue,
      otherCharges: returns.otherCharges,
      returnReason: returns.returnReason,
      customReason: returns.customReason,
      attachmentUrl: returns.attachmentUrl,
      status: returns.status,
      createdAt: returns.createdAt,
      createdByName: creator.name,
      receivedAt: returns.receivedAt,
      receivingNotes: returns.receivingNotes,
      bhiwandiTransportValue: returns.bhiwandiTransportValue,
      bhiwandiCharges: returns.bhiwandiCharges,
    })
    .from(returns)
    .leftJoin(parties, eq(returns.partyId, parties.id))
    .leftJoin(brokers, eq(returns.brokerId, brokers.id))
    .leftJoin(transports, eq(returns.transportId, transports.id))
    .leftJoin(creator, eq(returns.createdBy, creator.id))
    .where(eq(returns.id, id));

  if (!row) return null;

  const items = await db
    .select({
      id: returnItems.id,
      qualityId: returnItems.qualityId,
      qualityName: sql<string>`coalesce(${returnItems.qualityName}, ${qualities.name})`,
      quantity: returnItems.quantity,
      pieces: returnItems.pieces,
    })
    .from(returnItems)
    .leftJoin(qualities, eq(returnItems.qualityId, qualities.id))
    .where(eq(returnItems.returnId, id))
    .orderBy(asc(returnItems.id));

  // Receiver name (separate lookup to avoid a second users alias join).
  let receivedByName: string | null = null;
  if (row.status === "received") {
    const [rec] = await db
      .select({ name: users.name })
      .from(returns)
      .leftJoin(users, eq(returns.receivedBy, users.id))
      .where(eq(returns.id, id));
    receivedByName = rec?.name ?? null;
  }

  return { ...row, items, receivedByName };
}

export type ReturnDetail = NonNullable<Awaited<ReturnType<typeof getReturnDetail>>>;

/** All returns matching a filter (no pagination), flattened for CSV export. */
export async function getReturnsForExport(f: ReturnsFilter) {
  const where = buildWhere(f);
  return db
    .select({
      displayId: returns.displayId,
      dated: returns.dated,
      entryFor: returns.entryFor,
      billNo: returns.billNo,
      trackingNo: returns.trackingNo,
      partyName: parties.name,
      brokerName: brokers.name,
      reason: returns.returnReason,
      customReason: returns.customReason,
      status: returns.status,
      totalValue: returns.totalValue,
      transportValue: returns.transportValue,
      otherCharges: returns.otherCharges,
      postedOn: returns.postedOn,
      receivedAt: returns.receivedAt,
      bhiwandiTransportValue: returns.bhiwandiTransportValue,
      bhiwandiCharges: returns.bhiwandiCharges,
      items: sql<string>`(
        select string_agg(coalesce(ri.quality_name, q.name) || ' x' || ri.quantity ||
          ' (' || coalesce(ri.pieces::text, '0') || ' pcs)', ' | ')
        from ${returnItems} ri left join ${qualities} q on q.id = ri.quality_id
        where ri.return_id = ${returns.id}
      )`,
    })
    .from(returns)
    .leftJoin(parties, eq(returns.partyId, parties.id))
    .leftJoin(brokers, eq(returns.brokerId, brokers.id))
    .where(where)
    .orderBy(desc(returns.id));
}

export async function getReturnStats() {
  const [r] = await db
    .select({
      total: count(),
      posted: sql<number>`count(*) filter (where ${returns.status} = 'posted')::int`,
      received: sql<number>`count(*) filter (where ${returns.status} = 'received')::int`,
      thisMonth: sql<number>`count(*) filter (where date_trunc('month', ${returns.dated}) = date_trunc('month', current_date))::int`,
      totalValue: sql<string>`coalesce(sum(${returns.totalValue}), 0)`,
    })
    .from(returns);
  return r;
}

/** Distinct parties that actually appear on returns — for the filter dropdown. */
export async function getReturnFilterParties() {
  return db
    .selectDistinct({ id: parties.id, name: parties.name })
    .from(returns)
    .innerJoin(parties, eq(returns.partyId, parties.id))
    .orderBy(asc(parties.name));
}
