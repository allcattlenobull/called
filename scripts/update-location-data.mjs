#!/usr/bin/env node
/**
 * Builds Called's location layer from official APIs. Runs in GitHub Actions, where the keys live.
 *
 *   src/data/market/places.json       states and large metros: cost of living (BEA Regional Price
 *                                      Parities), population, and public college costs by state
 *                                      (U.S. Department of Education College Scorecard)
 *   src/data/market/local-wages.json  median pay for every Called occupation by state and by the
 *                                      largest metro areas (BLS Occupational Employment and Wage Statistics)
 *
 * Env: BLS_API_KEY, BEA_API_KEY, COLLEGE_SCORECARD_API_KEY. Optional METRO_LIMIT (default 60).
 * Each source is independent: if one fails, the others still update and the old values are kept.
 * Prints ::notice/::warning annotations so results are visible on the run page. Never prints keys.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const env = process.env;
const PLACES = 'src/data/market/places.json';
const WAGES = 'src/data/market/local-wages.json';
const METRO_LIMIT = Number(env.METRO_LIMIT || 60);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const note = (level, title, msg) => console.log(env.GITHUB_ACTIONS ? `::${level} title=${title}::${msg}` : `${title}: ${msg}`);
const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback);

export const STATES = {
  AL: ['01', 'Alabama'], AK: ['02', 'Alaska'], AZ: ['04', 'Arizona'], AR: ['05', 'Arkansas'], CA: ['06', 'California'], CO: ['08', 'Colorado'], CT: ['09', 'Connecticut'], DE: ['10', 'Delaware'], DC: ['11', 'District of Columbia'], FL: ['12', 'Florida'], GA: ['13', 'Georgia'], HI: ['15', 'Hawaii'], ID: ['16', 'Idaho'], IL: ['17', 'Illinois'], IN: ['18', 'Indiana'], IA: ['19', 'Iowa'], KS: ['20', 'Kansas'], KY: ['21', 'Kentucky'], LA: ['22', 'Louisiana'], ME: ['23', 'Maine'], MD: ['24', 'Maryland'], MA: ['25', 'Massachusetts'], MI: ['26', 'Michigan'], MN: ['27', 'Minnesota'], MS: ['28', 'Mississippi'], MO: ['29', 'Missouri'], MT: ['30', 'Montana'], NE: ['31', 'Nebraska'], NV: ['32', 'Nevada'], NH: ['33', 'New Hampshire'], NJ: ['34', 'New Jersey'], NM: ['35', 'New Mexico'], NY: ['36', 'New York'], NC: ['37', 'North Carolina'], ND: ['38', 'North Dakota'], OH: ['39', 'Ohio'], OK: ['40', 'Oklahoma'], OR: ['41', 'Oregon'], PA: ['42', 'Pennsylvania'], RI: ['44', 'Rhode Island'], SC: ['45', 'South Carolina'], SD: ['46', 'South Dakota'], TN: ['47', 'Tennessee'], TX: ['48', 'Texas'], UT: ['49', 'Utah'], VT: ['50', 'Vermont'], VA: ['51', 'Virginia'], WA: ['53', 'Washington'], WV: ['54', 'West Virginia'], WI: ['55', 'Wisconsin'], WY: ['56', 'Wyoming'],
};
const FIPS_TO_STATE = Object.fromEntries(Object.entries(STATES).map(([code, [fips]]) => [fips, code]));

function socCodes() {
  const codes = new Set();
  for (const f of readdirSync('src/data/careers')) {
    if (!f.endsWith('.ts') || f === 'index.ts') continue;
    for (const m of readFileSync(join('src/data/careers', f), 'utf8').matchAll(/soc:\s*'(\d{2}-\d{4})'/g)) codes.add(m[1]);
  }
  return [...codes].sort();
}

async function getJson(url, init, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60000) });
      if (res.ok) return await res.json();
      if (res.status < 500 && res.status !== 429) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await sleep(2000 * (i + 1));
  }
  throw new Error('request failed');
}

/* ---------- BEA: Regional Price Parities and population ---------- */

const bea = (params) => getJson(`https://apps.bea.gov/api/data?UserID=${encodeURIComponent(env.BEA_API_KEY)}&ResultFormat=json&datasetname=Regional&${params}`);

async function beaLineCodes(table) {
  const json = await bea(`method=GetParameterValuesFiltered&TargetParameter=LineCode&TableName=${table}`);
  return json?.BEAAPI?.Results?.ParamValue ?? [];
}

async function beaSeries(table, line, geo, year = 'LAST5') {
  const json = await bea(`method=GetData&TableName=${table}&LineCode=${line}&GeoFips=${geo}&Year=${year}`);
  const err = json?.BEAAPI?.Error ?? json?.BEAAPI?.Results?.Error;
  if (err) throw new Error(err.APIErrorDescription ?? JSON.stringify(err).slice(0, 200));
  const rows = json?.BEAAPI?.Results?.Data ?? [];
  const latest = {};
  for (const r of rows) {
    const v = Number(String(r.DataValue).replace(/,/g, ''));
    if (!Number.isFinite(v)) continue;
    if (!latest[r.GeoFips] || r.TimePeriod > latest[r.GeoFips].year) latest[r.GeoFips] = { name: r.GeoName, value: v, year: r.TimePeriod };
  }
  return latest;
}

async function costOfLiving(places) {
  if (!env.BEA_API_KEY) return note('warning', 'Cost of living', 'BEA_API_KEY is not set; kept existing values');
  try {
    const lines = await beaLineCodes('SARPP');
    const desc = (re) => lines.find((l) => re.test(l.Desc))?.Key;
    const all = desc(/all items/i) ?? '1';
    const housing = desc(/housing|rents/i) ?? '3';
    const sAll = await beaSeries('SARPP', all, 'STATE');
    const sHouse = await beaSeries('SARPP', housing, 'STATE');
    let year = null;
    for (const [fips5, v] of Object.entries(sAll)) {
      const code = FIPS_TO_STATE[fips5.slice(0, 2)];
      if (!code) continue;
      places.states[code] = { ...(places.states[code] ?? {}), name: STATES[code][1], rpp: v.value, rppHousing: sHouse[fips5]?.value ?? null };
      year = v.year;
    }
    const mAll = await beaSeries('MARPP', all, 'MSA');
    const mHouse = await beaSeries('MARPP', housing, 'MSA');
    const pop = await beaSeries('CAINC1', '2', 'MSA', 'LAST');
    for (const [cbsa, v] of Object.entries(mAll)) {
      const name = v.name.replace(/\s*\((Metropolitan|Micropolitan) Statistical Area\)\s*$/i, '').replace(/\s*\*$/, '');
      const states = (name.split(', ')[1] ?? '').split('-').filter((s) => STATES[s]);
      places.metros[cbsa] = { ...(places.metros[cbsa] ?? {}), name, states, rpp: v.value, rppHousing: mHouse[cbsa]?.value ?? null, population: pop[cbsa]?.value ?? places.metros[cbsa]?.population ?? null };
    }
    places.sources.costOfLiving = `U.S. Bureau of Economic Analysis, Regional Price Parities (${year ?? 'latest'}). 100 = U.S. average.`;
    note('notice', 'Cost of living', `${Object.keys(sAll).length} states and ${Object.keys(mAll).length} metros (${year})`);
  } catch (e) {
    note('warning', 'Cost of living', `BEA failed: ${e.message}`);
  }
}

/* ---------- College Scorecard: public college costs by state ---------- */

const median = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
};

async function scorecardSchools(state, predominant) {
  const fields = ['latest.cost.tuition.in_state', 'latest.cost.tuition.out_of_state', 'latest.cost.roomboard.oncampus', 'latest.student.size'].join(',');
  const out = [];
  for (let page = 0; page < 6; page++) {
    const url = `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${encodeURIComponent(env.COLLEGE_SCORECARD_API_KEY)}&school.state=${state}&school.ownership=1&school.degrees_awarded.predominant=${predominant}&school.operating=1&fields=${fields}&per_page=100&page=${page}`;
    const json = await getJson(url);
    out.push(...(json.results ?? []));
    if ((page + 1) * 100 >= (json.metadata?.total ?? 0)) break;
  }
  return out;
}

async function collegeCosts(places) {
  if (!env.COLLEGE_SCORECARD_API_KEY) return note('warning', 'College costs', 'COLLEGE_SCORECARD_API_KEY is not set; kept existing values');
  let ok = 0;
  for (const code of Object.keys(STATES)) {
    try {
      const four = await scorecardSchools(code, 3);
      const two = await scorecardSchools(code, 2);
      const pick = (rows, f) => median(rows.map((r) => r[f]));
      places.states[code] = {
        ...(places.states[code] ?? { name: STATES[code][1] }),
        college: {
          public4InState: pick(four, 'latest.cost.tuition.in_state'),
          public4OutOfState: pick(four, 'latest.cost.tuition.out_of_state'),
          public4RoomBoard: pick(four, 'latest.cost.roomboard.oncampus'),
          public2InState: pick(two, 'latest.cost.tuition.in_state'),
          schools4: four.length,
          schools2: two.length,
        },
      };
      ok++;
      await sleep(250);
    } catch (e) {
      note('warning', 'College costs', `${code}: ${e.message}`);
    }
  }
  places.sources.college = 'U.S. Department of Education, College Scorecard: median published tuition and fees, and on-campus room and board, at public colleges in each state.';
  note('notice', 'College costs', `${ok} states updated`);
}

/* ---------- BLS OEWS: median pay by state and metro ---------- */

async function blsBatch(ids) {
  const json = await getJson('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seriesid: ids, latest: true, registrationkey: env.BLS_API_KEY }),
  });
  if (json.status !== 'REQUEST_SUCCEEDED') throw new Error((json.message ?? []).join(' ').slice(0, 200) || json.status);
  return json.Results?.series ?? [];
}

async function localWages(places) {
  if (!env.BLS_API_KEY) return note('warning', 'Local wages', 'BLS_API_KEY is not set; kept existing values');
  const socs = socCodes();
  const prev = readJson(WAGES, { socs: [], states: {}, metros: {} });
  const metros = Object.entries(places.metros)
    .filter(([, m]) => m.population)
    .sort((a, b) => b[1].population - a[1].population)
    .slice(0, METRO_LIMIT)
    .map(([cbsa]) => cbsa);
  const areas = [...Object.entries(STATES).map(([code, [fips]]) => ({ key: code, kind: 'states', series: (soc) => `OEUS${fips}00000000000${soc.replace('-', '')}13` })), ...metros.map((cbsa) => ({ key: cbsa, kind: 'metros', series: (soc) => `OEUM00${cbsa}000000${soc.replace('-', '')}13` }))];
  const wanted = new Map();
  for (const a of areas) for (const soc of socs) wanted.set(a.series(soc), [a.kind, a.key, soc]);
  const out = { states: {}, metros: {} };
  let year = null;
  let found = 0;
  let failed = 0;
  const ids = [...wanted.keys()];
  for (let i = 0; i < ids.length; i += 50) {
    try {
      for (const s of await blsBatch(ids.slice(i, i + 50))) {
        const point = s.data?.[0];
        const v = Number(String(point?.value ?? '').replace(/,/g, ''));
        if (!point || !Number.isFinite(v) || v <= 0) continue;
        const [kind, key, soc] = wanted.get(s.seriesID) ?? [];
        if (!kind) continue;
        (out[kind][key] ??= {})[soc] = v;
        year = year ?? point.year;
        found++;
      }
    } catch (e) {
      failed++;
      if (failed <= 3) note('warning', 'Local wages', `batch ${i / 50}: ${e.message}`);
      if (/daily threshold|limit/i.test(String(e.message))) break;
    }
    await sleep(300);
  }
  if (found < ids.length * 0.3) {
    note('warning', 'Local wages', `only ${found} of ${ids.length} values returned; keeping existing file`);
    return;
  }
  // Compact: one array per area, aligned with `socs`; null where BLS publishes no estimate.
  const pack = (rec) => Object.fromEntries(Object.entries(rec).map(([k, v]) => [k, socs.map((s) => v[s] ?? null)]));
  writeFileSync(
    WAGES,
    JSON.stringify({ asOf: year ? `May ${year}` : prev.asOf ?? null, source: 'U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics (annual median wage)', socs, states: pack(out.states), metros: pack(out.metros) }) + '\n',
  );
  note('notice', 'Local wages', `${found} of ${ids.length} state and metro medians (May ${year}); ${Object.keys(out.metros).length} metros`);
}

const places = readJson(PLACES, { sources: {}, states: {}, metros: {} });
places.sources ??= {};
await costOfLiving(places);
await collegeCosts(places);
places.updated = new Date().toISOString().slice(0, 10);
writeFileSync(PLACES, JSON.stringify(places) + '\n');
await localWages(places);
