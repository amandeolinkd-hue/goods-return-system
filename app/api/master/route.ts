import { NextRequest, NextResponse } from "next/server";
import { ilike, eq, asc, and } from "drizzle-orm";
import { db } from "@/db";
import { parties, brokers, qualities, transports, partyBrokers } from "@/db/schema";
import { getCurrentUser } from "@/lib/rbac";

type Option = { id: number; name: string };

// Server-side search for the entry-form pickers, so pages stay light and the
// browser never loads thousands of master rows at once.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ options: [] }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const type = sp.get("type");
  const q = (sp.get("q") ?? "").trim();
  const like = `%${q}%`;

  let options: Option[] = [];

  if (type === "party") {
    options = await db
      .select({ id: parties.id, name: parties.name })
      .from(parties)
      .where(q ? ilike(parties.name, like) : undefined)
      .orderBy(asc(parties.name))
      .limit(50);
  } else if (type === "quality") {
    options = await db
      .select({ id: qualities.id, name: qualities.name })
      .from(qualities)
      .where(q ? ilike(qualities.name, like) : undefined)
      .orderBy(asc(qualities.name))
      .limit(50);
  } else if (type === "transport") {
    options = await db
      .select({ id: transports.id, name: transports.name })
      .from(transports)
      .where(q ? ilike(transports.name, like) : undefined)
      .orderBy(asc(transports.name))
      .limit(50);
  } else if (type === "broker") {
    const partyId = Number(sp.get("partyId"));
    if (Number.isInteger(partyId) && partyId > 0) {
      options = await db
        .select({ id: brokers.id, name: brokers.name })
        .from(partyBrokers)
        .innerJoin(brokers, eq(partyBrokers.brokerId, brokers.id))
        .where(
          q
            ? and(eq(partyBrokers.partyId, partyId), ilike(brokers.name, like))
            : eq(partyBrokers.partyId, partyId)
        )
        .orderBy(asc(brokers.name))
        .limit(50);

      // If the party has NO broker mappings at all (e.g. a newly-added party),
      // fall back to all brokers so the field isn't stuck empty.
      if (options.length === 0) {
        const anyMapping = await db
          .select({ b: partyBrokers.brokerId })
          .from(partyBrokers)
          .where(eq(partyBrokers.partyId, partyId))
          .limit(1);
        if (anyMapping.length === 0) {
          options = await db
            .select({ id: brokers.id, name: brokers.name })
            .from(brokers)
            .where(q ? ilike(brokers.name, like) : undefined)
            .orderBy(asc(brokers.name))
            .limit(50);
        }
      }
    }
  } else {
    return NextResponse.json({ error: "unknown type" }, { status: 400 });
  }

  return NextResponse.json({ options });
}
