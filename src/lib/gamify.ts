/**
 * Called's game layer. The game is gathering evidence about yourself (see evidence.ts);
 * evidence points, levels and badges are the motivational layer underneath it.
 * Everything is derived from the profile, so points always match what the user has
 * actually done. Rewards go to real exploration, not to clicking around, and every badge
 * explains what it taught the user.
 */
import { ASSESSMENTS, APTITUDE_ITEMS } from '../data/assessments';
import { SIMULATIONS } from '../data/simulations';
import type { Profile } from '../types';
import { stepsDone } from './path';
import type { EvidenceId } from './evidence';

export interface PointLine {
  id: string;
  label: string;
  count: number;
  each: number;
  cap?: number;
  points: number;
}

const line = (id: string, label: string, count: number, each: number, cap?: number): PointLine => {
  const n = cap === undefined ? count : Math.min(count, cap);
  return { id, label, count, each, cap, points: n * each };
};

export function pointLines(p: Profile): PointLine[] {
  const doneExps = p.experiments.filter((e) => e.status === 'done').length;
  const steps = stepsDone(p);
  return [
    line('onboard', 'Started your journey', p.onboarded ? 1 : 0, 25),
    line('assess', 'Assessments completed', Object.keys(p.completed).length, 60),
    line('gifts', 'Gifts named', Math.min(p.gifts.length, 1), 25),
    line('serve', 'People you want to serve', Math.min(p.serves.length, 1), 25),
    line('care', 'Problems you care about', Math.min(p.problems.length, 1), 25),
    line('experiences', 'Experiences logged', p.experiences.length, 20, 10),
    line('feedback', 'Feedback from others', p.feedback.length, 30, 6),
    line('journal', 'Journal reflections', p.journal.length, 15, 20),
    line('statement', 'Purpose statement versions', p.statements.length, 40, 5),
    line('views', 'Careers explored', new Set(p.careerViews).size, 5, 40),
    line('reality', 'Reality checks answered', Object.keys(p.reality).length, 15, 20),
    line('sims', 'Simulations completed', new Set(p.simulations.map((s) => s.simulationId)).size, 80),
    line('exps', 'Purpose experiments completed', doneExps, 100),
    line('compare', 'Paths compared', p.comparisons, 20, 5),
    line('roadmaps', 'Paths explored', p.roadmaps.length, 40, 3),
    line('steps', 'Roadmap steps done', steps, 25, 20),
  ];
}

export function totalPoints(p: Profile): number {
  return pointLines(p).reduce((s, l) => s + l.points, 0);
}

/* ---------- Levels ---------- */

export interface Level {
  n: number;
  name: string;
  min: number;
  blurb: string;
}

export const LEVELS: Level[] = [
  { n: 1, name: 'Curious', min: 0, blurb: 'You’ve opened the door.' },
  { n: 2, name: 'Explorer', min: 150, blurb: 'You’re gathering your first evidence.' },
  { n: 3, name: 'Seeker', min: 400, blurb: 'Patterns are starting to show.' },
  { n: 4, name: 'Pathfinder', min: 800, blurb: 'You’re testing ideas in the real world.' },
  { n: 5, name: 'Builder', min: 1400, blurb: 'You’re turning possibilities into plans.' },
  { n: 6, name: 'Steward', min: 2200, blurb: 'You’re investing what you’ve been given.' },
  { n: 7, name: 'Wayfinder', min: 3200, blurb: 'You know how to gather evidence, choose well and keep choosing.' },
];

export function levelFor(points: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) idx = i;
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next ? (points - level.min) / (next.min - level.min) : 1;
  return { level, next, progress, toNext: next ? next.min - points : 0 };
}

/* ---------- Badges ---------- */

export interface Badge {
  id: string;
  name: string;
  description: string;
  /** Short glyph drawn in the badge medallion. */
  glyph: string;
  family: 'self' | 'life' | 'purpose';
  /** The kind of evidence this badge adds to. */
  evidence: EvidenceId;
  /** What earning it means, shown when it's earned: learning first, reward second. */
  insight: { headline: string; body: string };
  /** Current progress and target. */
  progress: (p: Profile) => [number, number];
}

export const BADGES: Badge[] = [
  { id: 'first-step', name: 'First step', description: 'Start your journey.', glyph: '1', family: 'self', evidence: 'self', insight: { headline: 'You started gathering evidence.', body: 'Everything Called suggests comes from what you share and try. This is the first piece.' }, progress: (p) => [p.onboarded ? 1 : 0, 1] },
  { id: 'know-thyself', name: 'Know yourself', description: 'Complete all six Discover assessments.', glyph: '6', family: 'self', evidence: 'self', insight: { headline: 'You have a full picture to start from.', body: 'With all six assessments done, your matches draw on interests, skills, aptitudes, work style, values and lifestyle together, not just one of them.' }, progress: (p) => [Object.keys(p.completed).length, ASSESSMENTS.length] },
  { id: 'puzzle-solver', name: 'Puzzle solver', description: 'Get 12 or more aptitude puzzles right.', glyph: '◆', family: 'self', evidence: 'self', insight: { headline: 'Your strengths showed up in what you did, not only what you said.', body: 'Puzzle results are evidence you can’t talk yourself into. Treat them as hints to test, not verdicts.' }, progress: (p) => [Object.values(p.aptitudes).reduce((s, a) => s + (a?.correct ?? 0), 0), Math.min(12, APTITUDE_ITEMS.length)] },
  { id: 'gift-finder', name: 'Gift finder', description: 'Name three of your gifts.', glyph: '✦', family: 'purpose', evidence: 'self', insight: { headline: 'You named what you bring.', body: 'Gifts you can name are gifts you can look for in work. Watch for careers that put them to use.' }, progress: (p) => [p.gifts.length, 3] },
  { id: 'heart-for-people', name: 'Heart for people', description: 'Choose who you want to serve and the problems you care about.', glyph: '♥', family: 'purpose', evidence: 'self', insight: { headline: 'You know who you want your work to help.', body: 'Who you serve and what you care about often matters more to lasting satisfaction than the job title.' }, progress: (p) => [(p.serves.length ? 1 : 0) + (p.problems.length ? 1 : 0), 2] },
  { id: 'wise-counsel', name: 'Wise counsel', description: 'Record what three people see in you.', glyph: '3', family: 'life', evidence: 'self', insight: { headline: 'You asked people who know you.', body: 'Others often see strengths you overlook. Three outside views make your picture more honest.' }, progress: (p) => [p.feedback.length, 3] },
  { id: 'reflector', name: 'Reflector', description: 'Write five journal reflections.', glyph: '5', family: 'purpose', evidence: 'self', insight: { headline: 'You’re noticing patterns in yourself.', body: 'Writing down what you learn turns experiences into evidence you can look back on.' }, progress: (p) => [p.journal.length, 5] },
  { id: 'statement', name: 'Purpose in words', description: 'Write your current purpose statement.', glyph: '“', family: 'purpose', evidence: 'self', insight: { headline: 'You put your direction into words.', body: 'A purpose statement isn’t final. It’s a draft you’ll keep testing and rewriting.' }, progress: (p) => [Math.min(p.statements.length, 1), 1] },
  { id: 'scout', name: 'Scout', description: 'Explore 25 different careers.', glyph: '25', family: 'life', evidence: 'exposure', insight: { headline: 'You looked widely before narrowing.', body: 'Exploring 25 careers means your options come from a real range, not just the jobs you already knew about.' }, progress: (p) => [new Set(p.careerViews).size, 25] },
  { id: 'reality-checker', name: 'Reality checker', description: 'Answer five career reality checks.', glyph: '✓', family: 'life', evidence: 'exposure', insight: { headline: 'You looked past the highlight reel.', body: 'Comparing what you imagined with what the work is really like is one of the fastest ways to learn what fits.' }, progress: (p) => [Object.keys(p.reality).length, 5] },
  { id: 'field-tester', name: 'Field tester', description: 'Finish your first career simulation.', glyph: '▶', family: 'life', evidence: 'exposure', insight: { headline: 'You tested the work instead of guessing.', body: 'You’ve now completed a real-work simulation. Your reaction to that experience is more useful than a career quiz alone.' }, progress: (p) => [Math.min(p.simulations.length, 1), 1] },
  { id: 'sampler', name: 'Sampler', description: 'Finish five different simulations.', glyph: '5', family: 'life', evidence: 'exposure', insight: { headline: 'You’ve felt the shape of five kinds of work.', body: 'Comparing how different work felt tells you more than any single result.' }, progress: (p) => [new Set(p.simulations.map((s) => s.simulationId)).size, 5] },
  { id: 'full-tour', name: 'Full tour', description: `Finish all ${SIMULATIONS.length} simulations.`, glyph: '★', family: 'life', evidence: 'exposure', insight: { headline: 'You’ve tried every simulation.', body: 'You now have a reaction to every kind of work Called can simulate. Those reactions are some of your strongest evidence.' }, progress: (p) => [new Set(p.simulations.map((s) => s.simulationId)).size, SIMULATIONS.length] },
  { id: 'real-world', name: 'Real world', description: 'Complete a purpose experiment.', glyph: '⚑', family: 'purpose', evidence: 'real', insight: { headline: 'You tested it in real life.', body: 'A real experiment beats any screen. What gave you energy, and what drained you, is now part of your evidence.' }, progress: (p) => [Math.min(p.experiments.filter((e) => e.status === 'done').length, 1), 1] },
  { id: 'interviewer', name: 'Interviewer', description: 'Interview someone who does the work.', glyph: '?', family: 'life', evidence: 'real', insight: { headline: 'You heard it from someone inside the work.', body: 'One honest conversation can confirm a path or save you years. That’s evidence no website can give you.' }, progress: (p) => [p.experiments.some((e) => e.experimentId === 'interview-pro' && e.status === 'done') ? 1 : 0, 1] },
  { id: 'honest-no', name: 'Honest no', description: 'Rule out a career. Knowing what doesn’t fit is progress.', glyph: '×', family: 'self', evidence: 'decision', insight: { headline: 'Ruling something out is progress.', body: 'Every career you eliminate gives you more information about the kind of work that fits you.' }, progress: (p) => [Object.values(p.careerStatus).includes('notForMe') ? 1 : 0, 1] },
  { id: 'weigher', name: 'Weigh it up', description: 'Compare careers side by side.', glyph: '⇄', family: 'life', evidence: 'decision', insight: { headline: 'You weighed real options side by side.', body: 'Wise decisions come from comparing alternatives, not falling for the first good one.' }, progress: (p) => [Math.min(p.comparisons, 1), 1] },
  { id: 'mapmaker', name: 'Mapmaker', description: 'Start exploring a path.', glyph: '↗', family: 'purpose', evidence: 'decision', insight: { headline: 'You started testing a path.', body: 'Exploring isn’t committing. You’re gathering evidence about one possibility at a time.' }, progress: (p) => [Math.min(p.roadmaps.length, 1), 1] },
  { id: 'faithful-steps', name: 'Follow through', description: 'Complete five steps on paths you’re testing.', glyph: '5', family: 'purpose', evidence: 'decision', insight: { headline: 'You followed through.', body: 'Five steps taken means you’re learning from action, not just intention. That’s how direction gets clearer.' }, progress: (p) => [stepsDone(p), 5] },
  { id: 'steady', name: 'Steady', description: 'Come back three weeks in a row.', glyph: '∞', family: 'self', evidence: 'self', insight: { headline: 'You keep showing up.', body: 'Clarity comes from steady exploration over time, not one big moment.' }, progress: (p) => [weeklyStreak(p.activeDays), 3] },
];

export function earnedBadges(p: Profile): Badge[] {
  return BADGES.filter((b) => {
    const [have, need] = b.progress(p);
    return have >= need;
  });
}

/* ---------- Streaks (weekly, so missing a day never "breaks" anything) ---------- */

function weekKey(d: Date): string {
  // ISO-ish week key: the Monday of the week.
  const day = (d.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
  return monday.toISOString().slice(0, 10);
}

export function weeklyStreak(activeDays: string[], today = new Date()): number {
  const weeks = new Set(activeDays.map((d) => weekKey(new Date(`${d}T12:00:00Z`))));
  let streak = 0;
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  // If this week has no activity yet, start counting from last week.
  if (!weeks.has(weekKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 7);
  while (weeks.has(weekKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 7);
  }
  return streak;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ---------- Weekly quests ---------- */

export interface Quest {
  id: string;
  title: string;
  to: string;
  points: number;
  /** The kind of evidence the quest builds. */
  evidence: EvidenceId;
  done: (p: Profile) => boolean;
  /** Only offer quests that make sense for where the user is. */
  available: (p: Profile) => boolean;
}

const QUESTS: Quest[] = [
  { id: 'q-assess', title: 'Finish one more Discover assessment', to: '/discover', points: 60, evidence: 'self', available: (p) => Object.keys(p.completed).length < 6, done: () => false },
  { id: 'q-sim', title: 'Try a simulation you haven’t done', to: '/try', points: 80, evidence: 'exposure', available: (p) => new Set(p.simulations.map((s) => s.simulationId)).size < SIMULATIONS.length, done: () => false },
  { id: 'q-reality', title: 'Answer three reality checks', to: '/careers', points: 45, evidence: 'exposure', available: () => true, done: () => false },
  { id: 'q-journal', title: 'Write a journal reflection', to: '/purpose/journal', points: 15, evidence: 'self', available: () => true, done: () => false },
  { id: 'q-feedback', title: 'Ask someone what they see in you', to: '/purpose/feedback', points: 30, evidence: 'self', available: () => true, done: () => false },
  { id: 'q-experiment', title: 'Commit to a purpose experiment', to: '/try/experiments', points: 100, evidence: 'real', available: (p) => p.experiments.filter((e) => e.status === 'done').length < 12, done: () => false },
  { id: 'q-explore', title: 'Explore five new careers', to: '/careers', points: 25, evidence: 'exposure', available: () => true, done: () => false },
  { id: 'q-step', title: 'Take a step on a path you’re testing', to: '/path', points: 25, evidence: 'decision', available: (p) => p.roadmaps.length > 0, done: () => false },
  { id: 'q-compare', title: 'Compare two careers', to: '/compare', points: 20, evidence: 'decision', available: (p) => p.saved.length >= 2, done: () => false },
];

/**
 * Three quests for the current week. Completion is measured by comparing the profile now
 * with a snapshot taken when the week's quests were first shown (stored in drafts).
 */
export interface QuestSnapshot {
  week: string;
  ids: string[];
  base: Record<string, number>;
}

export function questMetric(id: string, p: Profile): number {
  switch (id) {
    case 'q-assess':
      return Object.keys(p.completed).length;
    case 'q-sim':
      return new Set(p.simulations.map((s) => s.simulationId)).size;
    case 'q-reality':
      return Object.keys(p.reality).length;
    case 'q-journal':
      return p.journal.length;
    case 'q-feedback':
      return p.feedback.length;
    case 'q-experiment':
      return p.experiments.length;
    case 'q-explore':
      return new Set(p.careerViews).size;
    case 'q-step':
      return stepsDone(p);
    case 'q-compare':
      return p.comparisons;
    default:
      return 0;
  }
}

const QUEST_TARGET: Record<string, number> = { 'q-reality': 3, 'q-explore': 5 };

export function currentWeek(today = new Date()): string {
  return weekKey(today);
}

export function pickQuests(p: Profile, week = currentWeek()): QuestSnapshot {
  const avail = QUESTS.filter((q) => q.available(p));
  // Deterministic rotation by week so the set is stable all week.
  const seed = Number(week.replace(/-/g, '')) % 97;
  const sorted = [...avail].sort((a, b) => ((a.id.charCodeAt(2) * 31 + seed) % 17) - ((b.id.charCodeAt(2) * 31 + seed) % 17));
  const ids = sorted.slice(0, 3).map((q) => q.id);
  return { week, ids, base: Object.fromEntries(ids.map((id) => [id, questMetric(id, p)])) };
}

export function questStatus(p: Profile, snap: QuestSnapshot) {
  return snap.ids
    .map((id) => QUESTS.find((q) => q.id === id))
    .filter((q): q is Quest => !!q)
    .map((q) => {
      const target = QUEST_TARGET[q.id] ?? 1;
      const have = Math.max(0, questMetric(q.id, p) - (snap.base[q.id] ?? 0));
      return { quest: q, have: Math.min(have, target), target, done: have >= target };
    });
}
