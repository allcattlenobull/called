/**
 * Called's explainable matching engine.
 *
 * Every career gets eight component scores (0 to 100, or null when there isn't enough evidence yet),
 * a list of plain-language reasons, and a list of potential conflicts. The overall score is a
 * weighted average of whatever components exist, nudged by experience (simulations, reality checks,
 * experiments, and how the user has marked the career). It is a structured way of organizing
 * evidence, not a scientific prediction, and the UI says so. See docs/RECOMMENDATIONS.md.
 */
import { CAREERS } from '../data/careers';
import { SIM_BY_ID } from '../data/simulations';
import { EXPERIMENT_BY_ID } from '../data/purpose-experiments';
import { GIFTS, INTERESTS, PROBLEMS, SERVES, SKILLS, VALUES, WORK_AXES } from '../data/vocab';
import { ROUTE_BY_ID } from '../data/education/routes';
import type { Career, EducationLevel, InterestId, LifestylePrefs, Profile, ValueId, WorkAxis } from '../types';
import { money } from './format';
import { aptitudeSignals, average, giftSignals, interestSignals, skillSignals, valueWeights, INTEREST_IDS } from './signals';
import { marketFor } from './market';

export type DimensionId = 'interest' | 'skills' | 'aptitude' | 'values' | 'lifestyle' | 'purpose' | 'education' | 'financial';

/** Dimensions currently allowed to influence and appear in career matching. */
export const DIMENSIONS: { id: DimensionId; label: string; weight: number; family: 'self' | 'life' | 'purpose' }[] = [
  { id: 'interest', label: 'Interest', weight: 1.5, family: 'self' },
  { id: 'skills', label: 'Skills', weight: 0.75, family: 'self' },
  { id: 'values', label: 'Values', weight: 1.25, family: 'life' },
  { id: 'lifestyle', label: 'Lifestyle', weight: 1, family: 'life' },
  { id: 'purpose', label: 'Purpose', weight: 1.25, family: 'purpose' },
  { id: 'education', label: 'Education fit', weight: 1, family: 'life' },
  { id: 'financial', label: 'Financial fit', weight: 1, family: 'life' },
];

export interface Conflict {
  dimension: DimensionId | 'experience';
  text: string;
}

export interface DimensionScore {
  id: DimensionId;
  score: number | null;
  reasons: string[];
}

export type Confidence = 'early' | 'growing' | 'solid';

export interface MatchResult {
  careerId: string;
  overall: number | null;
  dimensions: Record<DimensionId, DimensionScore>;
  experience: { adjustment: number; reasons: string[] };
  conflicts: Conflict[];
  confidence: Confidence;
  explanation: string | null;
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  early: 'Early signal',
  growing: 'Growing evidence',
  solid: 'Solid evidence',
};

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const pct = (n: number) => Math.round(clamp(n) * 100);
const list = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/* ---------- Estimated education cost, used for debt considerations ---------- */

/** Tuition and fees for the whole route. `rates` swaps in a specific state's public college prices. */
export function estimatedEducationCost(c: Career, rates?: { uni?: number | null; cc?: number | null }): number {
  const level: EducationLevel = c.education.level;
  const uni = rates?.uni ?? ROUTE_BY_ID.college.annualCost;
  const cc = rates?.cc ?? ROUTE_BY_ID.communityCollege.annualCost;
  const grad = ROUTE_BY_ID.graduate.annualCost;
  switch (level) {
    case 'none':
      return 0;
    case 'certificate':
      return c.education.routes.includes('communityCollege') ? cc : ROUTE_BY_ID.certification.annualCost * Math.max(1, c.education.years);
    case 'apprenticeship':
      return ROUTE_BY_ID.apprenticeship.annualCost * c.education.years;
    case 'associate':
      return cc * Math.max(2, c.education.years);
    case 'bachelor':
      return uni * 4;
    case 'master':
      return uni * 4 + grad * Math.max(2, c.education.years - 4);
    case 'doctoral':
      return uni * 4 + grad * 1.25 * Math.max(3, c.education.years - 4);
  }
}

/* ---------- Where careers are available ---------- */

const CONCENTRATED_IN_CITIES = new Set(['data-scientist', 'ux-designer', 'marketing-manager', 'video-editor', 'architect', 'market-research-analyst']);

export function geography(c: Career): 'everywhere' | 'cities' {
  return CONCENTRATED_IN_CITIES.has(c.id) ? 'cities' : 'everywhere';
}

/* ---------- Component scores ---------- */

function interestScore(c: Career, sig: ReturnType<typeof interestSignals>): DimensionScore {
  const answered = INTEREST_IDS.reduce((s, id) => s + sig[id].answered, 0);
  const hasEvidence = answered > 0 || INTEREST_IDS.some((id) => sig[id].boosts.length > 0);
  if (!hasEvidence) return { id: 'interest', score: null, reasons: [] };
  const mean = average(INTEREST_IDS.map((id) => sig[id].score));
  let num = 0;
  let den = 0;
  for (const [id, w] of Object.entries(c.interests) as [InterestId, number][]) {
    const abs = sig[id].score;
    const rel = clamp(0.5 + (sig[id].score - mean)); // rewards what stands out for you, not just what you like
    num += w * (0.6 * abs + 0.4 * rel);
    den += w;
  }
  const score = den ? num / den : 0.5;
  const top = (Object.entries(c.interests) as [InterestId, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([id]) => sig[id].score >= 0.6)
    .map(([id]) => INTERESTS[id].label.toLowerCase());
  const reasons = top.length ? [`It centers on ${list(top.slice(0, 2))}, which you responded to strongly.`] : [];
  const boosted = (Object.keys(c.interests) as InterestId[]).flatMap((id) => sig[id].boosts).slice(0, 1);
  reasons.push(...boosted.map((b) => `${b}.`));
  return { id: 'interest', score: pct(score), reasons };
}

function skillsScore(c: Career, skills: ReturnType<typeof skillSignals>): DimensionScore {
  const rated = c.skills.filter((s) => skills[s] !== undefined);
  if (!rated.length) return { id: 'skills', score: null, reasons: [] };
  const vals = c.skills.map((s) => skills[s] ?? 0.2);
  const strong = c.skills.filter((s) => (skills[s] ?? 0) >= 0.66).map((s) => SKILLS[s].label.toLowerCase());
  const reasons = strong.length ? [`You already have strength in ${list(strong.slice(0, 3))}.`] : [`Key skills here are ${list(c.skills.slice(0, 3).map((s) => SKILLS[s].label.toLowerCase()))}. Skills can be learned.`];
  return { id: 'skills', score: pct(average(vals)), reasons };
}

function aptitudeScore(c: Career, apt: ReturnType<typeof aptitudeSignals>): DimensionScore {
  // Called’s custom puzzle bank has no norms, reliability study, or criterion validation.
  // Until a validated instrument is licensed or developed, it must not affect career ranking.
  void c;
  void apt;
  return { id: 'aptitude', score: null, reasons: [] };
}

function valuesScore(c: Career, weights: Partial<Record<ValueId, number>>, conflicts: Conflict[]): DimensionScore {
  const entries = (Object.entries(weights) as [ValueId, number][]).filter(([, w]) => w > 0);
  if (!entries.length) return { id: 'values', score: null, reasons: [] };
  let num = 0;
  let den = 0;
  for (const [v, w] of entries) {
    const c1 = c.values.supports.includes(v) ? 1 : c.values.strains.includes(v) ? -1 : 0;
    num += w * ((c1 + 1) / 2);
    den += w;
  }
  const supported = entries.filter(([v, w]) => w >= 2 && c.values.supports.includes(v)).sort((a, b) => b[1] - a[1]);
  const strained = entries.filter(([v, w]) => w >= 2 && c.values.strains.includes(v));
  for (const [v, w] of strained) {
    conflicts.push({
      dimension: 'values',
      text: `You marked ${VALUES[v].label.toLowerCase()} as ${w === 3 ? 'essential' : 'important'}, and this career often pulls against it.`,
    });
  }
  const reasons = supported.length ? [`It tends to support ${list(supported.slice(0, 3).map(([v]) => VALUES[v].label.toLowerCase()))}, which you ranked highly.`] : [];
  return { id: 'values', score: pct(num / den), reasons };
}

type Part = { score: number; reason?: string; conflict?: string };

function lifestyleParts(c: Career, l: LifestylePrefs): Part[] {
  const parts: Part[] = [];
  if (l.schedule && l.schedule !== 'noPref') {
    const table: Record<string, Record<string, number>> = {
      regular: { regular: 1, seasonal: 0.7, irregular: 0.4, shifts: 0.2 },
      flexible: { irregular: 0.9, regular: 0.6, seasonal: 0.6, shifts: 0.4 },
      shiftsOk: { regular: 0.9, seasonal: 0.9, irregular: 0.9, shifts: 1 },
    };
    const s = table[l.schedule][c.schedule];
    parts.push({
      score: s,
      conflict: s <= 0.3 ? 'You want regular weekday hours, and this career usually involves shifts, nights or weekends.' : undefined,
      reason: s === 1 && l.schedule === 'regular' ? 'Its regular hours fit the schedule you want.' : undefined,
    });
  }
  if (l.remote && l.remote !== 'noPref') {
    const table: Record<string, Record<string, number>> = {
      inPerson: { none: 1, some: 0.9, common: 0.6 },
      hybrid: { none: 0.4, some: 1, common: 0.9 },
      remote: { none: 0, some: 0.6, common: 1 },
    };
    const s = table[l.remote][c.remote];
    parts.push({
      score: s,
      conflict: s === 0 ? 'You prefer working mostly from home, and this work happens on site.' : undefined,
      reason: s === 1 && l.remote === 'remote' ? 'Remote work is common in this field.' : undefined,
    });
  }
  if (l.physical && l.physical !== 'noPref') {
    const table: Record<string, Record<number, number>> = {
      desk: { 1: 1, 2: 0.6, 3: 0.1 },
      some: { 1: 0.7, 2: 1, 3: 0.6 },
      active: { 1: 0.2, 2: 0.7, 3: 1 },
    };
    const s = table[l.physical][c.physical];
    parts.push({
      score: s,
      conflict: s <= 0.2 ? (l.physical === 'desk' ? 'You prefer mostly sitting, and this job is physically demanding.' : 'You want active, physical work, and this job is mostly at a desk.') : undefined,
      reason: s === 1 && l.physical === 'active' ? 'It keeps you active and on your feet, as you wanted.' : undefined,
    });
  }
  if (l.travel) {
    const table: Record<string, Record<number, number>> = {
      rarely: { 1: 1, 2: 0.6, 3: 0.2 },
      sometimes: { 1: 0.8, 2: 1, 3: 0.6 },
      often: { 1: 0.3, 2: 0.7, 3: 1 },
    };
    const s = table[l.travel][c.travel];
    parts.push({ score: s, conflict: s <= 0.2 ? 'You’d rather not travel, and this role involves frequent travel or time away.' : undefined });
  }
  if (l.balance) {
    const base: Record<string, Record<number, number>> = {
      high: { 1: 1, 2: 0.7, 3: 0.35 },
      moderate: { 1: 0.9, 2: 1, 3: 0.65 },
      hustle: { 1: 0.9, 2: 0.95, 3: 0.95 },
    };
    const s = base[l.balance][c.stress];
    parts.push({ score: s, conflict: s <= 0.35 ? 'Work-life balance is very important to you, and this career is often high-stress.' : undefined });
  }
  if (l.entrepreneurship) {
    const table: Record<string, Record<number, number>> = {
      yes: { 1: 0.4, 2: 0.75, 3: 1 },
      maybe: { 1: 0.75, 2: 0.9, 3: 0.95 },
      no: { 1: 0.85, 2: 0.85, 3: 0.75 },
    };
    const s = table[l.entrepreneurship][c.entrepreneurial];
    parts.push({ score: s, reason: s === 1 ? 'Many people in this field go on to run their own business.' : undefined });
  }
  if (l.uncertainty) {
    const risky = c.values.strains.includes('stability');
    const s = l.uncertainty === 'low' ? (risky ? 0.2 : 1) : l.uncertainty === 'medium' ? (risky ? 0.65 : 0.9) : c.entrepreneurial === 3 ? 1 : 0.8;
    parts.push({ score: s, conflict: s <= 0.2 ? 'You want steady, predictable income, and income in this career can swing.' : undefined });
  }
  if (l.geography === 'stayClose') {
    const s = geography(c) === 'everywhere' ? 1 : 0.55;
    parts.push({ score: s, conflict: s < 1 ? 'You want to stay near home, and these jobs are concentrated in larger cities.' : undefined });
  }
  return parts;
}

function workStyleParts(c: Career, ws: Partial<Record<WorkAxis, number>>): Part[] {
  const parts: Part[] = [];
  for (const [axis, cv] of Object.entries(c.workStyle) as [WorkAxis, number][]) {
    const uv = ws[axis];
    if (uv === undefined) continue;
    const s = 1 - Math.abs(uv - cv) / 4;
    const strongPref = Math.abs(uv) >= 1.5;
    const pole = (v: number) => (v < 0 ? WORK_AXES[axis].left : WORK_AXES[axis].right).toLowerCase();
    parts.push({
      score: s,
      reason: s >= 0.85 && strongPref ? `It matches your preference for ${pole(uv)}.` : undefined,
      conflict: s <= 0.25 ? `You prefer ${pole(uv)}, and this work leans toward ${pole(cv)}.` : undefined,
    });
  }
  return parts;
}

function lifestyleScore(c: Career, p: Profile, conflicts: Conflict[]): DimensionScore {
  const parts = [...lifestyleParts(c, p.lifestyle), ...workStyleParts(c, p.workStyle)];
  if (!parts.length) return { id: 'lifestyle', score: null, reasons: [] };
  for (const part of parts) if (part.conflict) conflicts.push({ dimension: 'lifestyle', text: part.conflict });
  const reasons = parts.map((x) => x.reason).filter((x): x is string => !!x).slice(0, 2);
  return { id: 'lifestyle', score: pct(average(parts.map((x) => x.score))), reasons };
}

function purposeScore(c: Career, p: Profile): DimensionScore {
  const g = giftSignals(p);
  const parts: number[] = [];
  const reasons: string[] = [];
  if (g.all.length) {
    const overlap = c.gifts.filter((x) => g.all.includes(x));
    parts.push(clamp(overlap.length / 2) * 0.85 + 0.15);
    if (overlap.length) reasons.push(`It uses gifts you’ve identified: ${list(overlap.slice(0, 3).map((x) => GIFTS[x].label.toLowerCase()))}.`);
  }
  if (p.serves.length) {
    const overlap = c.serves.filter((x) => p.serves.includes(x));
    parts.push(clamp(overlap.length / 2) * 0.85 + 0.15);
    if (overlap.length) reasons.push(`It serves ${list(overlap.slice(0, 2).map((x) => SERVES[x].toLowerCase()))}, who you feel drawn to help.`);
  }
  if (p.problems.length) {
    const overlap = c.problems.filter((x) => p.problems.includes(x));
    parts.push(clamp(overlap.length / 1.5) * 0.85 + 0.15);
    if (overlap.length) reasons.push(`It works on ${list(overlap.slice(0, 2).map((x) => PROBLEMS[x].toLowerCase()))}, a problem you care about.`);
  }
  if (!parts.length) return { id: 'purpose', score: null, reasons: [] };
  return { id: 'purpose', score: pct(average(parts)), reasons };
}

const MAX_YEARS = { short: 1, two: 2, four: 4, long: 12 } as const;

function educationScore(c: Career, l: LifestylePrefs, conflicts: Conflict[]): DimensionScore {
  if (!l.trainingYears) return { id: 'education', score: null, reasons: [] };
  const max = MAX_YEARS[l.trainingYears];
  const yrs = c.education.years;
  const paid = c.education.routes.includes('apprenticeship') || c.education.level === 'apprenticeship';
  let s = yrs <= max ? 1 : clamp(1 - (yrs - max) * 0.18, 0.1);
  if (paid && yrs > max) s = Math.max(s, 0.7); // paid training changes the math
  const reasons: string[] = [];
  if (yrs <= max) reasons.push(yrs === 0 ? 'You can start without a degree.' : `Typical training (about ${yrs} year${yrs === 1 ? '' : 's'}) fits what you’re willing to do.`);
  if (paid) reasons.push('Training is usually paid through an apprenticeship.');
  if (yrs - max >= 2 && !paid) {
    conflicts.push({ dimension: 'education', text: `This usually takes about ${yrs} years of education after high school, more than you said you want.` });
  }
  return { id: 'education', score: pct(s), reasons };
}

const INCOME_TARGET = { modest: 40000, comfortable: 60000, high: 90000, veryHigh: 130000 } as const;
const DEBT_LIMIT = { avoid: 5000, small: 20000, moderate: 50000, comfortable: 150000 } as const;

function financialScore(c: Career, p: Profile, l: LifestylePrefs, conflicts: Conflict[]): DimensionScore {
  const parts: number[] = [];
  const reasons: string[] = [];
  const market = marketFor(c, p);
  const median = market.pay;
  if (l.income && l.income !== 'notFactor') {
    const target = INCOME_TARGET[l.income];
    const ratio = median / target;
    parts.push(ratio >= 1 ? 1 : clamp(ratio ** 2));
    if (ratio >= 1) reasons.push(`${market.payLabel} of about ${money(median)} meets your income goal.`);
    else if (c.pay.high >= target) reasons.push(`Median pay is below your goal, but experienced workers can reach it.`);
    if (ratio < 0.75 && c.pay.high < target) conflicts.push({ dimension: 'financial', text: `Typical ${market.payLabel.toLowerCase()} (about ${money(median)}) is well below the ${money(target)} you said you want.` });
  }
  if (l.debt) {
    const cost = estimatedEducationCost(c);
    const limit = DEBT_LIMIT[l.debt];
    const s = cost <= limit ? 1 : clamp(limit / cost, 0.1);
    parts.push(s);
    if (cost <= limit && cost < 10000) reasons.push('Training costs are low, so debt is easier to avoid.');
    if (s < 0.5) {
      conflicts.push({
        dimension: 'financial',
        text: `You said ${l.debt === 'avoid' ? 'avoiding student debt is very important' : 'you want to limit debt'}. This path often costs ${money(cost)} or more in tuition alone.`,
      });
    }
  }
  if (!parts.length) return { id: 'financial', score: null, reasons: [] };
  return { id: 'financial', score: pct(average(parts)), reasons };
}

/* ---------- Experience adjustments ---------- */

function experienceAdjustment(c: Career, p: Profile, conflicts: Conflict[]) {
  let adj = 0;
  const reasons: string[] = [];
  const reality = p.reality[c.id];
  if (reality) {
    const map = { definitely: 8, maybe: 3, unsure: 0, probablyNot: -12 } as const;
    adj += map[reality];
    if (reality === 'definitely') reasons.push('After seeing what the work really looks like, you said it still sounds interesting.');
    if (reality === 'probablyNot') conflicts.push({ dimension: 'experience', text: 'After the reality check, you said this probably isn’t for you.' });
  }
  const status = p.careerStatus[c.id];
  if (status) {
    const map = { strong: 8, exploring: 4, curious: 2, notForMe: -25 } as const;
    adj += map[status];
    if (status === 'strong') reasons.push('You marked this as a strong interest.');
    if (status === 'notForMe') conflicts.push({ dimension: 'experience', text: 'You marked this career as not for you.' });
  }
  for (const r of p.simulations) {
    const sim = SIM_BY_ID[r.simulationId];
    if (!sim || !sim.careerIds.includes(c.id)) continue;
    const direct = c.simulationId === sim.id ? 1 : 0.5;
    const delta = ((r.enjoyment - 3) * 4 + (r.regularly === 'yes' ? 4 : r.regularly === 'no' ? -6 : 0)) * direct;
    adj += delta;
    if (delta > 0) reasons.push(`You enjoyed the ${sim.role.toLowerCase()} simulation (${r.enjoyment} of 5).`);
    if (delta < -4) conflicts.push({ dimension: 'experience', text: `The ${sim.role.toLowerCase()} simulation didn’t feel like a fit.` });
  }
  for (const log of p.experiments) {
    if (log.status !== 'done' || !log.answers || !c.experimentIds?.includes(log.experimentId)) continue;
    const avg = average(Object.values(log.answers));
    const delta = (avg - 3) * 3;
    adj += delta;
    const exp = EXPERIMENT_BY_ID[log.experimentId];
    if (delta > 0 && exp) reasons.push(`Your “${exp.title.toLowerCase()}” experiment went well.`);
  }
  return { adjustment: Math.round(Math.max(-30, Math.min(20, adj))), reasons };
}

/* ---------- Public API ---------- */

export interface MatchContext {
  interests: ReturnType<typeof interestSignals>;
  skills: ReturnType<typeof skillSignals>;
  aptitudes: ReturnType<typeof aptitudeSignals>;
  values: ReturnType<typeof valueWeights>;
}

export function buildContext(p: Profile): MatchContext {
  return { interests: interestSignals(p), skills: skillSignals(p), aptitudes: aptitudeSignals(p), values: valueWeights(p) };
}

export function matchCareer(c: Career, p: Profile, ctx: MatchContext = buildContext(p)): MatchResult {
  const conflicts: Conflict[] = [];
  const dims: Record<DimensionId, DimensionScore> = {
    interest: interestScore(c, ctx.interests),
    skills: skillsScore(c, ctx.skills),
    aptitude: aptitudeScore(c, ctx.aptitudes),
    values: valuesScore(c, ctx.values, conflicts),
    lifestyle: lifestyleScore(c, p, conflicts),
    purpose: purposeScore(c, p),
    education: educationScore(c, p.lifestyle, conflicts),
    financial: financialScore(c, p, p.lifestyle, conflicts),
  };
  const experience = experienceAdjustment(c, p, conflicts);
  const available = DIMENSIONS.filter((d) => dims[d.id].score !== null);
  let overall: number | null = null;
  if (available.length) {
    const weighted = available.reduce((s, d) => s + d.weight * (dims[d.id].score as number), 0);
    const totalWeight = available.reduce((s, d) => s + d.weight, 0);
    overall = Math.round(Math.max(0, Math.min(100, weighted / totalWeight + experience.adjustment)));
  }
  const experienceSignals = experience.reasons.length + conflicts.filter((x) => x.dimension === 'experience').length;
  const confidence: Confidence = available.length >= 6 && experienceSignals > 0 ? 'solid' : available.length >= 3 ? 'growing' : 'early';
  return { careerId: c.id, overall, dimensions: dims, experience, conflicts, confidence, explanation: explain(c, p, dims, ctx) };
}

/** One sentence in the shape: "X appeared because you consistently prioritized A, B and C." */
function explain(c: Career, p: Profile, dims: Record<DimensionId, DimensionScore>, ctx: MatchContext): string | null {
  const drivers: string[] = [];
  const interests = (Object.entries(c.interests) as [InterestId, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([id]) => ctx.interests[id].score >= 0.65)
    .map(([id]) => INTERESTS[id].label.toLowerCase());
  drivers.push(...interests.slice(0, 2));
  const values = (Object.entries(ctx.values) as [ValueId, number][])
    .filter(([v, w]) => w >= 2 && c.values.supports.includes(v))
    .map(([v]) => VALUES[v].label.toLowerCase());
  drivers.push(...values.slice(0, 2));
  const serves = c.serves.filter((s) => p.serves.includes(s)).map((s) => `serving ${SERVES[s].toLowerCase()}`);
  drivers.push(...serves.slice(0, 1));
  const gifts = c.gifts.filter((g) => giftSignals(p).all.includes(g)).map((g) => GIFTS[g].label.toLowerCase());
  drivers.push(...gifts.slice(0, 1));
  const unique = Array.from(new Set(drivers)).slice(0, 5);
  if (unique.length < 2) {
    const best = DIMENSIONS.filter((d) => (dims[d.id].score ?? 0) >= 70).map((d) => d.label.toLowerCase());
    if (!best.length) return null;
    return `${c.title} appeared because of strong ${list(best.slice(0, 3))} fit.`;
  }
  return `${c.title} appeared because you consistently prioritized ${list(unique)}.`;
}

export function rankCareers(p: Profile, careers: Career[] = CAREERS): { career: Career; match: MatchResult }[] {
  const ctx = buildContext(p);
  return careers
    .map((career) => ({ career, match: matchCareer(career, p, ctx) }))
    .sort((a, b) => (b.match.overall ?? -1) - (a.match.overall ?? -1) || a.career.title.localeCompare(b.career.title));
}

/** Careers worth suggesting: excludes ones marked not-for-me and needs some evidence. */
export function suggestions(p: Profile, limit = 6) {
  return rankCareers(p)
    .filter((r) => r.match.overall !== null && p.careerStatus[r.career.id] !== 'notForMe')
    .slice(0, limit);
}
