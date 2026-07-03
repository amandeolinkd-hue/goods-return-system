import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";

/*
 * Migrates the legacy Google Sheets into Neon.
 *
 * Put the CSV exports in ./data — filenames just need to CONTAIN these keywords
 * (case-insensitive): "dropdown", "kalbadevi", "bhiwandi".
 *
 * Kalbadevi column order (0-indexed):
 *   0 LD id | 1 Bill | 2 Entry Choice | 3 Tracking/LR | 4 Dated | 5 Posted On |
 *   6 Party | 7 Broker | 8 Fabric(|/) | 9 QTY(|/) | 10 PCS(|/) | 11 Transport |
 *   12 Total | 13 Transport Value | 14 Other Charges | 15 Reason
 *
 * Bhiwandi column order adds:
 *   13 Transport Value (Balasaheb) | 16 Bhiwandi transport & other charges |
 *   17 Status Updated On | 18 Status (Received/Pending)
 *
 * Run:  npm run db:import           (writes)
 *       npm run db:import -- --dry  (report only)
 */

const DATA_DIR = "data";
const DRY = process.argv.includes("--dry") || process.argv.includes("--dry-run");

function findCsv(keyword: string): string[][] | null {
  if (!existsSync(DATA_DIR)) return null;
  const file = readdirSync(DATA_DIR).find(
    (f) => f.toLowerCase().endsWith(".csv") && f.toLowerCase().includes(keyword)
  );
  if (!file) return null;
  return parse(readFileSync(join(DATA_DIR, file), "utf8"), {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as string[][];
}

const splitMulti = (s: string | undefined): string[] =>
  String(s ?? "")
    .split(/[|\/]/)
    .map((x) => x.trim())
    .filter(Boolean);

const num = (s: string | undefined): string | null => {
  if (s == null) return null;
  const cleaned = String(s).replace(/[₹,\s]/g, "");
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : null;
};

const iso = (y: number, mon: number, day: number): string | null => {
  if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const parseDate = (s: string | undefined): string | null => {
  if (!s) return null;
  const v = String(s).trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  if (/^\d{4}-\d{2}-\d{2}[T ]/.test(v)) return v.slice(0, 10);

  const m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const y = Number(m[3].length === 2 ? "20" + m[3] : m[3]);
    // Indian locale is dd/mm; disambiguate when one component is > 12.
    if (a > 12 && b <= 12) return iso(y, b, a); // dd/mm
    if (b > 12 && a <= 12) return iso(y, a, b); // mm/dd
    return iso(y, b, a); // ambiguous -> assume dd/mm
  }
  if (/^\d{5}$/.test(v)) {
    const d = new Date((Number(v) - 25569) * 86400000);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const out = d.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null; // reject 6-digit years etc.
};

const REASONS = ["Bad Quality", "Wrong Delivery", "Incorrect Designs Received", "Other"];
const ENTRY_FORS = ["Lorry Receipt (LR)", "Letter Pad", "Local Delivery"];

async function main() {
  const { db } = await import("../db/index");
  const schema = await import("../db/schema");
  const { parties, brokers, qualities, transports, partyBrokers, returns, returnItems } = schema;
  const { sql } = await import("drizzle-orm");

  console.log(DRY ? "DRY RUN — no writes\n" : "IMPORT — writing to Neon\n");

  const dropdown = findCsv("dropdown");
  const kal = findCsv("kalbadevi");
  const bhiwandi = findCsv("bhiwandi");
  console.log(
    `Files: dropdown=${dropdown ? "yes" : "no"} kalbadevi=${kal ? kal.length - 1 + " rows" : "no"} bhiwandi=${bhiwandi ? bhiwandi.length - 1 + " rows" : "no"}\n`
  );

  // ---------- 1. Collect master data (dropdown + referenced in entries) ----------
  const partySet = new Set<string>();
  const brokerSet = new Set<string>();
  const qualitySet = new Set<string>();
  const transportSet = new Set<string>();
  const pbPairs: [string, string][] = [];

  if (dropdown) {
    for (const row of dropdown.slice(1)) {
      const [client, broker, quality, transport] = row;
      if (client?.trim()) partySet.add(client.trim());
      if (broker?.trim()) brokerSet.add(broker.trim());
      if (quality?.trim()) qualitySet.add(quality.trim());
      if (transport?.trim()) transportSet.add(transport.trim());
      if (client?.trim() && broker?.trim()) pbPairs.push([client.trim(), broker.trim()]);
    }
  }
  if (kal) {
    for (const row of kal.slice(1)) {
      if (row[6]?.trim()) partySet.add(row[6].trim());
      if (row[7]?.trim()) brokerSet.add(row[7].trim());
      if (row[11]?.trim()) transportSet.add(row[11].trim());
      splitMulti(row[8]).forEach((q) => qualitySet.add(q));
      if (row[6]?.trim() && row[7]?.trim()) pbPairs.push([row[6].trim(), row[7].trim()]);
    }
  }
  console.log(
    `Master: ${partySet.size} parties, ${brokerSet.size} brokers, ${qualitySet.size} qualities, ${transportSet.size} transports`
  );

  const idMap = async (
    table: typeof parties | typeof brokers | typeof qualities | typeof transports,
    names: Set<string>
  ): Promise<Map<string, number>> => {
    const list = [...names];
    if (!DRY && list.length) {
      // Insert in chunks to stay within statement limits.
      for (let i = 0; i < list.length; i += 500) {
        await db.insert(table).values(list.slice(i, i + 500).map((name) => ({ name }))).onConflictDoNothing();
      }
    }
    const map = new Map<string, number>();
    if (!DRY) {
      const rows = await db.select().from(table);
      for (const r of rows as { id: number; name: string }[]) map.set(r.name, r.id);
    } else {
      list.forEach((n, i) => map.set(n, i + 1));
    }
    return map;
  };

  const partyMap = await idMap(parties, partySet);
  const brokerMap = await idMap(brokers, brokerSet);
  const qualityMap = await idMap(qualities, qualitySet);
  const transportMap = await idMap(transports, transportSet);

  if (!DRY && pbPairs.length) {
    const seen = new Set<string>();
    const values: { partyId: number; brokerId: number }[] = [];
    for (const [p, b] of pbPairs) {
      const pid = partyMap.get(p);
      const bid = brokerMap.get(b);
      if (pid && bid && !seen.has(`${pid}:${bid}`)) {
        seen.add(`${pid}:${bid}`);
        values.push({ partyId: pid, brokerId: bid });
      }
    }
    for (let i = 0; i < values.length; i += 500) {
      await db.insert(partyBrokers).values(values.slice(i, i + 500)).onConflictDoNothing();
    }
  }

  // ---------- 2. Bhiwandi receiving data, keyed by LD id ----------
  type Recv = {
    receivedAt: string | null;
    bhiwandiTransportValue: string | null;
    bhiwandiCharges: string | null;
  };
  const recvMap = new Map<string, Recv>();
  if (bhiwandi) {
    for (const row of bhiwandi.slice(1)) {
      const id = String(row[0] ?? "").trim().toUpperCase();
      if (!/^LD-\d+/.test(id)) continue;
      // Bhiwandi columns: 13 Transport(Balasaheb) | 16 Bhiwandi charges |
      // 17 Total Transport Charges | 18 Status Updated On | 19 Status
      const statusText = String(row[19] ?? "").trim().toLowerCase();
      if (statusText !== "received") continue; // only received rows carry receipt data
      recvMap.set(id, {
        receivedAt: parseDate(row[18]),
        bhiwandiTransportValue: num(row[13]),
        bhiwandiCharges: num(row[16]),
      });
    }
    console.log(`Bhiwandi: ${recvMap.size} received rows`);
  }

  // ---------- 3. Entries (kalbadevi) ----------
  let inserted = 0;
  let maxSeq = 0;
  const warnings: string[] = [];

  if (kal) {
    for (const [i, row] of kal.slice(1).entries()) {
      const displayId = String(row[0] ?? "").trim().toUpperCase();
      if (!/^LD-\d+/.test(displayId)) {
        warnings.push(`Row ${i + 2}: invalid LD id ("${row[0]}") — skipped`);
        continue;
      }
      const seqNum = Number(displayId.replace(/^LD-/, ""));
      if (Number.isFinite(seqNum)) maxSeq = Math.max(maxSeq, seqNum);

      const partyName = row[6]?.trim();
      const brokerName = row[7]?.trim();
      if (!partyName || !brokerName) {
        warnings.push(`${displayId}: missing party/broker — skipped`);
        continue;
      }
      const partyId = partyMap.get(partyName);
      const brokerId = brokerMap.get(brokerName);
      if (!partyId || !brokerId) {
        warnings.push(`${displayId}: unresolved party/broker — skipped`);
        continue;
      }

      const dated = parseDate(row[4]) ?? parseDate(row[5]);
      if (!dated) warnings.push(`${displayId}: unparseable date "${row[4]}" — using 2000-01-01`);

      const reasonRaw = row[15]?.trim() ?? "";
      const returnReason = REASONS.includes(reasonRaw) ? reasonRaw : reasonRaw ? "Other" : "Bad Quality";
      const customReason = REASONS.includes(reasonRaw) ? null : reasonRaw || null;
      const entryFor = ENTRY_FORS.includes(row[2]?.trim() ?? "") ? row[2].trim() : "Lorry Receipt (LR)";

      const qs = splitMulti(row[8]);
      const qtys = splitMulti(row[9]);
      const pcs = splitMulti(row[10]);
      const lines = Math.max(qs.length, 1);

      const recv = recvMap.get(displayId);

      if (DRY) {
        inserted++;
        continue;
      }

      try {
      await db.transaction(async (tx) => {
        const [ret] = await tx
          .insert(returns)
          .values({
            displayId,
            billNo: row[1]?.trim() || null,
            entryFor,
            trackingNo: row[3]?.trim() || null,
            dated: dated ?? "2000-01-01",
            postedOn: parseDate(row[5]),
            partyId,
            brokerId,
            transportId: row[11]?.trim() ? transportMap.get(row[11].trim()) ?? null : null,
            totalValue: num(row[12]),
            transportValue: num(row[13]),
            otherCharges: num(row[14]),
            returnReason,
            customReason,
            attachmentUrl: null,
            status: recv ? "received" : "posted",
            receivedAt: recv?.receivedAt ? new Date(recv.receivedAt) : null,
            bhiwandiTransportValue: recv?.bhiwandiTransportValue ?? null,
            bhiwandiCharges: recv?.bhiwandiCharges ?? null,
            createdBy: null,
          })
          .onConflictDoNothing({ target: returns.displayId })
          .returning({ id: returns.id });

        if (!ret) return;

        const items = [];
        for (let j = 0; j < lines; j++) {
          const qn = qs[j] ?? qs[0];
          if (!qn) continue;
          items.push({
            returnId: ret.id,
            qualityId: qualityMap.get(qn) ?? null,
            qualityName: qn,
            quantity: num(qtys[j] ?? qtys[0]),
            pieces: pcs[j] ? Math.trunc(Number(pcs[j])) || null : null,
          });
        }
        if (items.length) await tx.insert(returnItems).values(items);
      });
      inserted++;
      } catch (e) {
        warnings.push(`${displayId}: insert failed — ` + ((e as Error).message ?? "").slice(0, 100));
      }
    }
  }

  // ---------- 4. Continue the LD sequence ----------
  if (!DRY && maxSeq > 0) {
    await db.execute(sql`select setval('return_display_seq', ${maxSeq}, true)`);
    console.log(`\nSequence set to ${maxSeq}; next new id = LD-${String(maxSeq + 1).padStart(4, "0")}`);
  }

  console.log(`${DRY ? "Would import" : "Imported"} ${inserted} returns; ${recvMap.size} marked received.`);
  if (warnings.length) {
    console.log(`\n${warnings.length} warnings:`);
    warnings.slice(0, 40).forEach((w) => console.log("  ! " + w));
    if (warnings.length > 40) console.log(`  … and ${warnings.length - 40} more`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
