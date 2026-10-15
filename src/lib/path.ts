/**
 * The decision-support layer behind My Path.
 *
 * A path is a hypothesis being tested, not a declaration. This module answers:
 *  - How much evidence do we have for this path, and what's still untested?
 *  - Why does it fit? What concerns remain? What's the biggest unanswered question?
 *  - What is the single best next step, and why?
 *  - Is it time to pause and ask how interest has changed (a decision gate)?
 *  - What roadmap fits this person's stage of life, money and location?
 * All rules are transparent and run without AI.
 */
import { CAREER_BY_ID } from '../data/careers';
import { INTEREST_ITEMS } from '../data/assessments';
import { SIM_BY_ID } from '../data/simulations';
import { EXPERIMENT_BY_ID } from '../data/purpose-experiments';
import { APTITUDES, SKILLS, VALUES } from '../data/vocab';
import type { AutoCheck, Career, GateAnswer, Profile, Roadmap, RoadmapItem } from '../types';
import { geography, matchCareer, type MatchResult } from './matching';
import { uid } from './profile';

/* ---------- Evidence ---------- */

export interface EvidenceCheck {
  id: string;
  label: string;
  met: boolean;
  /** Shown when not yet met. */
  missing: string;
  weight: number;
  kind: 'self' | 'experience';
}

export type EvidenceLevel = 'Early' | 'Moderate' | 'Strong';

export interface PathEvidence {
  checks: EvidenceCheck[];
  score: number; // 0..1
  level: EvidenceLevel;
  match: MatchResult;
}

const ok = (n: number | null, min = 65) => n !== null && n >= min;

function simFor(c: Career, p: Profile) {
  if (!c.simulationId) return undefined;
  return [...p.simulations].reverse().find((s) => s.simulationId === c.simulationId);
}

/** Interviews aren't tagged by career, so any completed interview counts as evidence. */
function interviewed(p: Profile) {
  return p.experiments.some((e) => e.experimentId === 'interview-pro' && e.status === 'done') || p.interviews > 0;
}

/** A real-world test tied to this career; if none is defined for it, any completed real-world experiment counts. */
function realWorld(c: Career, p: Profile) {
  const own = (c.experimentIds ?? []).filter((x) => x !== 'interview-pro');
  return p.experiments.some((e) => e.status === 'done' && e.experimentId !== 'interview-pro' && (own.length === 0 || own.includes(e.experimentId)));
}

export function pathEvidence(c: Career, p: Profile): PathEvidence {
  const match = matchCareer(c, p);
  const d = match.dimensions;
  const sim = simFor(c, p);
  const reality = p.reality[c.id];
  const checks: EvidenceCheck[] = [
    { id: 'interest', label: 'Interest match', met: ok(d.interest.score), missing: d.interest.score === null ? 'Interests not assessed yet' : 'Interests only partly line up', weight: 2, kind: 'self' },
    { id: 'values', label: 'Values match', met: ok(d.values.score), missing: d.values.score === null ? 'Values not sorted yet' : 'Some of your values pull against it', weight: 2, kind: 'self' },
    { id: 'aptitude', label: 'Aptitude or skills shown', met: ok(d.aptitude.score) || ok(d.skills.score), missing: 'No evidence of aptitude or skills yet', weight: 1, kind: 'self' },
    { id: 'lifestyle', label: 'Fits the life you want', met: ok(d.lifestyle.score) && ok(d.financial.score ?? 100, 60), missing: d.lifestyle.score === null ? 'Lifestyle priorities not set' : 'Some lifestyle or money tension', weight: 1, kind: 'self' },
    { id: 'reality', label: 'Still interested after the reality check', met: reality === 'definitely' || reality === 'maybe', missing: reality ? 'The reality check gave you pause' : 'Haven’t read the reality check', weight: 1, kind: 'experience' },
    ...(c.simulationId
      ? [
          {
            id: 'sim',
            label: sim ? `Enjoyed the simulation (${sim.enjoyment} of 5)` : 'Enjoyed the simulation',
            met: !!sim && sim.enjoyment >= 4,
            missing: sim ? `The simulation scored ${sim.enjoyment} of 5 for enjoyment` : 'Haven’t tried the simulation',
            weight: 2,
            kind: 'experience' as const,
          },
        ]
      : []),
    { id: 'interview', label: 'Talked with a professional', met: interviewed(p), missing: 'Haven’t talked with someone who does this work', weight: 2, kind: 'experience' },
    { id: 'realworld', label: 'Tested it in the real world', met: realWorld(c, p), missing: 'Haven’t tested it in the real world', weight: 2, kind: 'experience' },
    { id: 'roi', label: 'Checked the cost of training', met: p.roiChecked.includes(c.id) || c.education.years === 0, missing: 'Haven’t looked at training costs', weight: 1, kind: 'experience' },
  ];
  const total = checks.reduce((s, x) => s + x.weight, 0);
  const got = checks.filter((x) => x.met).reduce((s, x) => s + x.weight, 0);
  const score = got / total;
  const level: EvidenceLevel = score >= 0.65 ? 'Strong' : score >= 0.35 ? 'Moderate' : 'Early';
  return { checks, score, level, match };
}

/* ---------- Why it fits, concerns, questions ---------- */

export function whyItFits(c: Career, p: Profile, ev: PathEvidence = pathEvidence(c, p)): string[] {
  const out: string[] = [];
  const d = ev.match.dimensions;
  out.push(...d.interest.reasons.slice(0, 1));
  const valued = c.values.supports.filter((v) => p.values[v] === 'essential' || p.values[v] === 'important');
  if (valued.length) out.push(`Supports what you value: ${valued.slice(0, 3).map((v) => VALUES[v].label.toLowerCase()).join(', ')}.`);
  const apt = c.aptitudes.filter((a) => {
    const r = p.aptitudes[a];
    return r && r.total > 0 && r.correct / r.total >= 0.67;
  });
  if (apt.length) out.push(`You showed aptitude for ${apt.map((a) => APTITUDES[a].label.toLowerCase()).join(' and ')}.`);
  const sim = simFor(c, p);
  if (sim && sim.enjoyment >= 4) {
    const s = SIM_BY_ID[sim.simulationId];
    const liked = s?.aspects.filter((a) => sim.enjoyed.includes(a.id)).map((a) => a.label.toLowerCase()) ?? [];
    out.push(`You enjoyed the ${s?.role.toLowerCase()} simulation${liked.length ? `, especially ${liked.slice(0, 2).join(' and ')}` : ''}.`);
  }
  out.push(...d.lifestyle.reasons.slice(0, 1), ...d.education.reasons.slice(0, 1), ...d.purpose.reasons.slice(0, 1));
  return Array.from(new Set(out)).filter(Boolean).slice(0, 6);
}

export function concerns(ev: PathEvidence): string[] {
  return ev.match.conflicts.map((x) => x.text).slice(0, 4);
}

export interface OpenQuestion {
  id: string;
  question: string;
}

/** The questions only real experience can answer, most important first. */
export function openQuestions(c: Career, p: Profile, ev: PathEvidence = pathEvidence(c, p)): OpenQuestion[] {
  const missing = (id: string) => !ev.checks.find((x) => x.id === id)?.met;
  const qs: OpenQuestion[] = [];
  if (missing('reality')) qs.push({ id: 'reality', question: `Does the real day-to-day of a ${c.title.toLowerCase()} still sound interesting?` });
  if (missing('sim') && c.simulationId) qs.push({ id: 'sim', question: 'Would you actually enjoy the core tasks of this work?' });
  if (missing('interview')) qs.push({ id: 'interview', question: 'What is the work environment really like, from someone inside it?' });
  if (missing('realworld')) qs.push({ id: 'realworld', question: 'Does doing something like this in real life give you energy?' });
  if (missing('roi') || ev.match.conflicts.some((x) => x.dimension === 'financial' || x.dimension === 'education')) {
    qs.push({ id: 'roi', question: `Does ${c.education.years > 0 ? `about ${c.education.years} years of training` : 'the training path'} make sense for your money and timeline?` });
  }
  // One career-specific tension, phrased as a question.
  const tension = c.reality[0];
  if (tension) qs.push({ id: 'tension', question: `Are you comfortable with this: “${tension.replace(/\.$/, '')}”?` });
  return qs.slice(0, 4);
}

/* ---------- Next best action ---------- */

export interface NextAction {
  title: string;
  why: string;
  to: string;
  cta: string;
}

export function nextBestAction(c: Career, p: Profile, r: Roadmap | undefined, ev: PathEvidence = pathEvidence(c, p)): NextAction {
  const has = (id: string) => ev.checks.find((x) => x.id === id)?.met;
  const job = c.title.toLowerCase();
  if (!p.completed.interests || !p.completed.values) {
    const which = !p.completed.interests ? 'interests' : 'values';
    return {
      title: `Finish the ${which} assessment`,
      why: `Without your ${which}, Called can’t tell whether ${job} fits who you are. It takes about 3 minutes.`,
      to: `/discover/${which}`,
      cta: `Start ${which}`,
    };
  }
  if (r && gateDue(r, p)) {
    return { title: 'Pause and check your interest', why: 'You’ve gathered new evidence since you last reflected. Noticing how your interest has shifted is the point of testing a path.', to: '#gate', cta: 'Reflect now' };
  }
  if (!p.reality[c.id]) {
    return { title: 'Read the reality check', why: `It compares what people imagine about being a ${job} with what the work actually looks like. Two minutes now can save years later.`, to: `/careers/${c.id}#reality-h`, cta: 'Read it' };
  }
  if (c.simulationId && !simFor(c, p)) {
    const s = SIM_BY_ID[c.simulationId];
    return { title: `Try it: ${s.title}`, why: `You have ${has('interest') ? 'a strong interest match' : 'some interest'} but no experience of the actual tasks yet. This ${s.minutes}-minute simulation is the fastest way to find out.`, to: `/try/${s.id}`, cta: 'Start the simulation' };
  }
  if (!has('interview')) {
    return {
      title: `Talk to someone who works as a ${job}`,
      why: `You’ve ${simFor(c, p) ? 'completed the simulation' : 'explored this path'}, but you still have no real-world evidence about what the work environment feels like. One 20-minute conversation can change everything.`,
      to: '/try/experiments/interview-pro',
      cta: 'Plan an interview',
    };
  }
  if (!has('realworld') && c.experimentIds?.length) {
    const e = EXPERIMENT_BY_ID[c.experimentIds.find((x) => x !== 'interview-pro') ?? c.experimentIds[0]];
    if (e) return { title: e.title, why: `${e.hypothesis} A small real-world test tells you more than any assessment.`, to: `/try/experiments/${e.id}`, cta: 'See the experiment' };
  }
  if (!has('roi') && c.education.years > 0) {
    return { title: 'Check whether the training is worth it', why: `This path usually takes about ${c.education.years} years after high school. See the real costs, earnings and debt before you invest.`, to: `/compare/education?career=${c.id}`, cta: 'Open the ROI tool' };
  }
  const step = r?.items.find((i) => !isDone(i, c, p));
  if (step) return { title: step.text, why: 'Your evidence is building. The next step on your roadmap keeps it moving.', to: step.to ?? '#roadmap', cta: step.to ? 'Go' : 'See roadmap' };
  return { title: 'Compare this path with another', why: 'You’ve tested this path well. Seeing it next to an alternative is how wise decisions get made.', to: '/compare', cta: 'Compare paths' };
}

/* ---------- Auto-checking steps ---------- */

export function autoDone(auto: AutoCheck, c: Career, p: Profile): boolean {
  if (auto.startsWith('assessment:')) return !!p.completed[auto.slice(11) as keyof Profile['completed']];
  switch (auto) {
    case 'sim':
      return !!simFor(c, p);
    case 'interview':
      return interviewed(p);
    case 'reality':
      return !!p.reality[c.id];
    case 'experiment':
      return realWorld(c, p);
    case 'roi':
      return p.roiChecked.includes(c.id);
    case 'compare':
      return p.comparisons > 0;
    default:
      return false;
  }
}

export function isDone(item: RoadmapItem, c: Career, p: Profile): boolean {
  return item.done || (!!item.auto && autoDone(item.auto, c, p));
}

/** Steps done across every path, counting steps checked off automatically. */
export function stepsDone(p: Profile): number {
  return p.roadmaps.reduce((n, r) => n + doneCount(r, p), 0);
}

/* ---------- Decision gates ---------- */

/** A gate is due after three new completed steps, or new experience, since the last one. */
export function gateDue(r: Roadmap, p: Profile): boolean {
  if (r.stage === 'ruledOut') return false;
  const c = CAREER_BY_ID[r.careerId];
  if (!c) return false;
  const doneNow = r.items.filter((i) => isDone(i, c, p)).length;
  const last = r.gates?.[r.gates.length - 1];
  return doneNow - (last?.doneCount ?? 0) >= 3;
}

export function doneCount(r: Roadmap, p: Profile): number {
  const c = CAREER_BY_ID[r.careerId];
  return c ? r.items.filter((i) => isDone(i, c, p)).length : 0;
}

export const GATE_ANSWERS: { id: GateAnswer; label: string; short: string }[] = [
  { id: 'stronger', label: 'Stronger interest', short: 'Stronger' },
  { id: 'same', label: 'About the same', short: 'Same' },
  { id: 'less', label: 'Less interested', short: 'Less' },
  { id: 'ruleOut', label: 'Rule this path out', short: 'Ruled out' },
];

/* ---------- Leading paths ---------- */

export function canLead(r: Roadmap, ev: PathEvidence): { ok: boolean; reason: string } {
  if (r.stage === 'leading') return { ok: false, reason: 'This is already a leading path.' };
  const experience = ev.checks.filter((x) => x.kind === 'experience' && x.met).length;
  if (ev.level === 'Early') return { ok: false, reason: 'Gather a bit more evidence first. Try the simulation or talk to a professional.' };
  if (experience < 2) return { ok: false, reason: 'Get at least two kinds of real experience first, like a simulation and a conversation with a professional.' };
  return { ok: true, reason: 'You’ve gathered enough evidence to treat this as a leading path. You can always change your mind.' };
}

/* ---------- Personalized roadmaps ---------- */

type Step = Omit<RoadmapItem, 'id' | 'done'>;

function stagePlan(c: Career, p: Profile): { six: Step[]; twelve: Step[]; first6: Step[]; first12: Step[] } {
  const level = c.education.level;
  const stage = p.stage ?? 'highSchool';
  const six: Step[] = [];
  const twelve: Step[] = [];
  // Steps driven by the user's own money, location and choices go first.
  const first6: Step[] = [];
  const first12: Step[] = [];
  const major = (c.education.majors?.[0] ?? 'a related subject').toLowerCase();

  if (stage === 'highSchool') {
    six.push({ text: `Take or plan a class next semester related to ${major}`, horizon: 'six' });
    six.push({ text: 'Join a club, team or volunteer role where you can practice this kind of work', horizon: 'six' });
    six.push({ text: 'Ask a teacher or counselor about a job shadow during a school break', horizon: 'six' });
  } else if (stage === 'college') {
    six.push({ text: `Take an introductory course in ${major} or a related field`, horizon: 'six' });
    six.push({ text: 'Visit your career center and ask about internships in this field', horizon: 'six' });
    six.push({ text: 'Join a student organization connected to this work', horizon: 'six' });
  } else {
    six.push({ text: 'Have three short conversations with people in this field', horizon: 'six' });
    six.push({ text: 'Take one short course (online or community college) while you keep working', horizon: 'six' });
    six.push({ text: 'Look for a role, project or volunteer spot that builds related experience', horizon: 'six' });
  }

  if (level === 'apprenticeship') {
    twelve.push({ text: 'Find apprenticeship programs near you on Apprenticeship.gov and note their application dates', horizon: 'twelve' });
    twelve.push({ text: stage === 'highSchool' ? 'Apply to a pre-apprenticeship or apprenticeship before you graduate' : 'Apply to an apprenticeship (you’ll be paid while you train)', horizon: 'twelve' });
  } else if (level === 'certificate' || level === 'none') {
    twelve.push({ text: 'Compare local training programs on cost, length and job placement', horizon: 'twelve' });
    twelve.push({ text: stage === 'working' ? 'Enroll in a program that fits around your job, or apply for an entry role' : 'Earn your first credential or land an entry-level role', horizon: 'twelve' });
  } else if (level === 'associate') {
    twelve.push({ text: 'Compare community college programs and their prerequisites (some have waitlists)', horizon: 'twelve' });
    twelve.push({ text: 'Apply to a program and look into financial aid and employer tuition help', horizon: 'twelve' });
  } else {
    twelve.push({ text: stage === 'highSchool' ? 'Compare at least three schools on College Scorecard, including a community college transfer option' : 'Compare degree options, including part-time and online programs', horizon: 'twelve', to: undefined });
    twelve.push({ text: 'Look for an internship, summer program or job shadow', horizon: 'twelve' });
    if (level === 'master' || level === 'doctoral') twelve.push({ text: 'Learn the graduate-school requirements early, including experience hours', horizon: 'twelve' });
  }

  // Money and location shape the plan too.
  if (p.lifestyle.debt === 'avoid' || p.lifestyle.debt === 'small') {
    if (c.education.years >= 2 && level !== 'apprenticeship') first12.push({ text: 'Look for ways to cut debt: community college first, employer tuition help, scholarships or paid training', horizon: 'twelve' });
  }
  if (p.lifestyle.geography === 'stayClose' && geography(c) === 'cities') {
    first6.push({ text: 'Search local job boards to see whether this work exists near you', horizon: 'six' });
  }
  if (p.saved.length > 1) first12.push({ text: 'Compare this path side by side with another career you’re considering', horizon: 'twelve', auto: 'compare', to: '/compare' });
  return { six, twelve, first6, first12 };
}

/** A starter roadmap that reflects who this person is and what they’ve already done. */
export function generateRoadmap(c: Career, p?: Profile): Roadmap {
  const now: Step[] = [];
  if (p && !p.completed.interests) now.push({ text: 'Finish the interests assessment', horizon: 'now', auto: 'assessment:interests', to: '/discover/interests' });
  if (p && !p.completed.values) now.push({ text: 'Finish the values assessment', horizon: 'now', auto: 'assessment:values', to: '/discover/values' });
  now.push({ text: `Read the reality check for ${c.title.toLowerCase()}`, horizon: 'now', auto: 'reality', to: `/careers/${c.id}` });
  if (c.simulationId) now.push({ text: `Complete the “${SIM_BY_ID[c.simulationId].title}” simulation`, horizon: 'now', auto: 'sim', to: `/try/${c.simulationId}` });
  now.push({ text: `Interview someone who works as a ${c.title.toLowerCase()}`, horizon: 'now', auto: 'interview', to: '/try/experiments/interview-pro' });
  const exp = c.experimentIds?.find((x) => x !== 'interview-pro');
  if (exp && EXPERIMENT_BY_ID[exp]) now.push({ text: `Try a real-world test: ${EXPERIMENT_BY_ID[exp].title.toLowerCase()}`, horizon: 'now', auto: 'experiment', to: `/try/experiments/${exp}` });

  for (const text of c.path?.now ?? []) if (!/interview|simulation|reality check/i.test(text)) now.push({ text, horizon: 'now' });
  const plan = stagePlan(c, p ?? ({ stage: 'highSchool', lifestyle: {}, saved: [] } as Partial<Profile> as Profile));
  const roi: Step[] = c.education.years > 0 ? [{ text: 'Check the cost and payoff of the training', horizon: 'six', auto: 'roi', to: `/compare/education?career=${c.id}` }] : [];
  // Interleave stage-aware steps with any hand-written ones for this career, so both survive the cap.
  const weave = (a: Step[], b: Step[]) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => [a[i], b[i]]).flat().filter((x): x is Step => !!x);
  const six = [...roi, ...plan.first6, ...weave(plan.six, c.path?.six.map((text) => ({ text, horizon: 'six' as const })) ?? [])];
  const twelve = [...plan.first12, ...weave(plan.twelve, c.path?.twelve.map((text) => ({ text, horizon: 'twelve' as const })) ?? [])];

  const dedupe = (steps: Step[], max: number) => {
    const seen = new Set<string>();
    return steps.filter((s) => (seen.has(s.text) ? false : (seen.add(s.text), true))).slice(0, max);
  };
  const items: RoadmapItem[] = [...dedupe(now, 5), ...dedupe(six, 5), ...dedupe(twelve, 5)].map((s) => ({ ...s, id: uid('step'), done: false }));
  return { careerId: c.id, goal: c.title, createdAt: new Date().toISOString(), items, stage: 'exploring', gates: [] };
}

/**
 * Re-tailor a path to who the user is now (new stage, new results), keeping
 * everything they've finished and every step they wrote themselves.
 */
export function retailorRoadmap(r: Roadmap, c: Career, p: Profile): Roadmap {
  const fresh = generateRoadmap(c, p);
  const keep = r.items.filter((i) => i.mine || isDone(i, c, p));
  const keptText = new Set(keep.map((i) => i.text));
  return { ...r, items: [...keep, ...fresh.items.filter((i) => !keptText.has(i.text) && !(i.auto && keep.some((k) => k.auto === i.auto)))] };
}

export const HORIZONS = [
  { id: 'now', label: 'Now', blurb: 'Gather evidence' },
  { id: 'six', label: 'Next 6 months', blurb: 'Build experience' },
  { id: 'twelve', label: 'Next 12 months', blurb: 'Take a real step' },
] as const;

/* ---------- What you've learned ---------- */

export interface Insight {
  id: string;
  text: string;
  /** The evidence behind it, so nothing feels like a black box. */
  basis: string;
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

/**
 * Patterns across everything the user has done, phrased as things they’ve learned
 * about themselves. Each insight needs at least two independent signals.
 */
export function learnedInsights(p: Profile): Insight[] {
  const out: Insight[] = [];

  // People-centered vs. ideas/data-centered work.
  let people = 0;
  let data = 0;
  const peopleBasis: string[] = [];
  if (Object.keys(p.interests).length) {
    const liked = (area: string) => INTEREST_ITEMS.filter((i) => i.interest === area && p.interests[i.id] === 1).length;
    const h = liked('help');
    const d = Math.max(liked('investigate'), liked('organize'));
    if (h !== d) {
      if (h > d) people++;
      else data++;
      peopleBasis.push('your interests');
    }
  }
  const social = p.workStyle.social;
  if (social !== undefined && social !== 0) {
    if (social > 0) people++;
    else data++;
    peopleBasis.push('your work style');
  }
  let simPeople = 0;
  let simData = 0;
  for (const s of p.simulations) {
    const sim = SIM_BY_ID[s.simulationId];
    if (!sim) continue;
    for (const a of sim.aspects) {
      const tilt = a.interest === 'help' || a.skill === 'empathy' || a.skill === 'teaching' ? 1 : a.interest === 'investigate' || a.skill === 'analysis' || a.skill === 'math' ? -1 : 0;
      if (!tilt) continue;
      const sign = s.enjoyed.includes(a.id) ? 1 : s.frustrated.includes(a.id) ? -1 : 0;
      if (tilt * sign > 0) simPeople++;
      else if (tilt * sign < 0) simData++;
    }
  }
  if (simPeople !== simData) {
    if (simPeople > simData) people++;
    else data++;
    peopleBasis.push('what you enjoyed in simulations');
  }
  const leaning = [...Object.entries(p.careerStatus)].filter(([, st]) => st === 'strong' || st === 'exploring').map(([id]) => CAREER_BY_ID[id]).filter(Boolean);
  if (leaning.length >= 2) {
    const avg = leaning.reduce((s, c) => s + c.peopleData, 0) / leaning.length;
    if (Math.abs(avg) >= 0.5) {
      if (avg > 0) people++;
      else data++;
      peopleBasis.push('the careers you keep exploring');
    }
  }
  if (people >= 2 && people > data) out.push({ id: 'people', text: 'You consistently prefer people-centered work.', basis: `Seen in ${listOf(peopleBasis)}.` });
  else if (data >= 2 && data > people) out.push({ id: 'data', text: 'You keep leaning toward work with ideas, information and systems more than people.', basis: `Seen in ${listOf(peopleBasis)}.` });

  // Enjoyed vs. frustrated parts of the work, across simulations.
  const enjoyedSkills = new Map<string, number>();
  const frustratedSkills = new Map<string, number>();
  for (const s of p.simulations) {
    const sim = SIM_BY_ID[s.simulationId];
    if (!sim) continue;
    for (const a of sim.aspects) {
      if (!a.skill) continue;
      if (s.enjoyed.includes(a.id)) enjoyedSkills.set(a.skill, (enjoyedSkills.get(a.skill) ?? 0) + 1);
      if (s.frustrated.includes(a.id)) frustratedSkills.set(a.skill, (frustratedSkills.get(a.skill) ?? 0) + 1);
    }
  }
  if (enjoyedSkills.has('analysis') && frustratedSkills.has('math')) {
    out.push({ id: 'analysis', text: 'You enjoy analysis but dislike repetitive numerical tasks.', basis: 'You enjoyed spotting what mattered but found the number-crunching frustrating.' });
  } else {
    const loved = [...enjoyedSkills.entries()].sort((a, b) => b[1] - a[1])[0];
    const disliked = [...frustratedSkills.entries()].sort((a, b) => b[1] - a[1])[0];
    if (loved && disliked && loved[0] !== disliked[0]) {
      out.push({ id: 'enjoy-vs', text: `You come alive with ${SKILL_LABEL(loved[0])} but ${SKILL_LABEL(disliked[0])} drains you.`, basis: `From ${plural(p.simulations.length, 'simulation')} you’ve tried.` });
    } else if (loved && loved[1] >= 2) {
      out.push({ id: 'enjoy', text: `${cap(SKILL_LABEL(loved[0]))} is a thread in the work you enjoy.`, basis: `You picked it as a favorite part in ${plural(loved[1], 'simulation')}.` });
    }
  }

  // Top lifestyle priority.
  const flexSignals = [p.values.flexibility === 'essential' || p.values.flexibility === 'important', p.lifestyle.schedule === 'flexible', p.lifestyle.remote === 'remote' || p.lifestyle.remote === 'hybrid', p.lifestyle.balance === 'high'].filter(Boolean).length;
  const stabilitySignals = [p.values.stability === 'essential' || p.values.stability === 'important', p.values.predictability === 'essential' || p.values.predictability === 'important', p.lifestyle.uncertainty === 'low', p.lifestyle.schedule === 'regular'].filter(Boolean).length;
  const moneySignals = [p.values.income === 'essential', p.lifestyle.income === 'high' || p.lifestyle.income === 'veryHigh'].filter(Boolean).length;
  const familySignals = [p.values.familyTime === 'essential' || p.values.familyTime === 'important', p.lifestyle.balance === 'high', p.lifestyle.travel === 'rarely', p.lifestyle.geography === 'stayClose'].filter(Boolean).length;
  const priorities = [
    { id: 'flex', n: flexSignals, text: 'Flexibility has emerged as one of your top lifestyle priorities.' },
    { id: 'stable', n: stabilitySignals, text: 'Stability and knowing what to expect matter a lot to you.' },
    { id: 'family', n: familySignals, text: 'Time for family and the people close to you is shaping what you want from work.' },
    { id: 'money', n: moneySignals * 1.5, text: 'Earning well is a real priority for you. That’s worth being honest about.' },
  ].sort((a, b) => b.n - a.n);
  if (priorities[0].n >= 2) out.push({ id: `life-${priorities[0].id}`, text: priorities[0].text, basis: 'From your values and lifestyle answers together.' });

  // Purpose: who they want to serve, if confirmed by more than one source.
  const helping = p.values.helping === 'essential' || p.values.meaningful === 'essential';
  if (helping && p.serves.length) out.push({ id: 'serve', text: 'Work that clearly helps people isn’t optional for you. It’s close to the center.', basis: 'Your values and the people you said you want to serve agree.' });

  // Strength confirmed by puzzles.
  const strong = (Object.entries(p.aptitudes) as [keyof typeof APTITUDES, { correct: number; total: number }][]).filter(([, r]) => r.total >= 3 && r.correct / r.total >= 0.75);
  if (strong.length) out.push({ id: 'aptitude', text: `${APTITUDES[strong[0][0]].label} looks like a real strength.`, basis: `You got ${strong[0][1].correct} of ${strong[0][1].total} right in the puzzles.` });

  // How testing paths has changed their mind.
  const gates = p.roadmaps.flatMap((r) => (r.gates ?? []).map((g) => ({ ...g, careerId: r.careerId })));
  const up = gates.filter((g) => g.answer === 'stronger');
  const down = gates.filter((g) => g.answer === 'less' || g.answer === 'ruleOut');
  if (up.length) {
    const titles = Array.from(new Set(up.map((g) => CAREER_BY_ID[g.careerId]?.title).filter(Boolean)));
    out.push({ id: 'gates-up', text: `Testing ${listOf(titles)} made your interest grow, not fade.`, basis: 'From your check-ins after roadmap steps.' });
  }
  if (down.length) {
    const titles = Array.from(new Set(down.map((g) => CAREER_BY_ID[g.careerId]?.title).filter(Boolean)));
    out.push({ id: 'gates-down', text: `Real evidence cooled your interest in ${listOf(titles)}. That’s the system working.`, basis: 'From your check-ins after roadmap steps.' });
  }

  // Reality checks that surprised them.
  const surprised = Object.entries(p.reality).filter(([, r]) => r === 'probablyNot').length;
  if (surprised >= 2) out.push({ id: 'reality', text: `The day-to-day reality changed your mind about ${plural(surprised, 'career')}. You’re learning to look past the highlight reel.`, basis: 'From your reality-check answers.' });

  return out.slice(0, 6);
}

const SKILL_LABEL = (id: string) => (SKILLS[id as keyof typeof SKILLS]?.label ?? id).toLowerCase();
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function listOf(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? '';
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}
