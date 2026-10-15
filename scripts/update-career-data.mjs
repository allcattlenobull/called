#!/usr/bin/env node
/**
 * Refresh wage figures from the U.S. Bureau of Labor Statistics public API (OEWS, national).
 *
 * Writes src/data/careers/overrides/wages.json, which the app merges over the hand-entered
 * figures in each career file. Run locally with `npm run data:update`. Requires network access.
 * An optional BLS_API_KEY raises the request limits (https://data.bls.gov/registrationEngine/).
 *
 * Series ID format: OEU + N (national) + 0000000 (area) + 000000 (all industries) + SOC (6 digits) + datatype
 *   datatype 11 = annual 10th percentile, 13 = annual median, 15 = annual 90th percentile
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CAREER_DIR = 'src/data/careers';
const OUT = join(CAREER_DIR, 'overrides', 'wages.json');
const API = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
const DATATYPES = { low: '11', median: '13', high: '15' };

function socCodes() {
  const codes = new Set();
  for (const f of readdirSync(CAREER_DIR)) {
    if (!f.endsWith('.ts') || f === 'index.ts') continue;
    const src = readFileSync(join(CAREER_DIR, f), 'utf8');
    for (const m of src.matchAll(/soc:\s*'(\d{2}-\d{4})'/g)) codes.add(m[1]);
  }
  return [...codes].sort();
}

const seriesId = (soc, dt) => `OEUN0000000000000${soc.replace('-', '')}${dt}`;

async function fetchBatch(ids) {
  const body = { seriesid: ids, latest: true };
  if (process.env.BLS_API_KEY) body.registrationkey = process.env.BLS_API_KEY;
  const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`BLS API returned ${res.status}`);
  const json = await res.json();
  if (json.status !== 'REQUEST_SUCCEEDED') throw new Error(`BLS API: ${json.message?.join(' ') ?? json.status}`);
  return json.Results?.series ?? [];
}

async function main() {
  const codes = socCodes();
  const ids = codes.flatMap((soc) => Object.values(DATATYPES).map((dt) => seriesId(soc, dt)));
  const values = {};
  let year = null;
  const batchSize = process.env.BLS_API_KEY ? 50 : 25;
  for (let i = 0; i < ids.length; i += batchSize) {
    const series = await fetchBatch(ids.slice(i, i + batchSize));
    for (const s of series) {
      const point = s.data?.[0];
      const v = Number(String(point?.value ?? '').replace(/,/g, ''));
      if (point && Number.isFinite(v) && v > 0) {
        values[s.seriesID] = v;
        year = year ?? point.year;
      }
    }
  }
  const wages = {};
  for (const soc of codes) {
    const median = values[seriesId(soc, DATATYPES.median)];
    if (!median) continue;
    wages[soc] = { median, low: values[seriesId(soc, DATATYPES.low)], high: values[seriesId(soc, DATATYPES.high)] };
  }
  const current = JSON.parse(readFileSync(OUT, 'utf8'));
  const next = {
    _comment: current._comment,
    asOf: year ? `May ${year} (BLS OEWS API)` : current.asOf,
    wages: { ...current.wages, ...wages },
  };
  writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Updated ${Object.keys(wages).length} of ${codes.length} occupations${year ? ` (data year ${year})` : ''}.`);
}

main().catch((err) => {
  console.error(`Career data update failed: ${err.message}`);
  console.error('The existing data was left unchanged.');
  process.exit(1);
});
