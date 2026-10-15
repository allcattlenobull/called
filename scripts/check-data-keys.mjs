#!/usr/bin/env node
/**
 * Checks that each data-source API key stored in GitHub Actions secrets is present and accepted.
 * It never prints a key. It writes a table to the GitHub job summary and always exits 0, so a
 * missing or expired key is reported without blocking the wage refresh.
 *
 * Secrets (Settings > Secrets and variables > Actions):
 *   BLS_API_KEY, BEA_API_KEY, COLLEGE_SCORECARD_API_KEY, ONET_API_KEY,
 *   CAREERONESTOP_USER_ID, CAREERONESTOP_TOKEN
 */
import { appendFileSync } from 'node:fs';

const env = process.env;
const timeout = () => AbortSignal.timeout(20000);

async function bls() {
  if (!env.BLS_API_KEY) return ['missing', 'BLS_API_KEY is not set'];
  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seriesid: ['OEUN000000000000029114113'], latest: true, registrationkey: env.BLS_API_KEY }),
    signal: timeout(),
  });
  const json = await res.json().catch(() => ({}));
  const msg = (json.message ?? []).join(' ');
  if (/key|registration/i.test(msg) && /invalid|not valid|expired/i.test(msg)) return ['rejected', msg.slice(0, 160)];
  return json.status === 'REQUEST_SUCCEEDED' ? ['ok', 'Wage series returned'] : ['error', `${res.status} ${json.status ?? ''} ${msg}`.slice(0, 160)];
}

async function bea() {
  if (!env.BEA_API_KEY) return ['missing', 'BEA_API_KEY is not set'];
  const url = `https://apps.bea.gov/api/data?UserID=${encodeURIComponent(env.BEA_API_KEY)}&method=GETDATASETLIST&ResultFormat=JSON`;
  const res = await fetch(url, { signal: timeout() });
  const json = await res.json().catch(() => ({}));
  const err = json?.BEAAPI?.Error ?? json?.BEAAPI?.Results?.Error;
  if (err) return ['rejected', String(err.APIErrorDescription ?? err.ErrorDetail?.Description ?? 'Error').slice(0, 160)];
  return json?.BEAAPI?.Results?.Dataset ? ['ok', 'Dataset list returned'] : ['error', `HTTP ${res.status}`];
}

async function scorecard() {
  if (!env.COLLEGE_SCORECARD_API_KEY) return ['missing', 'COLLEGE_SCORECARD_API_KEY is not set'];
  const url = `https://api.data.gov/ed/collegescorecard/v1/schools?api_key=${encodeURIComponent(env.COLLEGE_SCORECARD_API_KEY)}&per_page=1&fields=id`;
  const res = await fetch(url, { signal: timeout() });
  if (res.status === 403 || res.status === 401) return ['rejected', `HTTP ${res.status} (key not accepted)`];
  return res.ok ? ['ok', 'School record returned'] : ['error', `HTTP ${res.status}`];
}

async function onet() {
  if (!env.ONET_API_KEY) return ['missing', 'ONET_API_KEY is not set'];
  const res = await fetch('https://api-v2.onetcenter.org/online/occupations/29-1141.00/', { headers: { 'X-API-Key': env.ONET_API_KEY, Accept: 'application/json' }, signal: timeout() });
  if (res.status === 401 || res.status === 403) return ['rejected', `HTTP ${res.status} (key not accepted)`];
  return res.ok ? ['ok', 'Occupation record returned'] : ['error', `HTTP ${res.status}`];
}

async function careerOneStop() {
  if (!env.CAREERONESTOP_USER_ID || !env.CAREERONESTOP_TOKEN) return ['missing', 'CAREERONESTOP_USER_ID and CAREERONESTOP_TOKEN are both required'];
  const res = await fetch(`https://api.careeronestop.org/v1/skillsmatcher/${encodeURIComponent(env.CAREERONESTOP_USER_ID)}`, {
    headers: { Authorization: `Bearer ${env.CAREERONESTOP_TOKEN}`, Accept: 'application/json' },
    signal: timeout(),
  });
  if (res.status === 401 || res.status === 403) return ['rejected', `HTTP ${res.status} (user ID or token not accepted)`];
  return res.ok ? ['ok', 'Skills list returned'] : ['error', `HTTP ${res.status}`];
}

const checks = { 'BLS (wages)': bls, 'BEA (cost of living)': bea, 'College Scorecard': scorecard, 'O*NET Web Services': onet, CareerOneStop: careerOneStop };
const icon = { ok: '✅', missing: '⚪', rejected: '❌', error: '⚠️' };
const rows = [];
for (const [name, fn] of Object.entries(checks)) {
  let result;
  try {
    result = await fn();
  } catch (e) {
    result = ['error', e instanceof Error ? e.message.slice(0, 160) : 'Request failed'];
  }
  rows.push(`| ${name} | ${icon[result[0]]} ${result[0]} | ${result[1].replace(/\|/g, '/')} |`);
  console.log(`${name}: ${result[0]} — ${result[1]}`);
  // Annotations show on the run page (and through the API) without exposing any key.
  if (env.GITHUB_ACTIONS) console.log(`::${result[0] === 'ok' ? 'notice' : 'warning'} title=Data key: ${name}::${result[0]} — ${result[1].replace(/[\r\n]/g, ' ')}`);
}
const table = ['### Data source keys', '', '| Source | Status | Detail |', '| --- | --- | --- |', ...rows, ''].join('\n');
if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, table);
