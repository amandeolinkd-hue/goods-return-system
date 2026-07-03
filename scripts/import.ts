import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";

/*
 * Migrates the legacy Google Sheets into Neon.
 *
 * Expects CSV exports in ./data :
 *   - dropdown.csv   (columns: Client | Broker | Quality | Transport, with header)
 *   - kalbadevi.csv  (the "Kalbadevi Office Entry" sheet, submitForm column order)
 *   - bhiwandi.csv   (optional — used to mark returns as received)
 *
 * Kalbadevi column order (from the old submitForm):
 *   0 LD id | 1 Bill No | 2 Entry For | 3 LR/Tracking | 4 Date | 5 Posted On |
 *   6 Client | 7 Broker | 8 Qualities(|) | 9 Quantities(|) | 10 Pieces(|) |
 *   11 Transport | 12 Total | 13 Transport Amt | 14 Other Charges | 15 Reason | 16 Attachment
 *
 * Run:  npm run db:import           (writes to Neon)
 *       npm run db:import -- --dry  (parse + report only, no writes)
 */

const DATA_DIR = "data";
const DRY = process.argv.includes("--dry") || process.argv.includes("--dry-run");

const readCsv = (name: string): string[][] | null => {
  const p = join(DATA_DIR, name);
  if (!existsSync(p)) return null;
  return parse(readFileSync(p, "utf8"), {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
  }) as string[][];
};

const splitMulti = (s: string | undefined): string[] =>
  String(s ?? "")
    .split(/[|\/]/)
    .map((x) => x.trim())
    .filter(Boolean);

const num = (s: string | undefined): string | null => {
  if (s == null) return null;
  const cleaned = String(s).replace(/[₹,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? String(n) : null;
};

/** Parse a sheet date (ISO, dd/mm/yyyy, dd-mm-yyyy, or Google serial) -> YYYY-MM-DD. */
const parseDate = (s: string | undefined): string | null => {
  if (!s) return null;
  const v = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  let m = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = "20" + y;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{5}$/.test(v)) {
    // Google/Excel serial date (days since 1899-12-30)
    const ms = (Number(v) - 25569) * 86400000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const REASONS = ["Bad Quality", "Wrong Delivery", "Incorrect Designs Received", "Other"];
const ENTRY_FORS = ["Lorry Receipt (LR)", "Letter Pad", "Local Delivery"];

async function main() {
  const { db } = await import("../db/index");
  const schema = await import("../db/schema");
  const { parties, brokers, qualities, transports, partyBrokers, returns, returnItems } = schema;
  const { sql, eq } = await import("drizzle-orm");

  console.log(DRY ? "DRY RUN — no writes\n" : "IMPORT — writing to Neon\n");

  // ---------- 1. Master data (dropdown.csv) ----------
  const dropdown = readCsv("dropdown.csv");
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

  // ---------- 2. Pre-scan entries so master data covers everything referenced ----------
  const kal = readCsv("kalbadevi.csv");
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
      await db.insert(table).values(list.map((name) => ({ name }))).onConflictDoNothing();
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
    if (values.length) await db.insert(partyBrokers).values(values).onConflictDoNothing();
  }

  // ---------- 3. Bhiwandi received set (optional) ----------
  const received = new Map<string, string | null>(); // displayId -> receivedAt date
  const bhiwandi = readCsv("bhiwandi.csv");
  if (bhiwandi) {
    for (const row of bhiwandi.slice(1)) {
      const idCell = row.find((c) => /^LD-\d+/i.test(String(c).trim()));
      if (!idCell) continue;
      const dateCell = row.map(parseDate).find(Boolean) ?? null;
      received.set(idCell.trim().toUpperCase(), dateCell);
    }
    console.log(`Bhiwandi: ${received.size} received markers`);
  }

  // ---------- 4. Entries (kalbadevi.csv) ----------
  let inserted = 0;
  let maxSeq = 0;
  const warnings: string[] = [];

  if (kal) {
    for (const [i, row] of kal.slice(1).entries()) {
      const displayId = String(row[0] ?? "").trim().toUpperCase();
      if (!/^LD-\d+/.test(displayId)) {
        warnings.push(`Row ${i + 2}: missing/invalid LD id ("${row[0]}") — skipped`);
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

      const rec = received.get(displayId);
      const isReceived = received.has(displayId);

      if (DRY) {
        inserted++;
        continue;
      }

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
            attachmentUrl: row[16]?.trim() || null,
            status: isReceived ? "received" : "posted",
            receivedAt: isReceived && rec ? new Date(rec) : null,
            createdBy: null,
          })
          .onConflictDoNothing({ target: returns.displayId })
          .returning({ id: returns.id });

        if (!ret) return; // already imported

        const items = [];
        for (let j = 0; j < lines; j++) {
          const qn = qs[j] ?? qs[0];
          if (!qn) continue;
          items.push({
            returnId: ret.id,
            qualityId: qualityMap.get(qn) ?? null,
            qualityName: qn,
            quantity: num(qtys[j] ?? qtys[0]) ?? null,
            pieces: pcs[j] ? Math.trunc(Number(pcs[j])) || null : null,
          });
        }
        if (items.length) await tx.insert(returnItems).values(items);
      });
      inserted++;
    }
  }

  // ---------- 5. Continue the LD sequence past the highest imported id ----------
  if (!DRY && maxSeq > 0) {
    await db.execute(sql`select setval('return_display_seq', ${maxSeq}, true)`);
    console.log(`Sequence set to ${maxSeq}; next new id = LD-${String(maxSeq + 1).padStart(4, "0")}`);
  }

  console.log(`\n${DRY ? "Would import" : "Imported"} ${inserted} returns.`);
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
