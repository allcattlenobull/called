#!/usr/bin/env node
/**
 * Builds src/data/careers/overrides/ai-impact.json (details) and ai-exposure.json (scores only):
 * how AI language tools touch each career.
 *
 * Source: Eloundou, Manning, Mishkin & Rock, "GPTs are GPTs: Labor market impact potential of
 * LLMs", Science 384 (2024). Data released under the MIT license at
 * https://github.com/openai/GPTs-are-GPTs. Ratings are for O*NET task statements (O*NET by
 * USDOL/ETA, CC BY 4.0). We use the human annotators' ratings:
 *   E0 = no exposure, E1 = an LLM alone could cut the time in half, E2 = an LLM plus other software could.
 *   Exposure ("beta") = share of tasks at E1 + half of those at E2.
 *
 * Usage:
 *   git clone --depth 1 https://github.com/openai/GPTs-are-GPTs /tmp/gpts
 *   node scripts/build-ai-impact.mjs /tmp/gpts/data
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = process.argv[2];
if (!dataDir) {
  console.error('Usage: node scripts/build-ai-impact.mjs <path to GPTs-are-GPTs/data>');
  process.exit(1);
}
const CAREER_DIR = 'src/data/careers';
const OUT = join(CAREER_DIR, 'overrides', 'ai-impact.json');
const OUT_SMALL = join(CAREER_DIR, 'overrides', 'ai-exposure.json');

/** Careers whose SOC code isn't in the 2019 O*NET taxonomy used by the study, or that have no single SOC. */
const ALIASES = {
  'clinical-lab-technologist': ['29-2011', '29-2012'],
  professor: ['25-1011', '25-1022', '25-1042', '25-1123', '25-1191'],
  'mental-health-counselor': ['21-1014'],
  'special-education-teacher': ['25-2052', '25-2053', '25-2054', '25-2059'],
  'content-creator': ['27-3043', '27-4032', '27-3031'],
  'small-business-owner': ['11-1021', '11-1011'],
};
const APPROXIMATE = new Set(['content-creator', 'small-business-owner', 'professor']);

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') (cur += '"'), i++;
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') out.push(cur), (cur = '');
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function table(file, sep) {
  const lines = readFileSync(join(dataDir, file), 'utf8').split(/\r?\n/).filter(Boolean);
  const split = sep === '\t' ? (l) => l.split('\t') : parseCsvLine;
  const head = split(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [head[i], v])));
}

const STOP = new Set('a an and are as at be by for from in into is it of on or our such than that the their them they this to with your you using use used other others including various system systems work works job jobs time day days new make makes need needs area areas'.split(' '));
const stem = (w) => w.replace(/(ings|ing|ies|ed|es|s)$/, '');
function bag(text) {
  return new Set(text.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem));
}
const overlap = (task, words) => [...bag(task)].filter((w) => words.has(w)).length;

function careers() {
  const out = [];
  for (const f of readdirSync(CAREER_DIR)) {
    if (!f.endsWith('.ts') || f === 'index.ts' || f === 'build.ts') continue;
    const src = readFileSync(join(CAREER_DIR, f), 'utf8');
    const ids = [...src.matchAll(/^\s*(?:\{\s*)?id:\s*'([a-z0-9-]+)'/gm)];
    ids.forEach((m, i) => {
      const seg = src.slice(m.index, ids[i + 1]?.index ?? src.length);
      const soc = seg.match(/soc:\s*'(\d{2}-\d{4})'/)?.[1];
      // Called's own plain-language description of the work, used to pick the most representative tasks.
      const text = [...seg.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]).join(' ');
      out.push({ id: m[1], soc, words: bag(text) });
    });
  }
  return out;
}

const occ = table('occ_level.csv', ',');
const tasks = table('full_labelset.tsv', '\t');
const tasksByCode = new Map();
for (const t of tasks) {
  const code = t['O*NET-SOC Code'];
  if (!tasksByCode.has(code)) tasksByCode.set(code, []);
  tasksByCode.get(code).push(t);
}

function codesFor(socs) {
  const out = [];
  for (const soc of socs) {
    const exact = occ.filter((o) => o['O*NET-SOC Code'] === `${soc}.00`);
    out.push(...(exact.length ? exact : occ.filter((o) => o['O*NET-SOC Code'].startsWith(soc))));
  }
  return out;
}

const T = (t) => Number(String(t.gpt4_automation).replace('T', '')) || 0;
const clean = (s) => s.trim().replace(/\s+/g, ' ');

const result = {};
const missing = [];
for (const c of careers()) {
  const socs = ALIASES[c.id] ?? (c.soc ? [c.soc] : []);
  const rows = codesFor(socs);
  if (!rows.length) {
    missing.push(c.id);
    continue;
  }
  const exposure = rows.reduce((s, r) => s + Number(r.human_rating_beta), 0) / rows.length;
  const all = rows.flatMap((r) => tasksByCode.get(r['O*NET-SOC Code']) ?? []);
  const core = all.filter((t) => t['Task Type'] === 'Core');
  const pool = core.length >= 4 ? core : all;
  const seen = new Set();
  const uniq = pool.filter((t) => {
    const k = clean(t.Task).toLowerCase();
    return seen.has(k) ? false : (seen.add(k), true);
  });
  const label = (t) => t.human_exposure_agg || t.human_labels;
  const exposed = uniq.filter((t) => label(t) === 'E1' || label(t) === 'E2');
  const human = uniq.filter((t) => label(t) === 'E0');
  const fit = (t) => overlap(t.Task, c.words);
  const rank = (a, b) => fit(b) - fit(a) || clean(a.Task).length - clean(b.Task).length;
  const pick = (list, fallback, sort) => {
    const ok = (t) => clean(t.Task).length <= 170;
    // Prefer tasks that match how Called describes the work; fall back only when there aren't enough.
    const relevant = (t) => fit(t) > 0;
    const first = list.filter(ok).sort(sort);
    const more = fallback.filter((t) => ok(t) && !first.includes(t)).sort(sort);
    const ordered = [...first, ...more];
    const good = ordered.filter(relevant);
    return (good.length >= 2 ? good : ordered).slice(0, 3).map((t) => clean(t.Task));
  };
  const allUniq = all.filter((t, i, arr) => arr.findIndex((x) => clean(x.Task) === clean(t.Task)) === i);
  // Exposed tasks: those an AI tool could most clearly speed up first (E1, then higher automation), then the most representative.
  const speed = pick(exposed, allUniq.filter((t) => label(t) === 'E1' || label(t) === 'E2'), (a, b) => (label(a) === label(b) ? 0 : label(a) === 'E1' ? -1 : 1) || rank(a, b));
  const stays = pick(human, allUniq.filter((t) => label(t) === 'E0'), (a, b) => rank(a, b) || T(a) - T(b));
  const autoShare = exposed.length ? exposed.filter((t) => T(t) >= 3).length / exposed.length : 0;
  result[c.id] = {
    exposure: Math.round(exposure * 100) / 100,
    exposedShare: uniq.length ? Math.round((exposed.length / uniq.length) * 100) / 100 : 0,
    autoShare: Math.round(autoShare * 100) / 100,
    tasksRated: uniq.length,
    speed,
    human: stays,
    ...(APPROXIMATE.has(c.id) || ALIASES[c.id] ? { approximate: true, basedOn: rows.map((r) => r.Title) } : {}),
  };
}

writeFileSync(
  OUT,
  JSON.stringify(
    {
      source: 'Eloundou, Manning, Mishkin & Rock, “GPTs are GPTs: Labor market impact potential of LLMs,” Science 384 (2024). Task ratings by human annotators. Tasks from O*NET (USDOL/ETA, CC BY 4.0).',
      sourceUrl: 'https://www.science.org/doi/10.1126/science.adj0998',
      dataUrl: 'https://github.com/openai/GPTs-are-GPTs',
      careers: result,
    },
    null,
    1,
  ) + '\n',
);
// A small exposure-only map, loaded with every page (filters, compare). Details load with the career page.
writeFileSync(OUT_SMALL, JSON.stringify(Object.fromEntries(Object.entries(result).map(([id, v]) => [id, v.exposure]))) + '\n');
console.log(`Wrote ${Object.keys(result).length} careers to ${OUT} and ${OUT_SMALL}`);
if (missing.length) {
  console.error(`No AI data for: ${missing.join(', ')}`);
  process.exit(1);
}
