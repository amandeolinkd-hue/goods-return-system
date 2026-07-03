import { sql } from "drizzle-orm";
import { db } from "@/db";

export type StatusAgg = { status: string; n: number; value: number };
export type ReasonAgg = { reason: string; n: number; value: number };
export type PartyAgg = { party: string; n: number; value: number };
export type MonthAgg = { month: string; n: number; value: number };

export async function getReportData() {
  const [byStatus, byReason, byParty, byMonth] = await Promise.all([
    db.execute(sql`
      select status, count(*)::int as n, coalesce(sum(total_value), 0)::float as value
      from returns group by status order by status
    `),
    db.execute(sql`
      select return_reason as reason, count(*)::int as n, coalesce(sum(total_value), 0)::float as value
      from returns group by return_reason order by n desc
    `),
    db.execute(sql`
      select p.name as party, count(*)::int as n, coalesce(sum(r.total_value), 0)::float as value
      from returns r join parties p on p.id = r.party_id
      group by p.name order by n desc, value desc limit 10
    `),
    db.execute(sql`
      select to_char(date_trunc('month', dated), 'YYYY-MM') as month,
             count(*)::int as n, coalesce(sum(total_value), 0)::float as value
      from returns group by 1 order by 1 desc limit 12
    `),
  ]);

  return {
    byStatus: byStatus.rows as unknown as StatusAgg[],
    byReason: byReason.rows as unknown as ReasonAgg[],
    byParty: byParty.rows as unknown as PartyAgg[],
    byMonth: byMonth.rows as unknown as MonthAgg[],
  };
}
