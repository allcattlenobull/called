// Turns raw profile answers into normalized signals (0 to 1) that the compass and matcher share.
import { INTEREST_ITEMS, APTITUDE_ITEMS } from '../data/assessments';
import { SIM_BY_ID } from '../data/simulations';
import { EXPERIMENT_BY_ID } from '../data/purpose-experiments';
import { VALUE_TIERS } from '../data/vocab';
import type { AptitudeId, GiftId, InterestId, Profile, SkillId, ValueId } from '../types';

export const INTEREST_IDS: InterestId[] = ['build', 'investigate', 'create', 'help', 'lead', 'organize'];

export interface InterestSignal {
  score: number; // 0..1
  answered: number;
  liked: number;
  boosts: string[];
}

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

/** Interests from the assessment, then nudged by real experiences, simulations and experiments. */
export function interestSignals(p: Profile): Record<InterestId, InterestSignal> {
  const out = {} as Record<InterestId, InterestSignal>;
  for (const id of INTEREST_IDS) {
    const items = INTEREST_ITEMS.filter((i) => i.interest === id);
    const answers = items.map((i) => p.interests[i.id]).filter((a): a is -1 | 0 | 1 => a !== undefined);
    const base = answers.length ? (answers.reduce<number>((s, a) => s + a, 0) + answers.length) / (2 * answers.length) : 0.5;
    out[id] = { score: base, answered: answers.length, liked: answers.filter((a) => a === 1).length, boosts: [] };
  }
  // Evidence from lived experience counts more than self-report over time.
  for (const e of p.experiences) {
    const delta = e.enjoyment >= 4 ? 0.06 : e.enjoyment <= 2 ? -0.06 : 0;
    for (const id of e.interests) {
      out[id].score = clamp(out[id].score + delta);
      if (delta > 0) out[id].boosts.push(`You enjoyed ${e.title}`);
    }
  }
  for (const r of p.simulations) {
    const sim = SIM_BY_ID[r.simulationId];
    if (!sim) continue;
    for (const a of sim.aspects) {
      if (!a.interest) continue;
      if (r.enjoyed.includes(a.id)) {
        out[a.interest].score = clamp(out[a.interest].score + 0.05);
        out[a.interest].boosts.push(`You enjoyed ${a.label.toLowerCase()} in the ${sim.role.toLowerCase()} simulation`);
      }
      if (r.frustrated.includes(a.id)) out[a.interest].score = clamp(out[a.interest].score - 0.05);
    }
  }
  for (const log of p.experiments) {
    if (log.status !== 'done' || !log.answers) continue;
    const exp = EXPERIMENT_BY_ID[log.experimentId];
    if (!exp) continue;
    const avg = average(Object.values(log.answers));
    const delta = avg >= 4 ? 0.07 : avg <= 2 ? -0.07 : 0;
    for (const id of exp.interests) {
      out[id].score = clamp(out[id].score + delta);
      if (delta > 0) out[id].boosts.push(`Your “${exp.title.toLowerCase()}” experiment went well`);
    }
  }
  return out;
}

export function skillSignals(p: Profile): Partial<Record<SkillId, number>> {
  const out: Partial<Record<SkillId, number>> = {};
  for (const [k, v] of Object.entries(p.skills)) out[k as SkillId] = (v ?? 0) / 3;
  // Simulations contribute reflection about the work, not a scored aptitude signal.
  for (const r of p.simulations) {
    const sim = SIM_BY_ID[r.simulationId];
    if (!sim) continue;
    for (const a of sim.aspects) {
      if (!a.skill) continue;
      // Deliberately do not use the old editorial quality field as a skill score.
    }
  }
  return out;
}

export function aptitudeSignals(p: Profile): Partial<Record<AptitudeId, number>> {
  const out: Partial<Record<AptitudeId, number>> = {};
  for (const [k, v] of Object.entries(p.aptitudes)) {
    if (v && v.total > 0) out[k as AptitudeId] = v.correct / v.total;
  }
  return out;
}

export function valueWeights(p: Profile): Partial<Record<ValueId, number>> {
  const out: Partial<Record<ValueId, number>> = {};
  for (const [k, tier] of Object.entries(p.values)) {
    const t = VALUE_TIERS.find((x) => x.id === tier);
    if (t) out[k as ValueId] = t.weight;
  }
  return out;
}

/** Gifts the user chose, plus gifts others named in feedback (counted once each). */
export function giftSignals(p: Profile): { chosen: GiftId[]; noticed: Record<string, number>; all: GiftId[] } {
  const noticed: Record<string, number> = {};
  for (const f of p.feedback) for (const g of f.gifts) noticed[g] = (noticed[g] ?? 0) + 1;
  for (const log of p.experiments) {
    if (log.status !== 'done' || !log.answers) continue;
    const exp = EXPERIMENT_BY_ID[log.experimentId];
    if (exp && average(Object.values(log.answers)) >= 4) for (const g of exp.gifts) noticed[g] = (noticed[g] ?? 0) + 0.5;
  }
  const all = Array.from(new Set<GiftId>([...p.gifts, ...(Object.keys(noticed) as GiftId[])]));
  return { chosen: p.gifts, noticed, all };
}

export function aptitudeProgress(p: Profile): number {
  return Object.values(p.aptitudes).reduce((s, v) => s + (v?.total ?? 0), 0) / APTITUDE_ITEMS.length;
}

export function average(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
