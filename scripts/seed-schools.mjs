#!/usr/bin/env node
/**
 * Seed Schools from a CSV (default: scripts/data/faridpur-schools.csv).
 *
 * Writes an idempotent SQL file next to the CSV. Apply it with wrangler:
 *   node scripts/seed-schools.mjs
 *   npx wrangler d1 execute DB --local  --file=scripts/data/faridpur-schools.sql
 *   npx wrangler d1 execute DB --remote --file=scripts/data/faridpur-schools.sql
 *
 * CSV columns: eiin,name_bn,name_en,upazila,type,bn_source,note.
 * Only name_bn -> name and name_en -> name_en are stored; the rest is for review.
 * Normalisation must match the app: NFC, trim, collapse whitespace.
 */
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const csvPath = process.argv[2] ?? "scripts/data/faridpur-schools.csv";
const sqlPath = csvPath.replace(/\.csv$/, ".sql");

const normalize = (s) => s.normalize("NFC").trim().replace(/\s+/g, " ");
const q = (s) => (s ? `'${s.replaceAll("'", "''")}'` : "NULL");

function parseLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const [header, ...lines] = readFileSync(csvPath, "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim());
const cols = parseLine(header);
const iBn = cols.indexOf("name_bn");
const iEn = cols.indexOf("name_en");

const seen = new Set();
const rows = [];
for (const line of lines) {
  const f = parseLine(line);
  const name = normalize(f[iBn] ?? "");
  const nameEn = normalize(f[iEn] ?? "");
  if (!name) continue;
  if (seen.has(name)) {
    console.warn(`skip duplicate: ${name}`);
    continue;
  }
  seen.add(name);
  rows.push(
    `INSERT INTO school (id, name, name_en) VALUES (${q(randomUUID())}, ${q(name)}, ${q(nameEn)}) ON CONFLICT DO NOTHING;`,
  );
}

writeFileSync(sqlPath, `${rows.join("\n")}\n`);
console.log(`${rows.length} schools -> ${sqlPath}`);
