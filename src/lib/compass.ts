// The Purpose Compass: eleven dimensions, each with a strength and an evidence level.
import { INTEREST_ITEMS, WORK_STYLE_ITEMS, LIFESTYLE_QUESTIONS, APTITUDE_ITEMS } from '../data/assessments';
import { APTITUDES, GIFTS, INTERESTS, PROBLEMS, SERVES, SKILLS, VALUES, WORK_AXES } from '../data/vocab';
import type { AptitudeId, InterestId, Profile, SkillId, ValueId, WorkAxis } from '../types';
import { aptitudeSignals, average, giftSignals, interestSignals, INTEREST_IDS } from './signals';

export type CompassDimId =
  | 'interests'
  | 'skills'
  | 'aptitudes'
  | 'workStyle'
  | 'values'
  | 'lifestyle'
  | 'experience'
  | 'feedback'
  | 'gifts'
  | 'service'
  | 'problems';

export type CompassFamily = 'self' | 'life' | 'purpose';

export interface CompassDim {
  id: CompassDimId;
  label: string;
  question: string;
  family: CompassFamily;
  /** 0..1, how pronounced the signal is. */
  strength: number;
  /** 0..1, how much evidence backs it. */
  evidence: number;
  summary: string;
  href: string;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export const COMPASS_ORDER: { id: CompassDimId; label: string; question: string; family: CompassFamily; href: string }[] = [
  { id: 'interests', label: 'Interests', question: 'What captures your attention?', family: 'self', href: '/discover/interests' },
  { id: 'skills', label: 'Skills', question: 'What can you currently do well?', family: 'self', href: '/discover/skills' },
  { id: 'aptitudes', label: 'Aptitudes', question: 'What may come naturally to you?', family: 'self', href: '/discover/aptitudes' },
  { id: 'workStyle', label: 'Work style', question: 'How do you prefer to work?', family: 'self', href: '/discover/workStyle' },
  { id: 'values', label: 'Values', question: 'What matters to you in work and life?', family: 'life', href: '/discover/values' },
  { id: 'lifestyle', label: 'Lifestyle', question: 'What kind of life are you trying to create?', family: 'life', href: '/discover/lifestyle' },
  { id: 'experience', label: 'Experience', question: 'What have you actually enjoyed doing?', family: 'life', href: '/purpose/experiences' },
  { id: 'feedback', label: 'Feedback', question: 'What do others consistently recognize in you?', family: 'life', href: '/purpose/feedback' },
  { id: 'gifts', label: 'Gifts', question: 'What strengths appear repeatedly?', family: 'purpose', href: '/purpose/gifts' },
  { id: 'service', label: 'Service', question: 'Who do you feel drawn toward helping?', family: 'purpose', href: '/purpose/serve' },
  { id: 'problems', label: 'Problems', question: 'What problems do you care about?', family: 'purpose', href: '/purpose/care' },
];

// Joins labels as a sentence: first label keeps its capital, the rest are lowercased.
const list = (raw: string[]) => {
  const items = raw.map((x, i) => (i === 0 ? x : x.charAt(0).toLowerCase() + x.slice(1)));
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
};

export function topInterests(p: Profile, n = 2): InterestId[] {
  const sig = interestSignals(p);
  if (!INTEREST_IDS.some((id) => sig[id].answered || sig[id].boosts.length)) return [];
  return [...INTEREST_IDS].sort((a, b) => sig[b].score - sig[a].score).filter((id) => sig[id].score > 0.55).slice(0, n);
}

export function topSkills(p: Profile, n = 3): SkillId[] {
  return (Object.entries(p.skills) as [SkillId, number][])
    .filter(([, v]) => v >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

export function topValues(p: Profile, n = 3): ValueId[] {
  const rank = { essential: 0, important: 1, somewhat: 2, notPriority: 3 } as const;
  return (Object.entries(p.values) as [ValueId, keyof typeof rank][])
    .filter(([, t]) => t === 'essential' || t === 'important')
    .sort((a, b) => rank[a[1]] - rank[b[1]])
    .slice(0, n)
    .map(([k]) => k);
}

export function topAptitudes(p: Profile): AptitudeId[] {
  const a = aptitudeSignals(p);
  return (Object.entries(a) as [AptitudeId, number][]).filter(([, v]) => v >= 0.67).sort((x, y) => y[1] - x[1]).map(([k]) => k);
}

export function computeCompass(p: Profile): CompassDim[] {
  const out: CompassDim[] = [];
  const sig = interestSignals(p);
  for (const meta of COMPASS_ORDER) {
    let strength = 0;
    let evidence = 0;
    let summary = 'Not explored yet';
    switch (meta.id) {
      case 'interests': {
        const answered = Object.keys(p.interests).length;
        evidence = clamp(answered / INTEREST_ITEMS.length * 0.8 + Math.min(0.2, INTEREST_IDS.reduce((s, id) => s + sig[id].boosts.length, 0) * 0.05));
        const top = topInterests(p);
        strength = top.length ? sig[top[0]].score : 0;
        if (top.length) summary = list(top.map((t) => INTERESTS[t].label));
        break;
      }
      case 'skills': {
        const rated = Object.keys(p.skills).length;
        evidence = clamp(rated / Object.keys(SKILLS).length);
        const levels = Object.values(p.skills).map((v) => (v ?? 0) / 3).sort((a, b) => b - a);
        strength = average(levels.slice(0, 3));
        const top = topSkills(p);
        if (top.length) summary = list(top.map((s) => SKILLS[s].label));
        else if (rated) summary = 'Still developing';
        break;
      }
      case 'aptitudes': {
        const done = Object.values(p.aptitudes).reduce((s, v) => s + (v?.total ?? 0), 0);
        evidence = clamp(done / APTITUDE_ITEMS.length);
        const a = aptitudeSignals(p);
        strength = Math.max(0, ...Object.values(a).map((v) => v ?? 0));
        const top = topAptitudes(p);
        if (top.length) summary = list(top.slice(0, 2).map((t) => APTITUDES[t].label));
        else if (done) summary = 'No standout yet';
        break;
      }
      case 'workStyle': {
        const axes = Object.keys(p.workStyle) as WorkAxis[];
        evidence = clamp(axes.length / Object.keys(WORK_AXES).length);
        strength = average(axes.map((a) => Math.abs(p.workStyle[a] ?? 0) / 2));
        const clear = axes.filter((a) => Math.abs(p.workStyle[a] ?? 0) >= 1).slice(0, 2);
        if (clear.length) summary = list(clear.map((a) => ((p.workStyle[a] ?? 0) < 0 ? WORK_AXES[a].left : WORK_AXES[a].right)));
        else if (axes.length) summary = 'Flexible';
        void WORK_STYLE_ITEMS;
        break;
      }
      case 'values': {
        const sorted = Object.keys(p.values).length;
        evidence = clamp(sorted / Object.keys(VALUES).length);
        const essentials = Object.values(p.values).filter((t) => t === 'essential').length;
        strength = sorted ? clamp(0.4 + essentials * 0.12) : 0;
        const top = topValues(p);
        if (top.length) summary = list(top.map((v) => VALUES[v].label));
        break;
      }
      case 'lifestyle': {
        const answered = Object.values(p.lifestyle).filter(Boolean).length;
        evidence = clamp(answered / LIFESTYLE_QUESTIONS.length);
        strength = evidence;
        if (answered) summary = `${answered} of ${LIFESTYLE_QUESTIONS.length} priorities set`;
        break;
      }
      case 'experience': {
        const doneExps = p.experiments.filter((e) => e.status === 'done').length;
        const n = p.experiences.length + p.simulations.length + doneExps;
        evidence = clamp(n / 6);
        const enjoy = [...p.experiences.map((e) => e.enjoyment), ...p.simulations.map((s) => s.enjoyment)];
        strength = enjoy.length ? average(enjoy) / 5 : n ? 0.5 : 0;
        if (n) summary = `${n} real experience${n === 1 ? '' : 's'} logged`;
        break;
      }
      case 'feedback': {
        evidence = clamp(p.feedback.length / 3);
        strength = evidence;
        const g = giftSignals(p);
        const top = Object.entries(g.noticed).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => GIFTS[k as keyof typeof GIFTS]?.label).filter(Boolean);
        if (p.feedback.length) summary = top.length ? `Others notice: ${list(top)}` : `${p.feedback.length} notes from others`;
        break;
      }
      case 'gifts': {
        const g = giftSignals(p);
        evidence = clamp(p.gifts.length / 3 * 0.6 + Math.min(0.4, Object.keys(g.noticed).length * 0.1));
        strength = clamp(g.all.length / 4);
        if (g.all.length) summary = list(g.all.slice(0, 3).map((x) => GIFTS[x].label));
        break;
      }
      case 'service': {
        evidence = clamp(p.serves.length / 3);
        strength = evidence;
        if (p.serves.length) summary = list(p.serves.slice(0, 2).map((s) => SERVES[s]));
        break;
      }
      case 'problems': {
        evidence = clamp(p.problems.length / 2);
        strength = evidence;
        if (p.problems.length) summary = list(p.problems.slice(0, 2).map((s) => PROBLEMS[s]));
        break;
      }
    }
    out.push({ ...meta, strength: clamp(strength), evidence: clamp(evidence), summary });
  }
  return out;
}

export function compassCompleteness(dims: CompassDim[]): number {
  return average(dims.map((d) => d.evidence));
}

/** Short, honest sentences for "What I've learned". */
export function insights(p: Profile): string[] {
  const out: string[] = [];
  const ti = topInterests(p);
  if (ti.length) out.push(`You’re drawn most to ${list(ti.map((t) => INTERESTS[t].label.toLowerCase()))}.`);
  const tv = topValues(p, 2);
  if (tv.length) out.push(`You care most about ${list(tv.map((v) => VALUES[v].label.toLowerCase()))} in your work.`);
  const ta = topAptitudes(p);
  if (ta.length) out.push(`Your puzzles showed an early strength in ${APTITUDES[ta[0]].label.toLowerCase()}.`);
  const best = [...p.simulations].sort((a, b) => b.enjoyment - a.enjoyment)[0];
  if (best && best.enjoyment >= 4) out.push(`The simulation you enjoyed most so far scored ${best.enjoyment} of 5.`);
  if (p.serves.length) out.push(`You feel drawn to helping ${list(p.serves.slice(0, 2).map((s) => SERVES[s].toLowerCase()))}.`);
  const notFor = Object.values(p.careerStatus).filter((s) => s === 'notForMe').length;
  if (notFor) out.push(`You’ve ruled out ${notFor} career${notFor === 1 ? '' : 's'}. Knowing what doesn’t fit is progress too.`);
  return out;
}
