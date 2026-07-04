import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";

function findCsv(keyword: string): string[][] | null {
  const dir = "data";
  if (!existsSync(dir)) return null;
  const file = readdirSync(dir).find(
    (f) => f.toLowerCase().endsWith(".csv") && f.toLowerCase().includes(keyword)
  );
  if (!file) return null;
  return parse(readFileSync(join(dir, file), "utf8"), {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as string[][];
}

const num = (s: string | undefined): number | null => {
  if (s == null) return null;
  const cleaned = String(s).replace(/[₹,\s]/g, "");
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

function analyze(rows: string[][] | null, name: string, totalCol: number) {
  if (!rows) {
    console.log(`${name}: not found`);
    return;
  }
  let sum = 0;
  let valid = 0;
  let nulls = 0;
  let noId = 0;
  for (const r of rows.slice(1)) {
    const id = String(r[0] ?? "").trim();
    if (!/^LD-\d+/i.test(id)) {
      noId++;
      continue;
    }
    const v = num(r[totalCol]);
    if (v == null) nulls++;
    else {
      sum += v;
      valid++;
    }
  }
  console.log(
    `${name}: rows(with LD id)=${valid + nulls}, blank/other=${noId}, non-null totals=${valid}, null totals=${nulls}`
  );
  console.log(`   SUM(Total Value) = ₹${sum.toLocaleString("en-IN")}`);
}

function sumWholeColumn(rows: string[][] | null, name: string, col: number) {
  if (!rows) return;
  let sum = 0;
  let cells = 0;
  for (const r of rows.slice(1)) {
    const v = num(r[col]);
    if (v != null) {
      sum += v;
      cells++;
    }
  }
  console.log(`${name}: EVERY numeric cell in column = ₹${sum.toLocaleString("en-IN")} (${cells} cells)`);
}

async function main() {
  const kal = findCsv("kalbadevi");
  const bhi = findCsv("bhiwandi");
  analyze(kal, "Kalbadevi (col 12)", 12);
  analyze(bhi, "Bhiwandi  (col 12)", 12);
  console.log("");
  sumWholeColumn(bhi, "Bhiwandi whole-column M (like Google Sheets sum)", 12);

  const { db } = await import("../db/index");
  const { sql } = await import("drizzle-orm");
  const [r] = await db
    .execute(sql`select coalesce(sum(total_value),0)::float as s, count(*) as n, count(*) filter (where total_value is null) as nulls from returns`)
    .then((res) => res.rows as { s: number; n: number; nulls: number }[]);
  console.log(`\nDB (dashboard): ${r.n} returns, ${r.nulls} with null total`);
  console.log(`   SUM(total_value) = ₹${Number(r.s).toLocaleString("en-IN")}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
