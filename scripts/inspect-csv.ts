import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";

// Prints the header + first few rows of every CSV in ./data so the importer
// column mapping can be confirmed against the real exports.
function main() {
  const dir = "data";
  if (!existsSync(dir)) {
    console.log(`No "${dir}/" folder found. Create it and drop your CSV exports there.`);
    process.exit(0);
  }
  const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".csv"));
  if (files.length === 0) {
    console.log(`No CSV files in "${dir}/".`);
    process.exit(0);
  }

  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");
    const rows = parse(raw, { relax_column_count: true, skip_empty_lines: true }) as string[][];
    console.log(`\n=== ${file} (${rows.length} rows incl. header) ===`);
    if (rows.length > 0) {
      console.log("HEADER:");
      rows[0].forEach((h, i) => console.log(`  [${i}] ${h}`));
      console.log("SAMPLE ROWS:");
      for (const r of rows.slice(1, 4)) console.log("  " + JSON.stringify(r));
    }
  }
}

main();
