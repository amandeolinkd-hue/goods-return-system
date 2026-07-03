/** Minimal RFC-4180 CSV serialization. */
function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: (unknown[])[]): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) lines.push(row.map(escapeCell).join(","));
  // Prepend BOM so Excel opens UTF-8 correctly.
  return "﻿" + lines.join("\r\n");
}
