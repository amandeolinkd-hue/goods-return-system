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

// Rows in a sheet that have a Total Value (col 12) but NO valid LD id (col 0).
function findStray(rows: string[][] | null, name: string) {
  if (!rows) return;
  console.log(`\n=== ${name}: rows with a Total Value but no LD id ===`);
  let total = 0;
  rows.slice(1).forEach((r, i) => {
    const id = String(r[0] ?? "").trim();
    const val = num(r[12]);
    if (val != null && !/^LD-\d+/i.test(id)) {
      total += val;
      console.log(
        `  sheet row ${i + 2}: id="${r[0]}" party="${r[6] ?? ""}" bill="${r[1] ?? ""}" fabric="${r[8] ?? ""}" total=₹${val.toLocaleString("en-IN")}`
      );
    }
  });
  console.log(`  --> total of these = ₹${total.toLocaleString("en-IN")}`);
}

findStray(findCsv("bhiwandi"), "Bhiwandi");
findStray(findCsv("kalbadevi"), "Kalbadevi");
