#!/usr/bin/env node
/**
 * Import reviewed state market data without embedding credentials or scraping by default.
 * STATE_MARKET_DATA_URL must point at an official bulk/API export transformed to the
 * checked-in shape: { asOf, source, states: { MN: { "29-0000": { pay, outlook } } } }.
 * The importer validates the shape and keeps the existing file untouched on failure.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'src/data/market/state-market.json';
const url = process.env.STATE_MARKET_DATA_URL;
if (!url) {
  console.log('No STATE_MARKET_DATA_URL configured; keeping the existing state market snapshot.');
  process.exit(0);
}

function validRecord(record) {
  if (!record || typeof record !== 'object') return false;
  if (record.pay && (!Number.isFinite(record.pay.median) || record.pay.median <= 0)) return false;
  if (record.outlook && (!Number.isFinite(record.outlook.growth) || !Number.isInteger(record.outlook.baseYear) || !Number.isInteger(record.outlook.projectionYear))) return false;
  return !!(record.pay || record.outlook);
}

try {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`source returned ${res.status}`);
  const incoming = await res.json();
  if (!incoming || typeof incoming !== 'object' || typeof incoming.asOf !== 'string' || typeof incoming.source !== 'string' || !incoming.states || typeof incoming.states !== 'object') throw new Error('expected asOf, source and states');
  const states = {};
  for (const [state, occupations] of Object.entries(incoming.states)) {
    if (!/^[A-Z]{2}$/.test(state) || !occupations || typeof occupations !== 'object') throw new Error(`invalid state ${state}`);
    const clean = {};
    for (const [soc, record] of Object.entries(occupations)) {
      if (!/^\d{2}-\d{4}$/.test(soc) || !validRecord(record)) throw new Error(`invalid record ${state}/${soc}`);
      clean[soc] = record;
    }
    states[state] = clean;
  }
  const next = { _comment: JSON.parse(readFileSync(OUT, 'utf8'))._comment, asOf: incoming.asOf, source: incoming.source, states };
  writeFileSync(OUT, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Imported state market data for ${Object.keys(states).length} states.`);
} catch (error) {
  console.error(`State market update failed: ${error.message}`);
  console.error('The existing state market snapshot was left unchanged.');
  process.exit(1);
}
