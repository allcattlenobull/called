import { ASSESSMENTS } from '../data/assessments';
import { SIMULATIONS } from '../data/simulations';
import type { Profile } from '../types';
import { suggestions } from './matching';

export interface NextAction {
  id: string;
  title: string;
  why: string;
  to: string;
  kind: 'discover' | 'purpose' | 'careers' | 'try' | 'path';
}

/** The single most useful things to do next, so the next step is always visible. */
export function nextActions(p: Profile, limit = 3): NextAction[] {
  const out: NextAction[] = [];
  const missing = ASSESSMENTS.filter((a) => !p.completed[a.id]);
  for (const a of missing.slice(0, 2)) {
    out.push({ id: `a-${a.id}`, title: `${a.title}: ${a.question}`, why: `${a.minutes} minutes. ${a.blurb}`, to: `/discover/${a.id}`, kind: 'discover' });
  }
  if (!p.gifts.length) out.push({ id: 'gifts', title: 'Name your gifts', why: 'Pick the strengths that show up again and again.', to: '/purpose/gifts', kind: 'purpose' });
  if (!p.serves.length) out.push({ id: 'serve', title: 'Who do you want to help?', why: 'Service shapes which careers feel meaningful.', to: '/purpose/serve', kind: 'purpose' });
  if (!p.simulations.length) {
    const top = suggestions(p, 6).find((s) => s.career.simulationId);
    const sim = SIMULATIONS.find((s) => s.id === top?.career.simulationId) ?? SIMULATIONS[0];
    out.push({ id: `sim-${sim.id}`, title: `Try it: ${sim.title}`, why: `A ${sim.minutes}-minute taste of ${sim.role.toLowerCase()} work.`, to: `/try/${sim.id}`, kind: 'try' });
  }
  if (p.saved.length < 2) out.push({ id: 'explore', title: 'Save a few careers to explore', why: 'Saved careers power Compare and My Path.', to: '/careers', kind: 'careers' });
  if (!p.problems.length) out.push({ id: 'care', title: 'What problems do you care about?', why: 'Problems you can’t ignore are clues to purpose.', to: '/purpose/care', kind: 'purpose' });
  if (!p.experiments.length) out.push({ id: 'exp', title: 'Run a purpose experiment', why: 'Real-world evidence beats guessing.', to: '/try/experiments', kind: 'try' });
  if (p.saved.length >= 2 && p.comparisons === 0) out.push({ id: 'compare', title: 'Compare your saved careers', why: 'Put pay, training and fit side by side.', to: '/compare', kind: 'careers' });
  if (p.saved.length && !p.roadmaps.length) out.push({ id: 'path', title: 'Explore a path', why: 'Pick one possibility and gather real evidence about it. Exploring isn’t committing.', to: '/path', kind: 'path' });
  if (!p.statements.length && p.gifts.length && p.serves.length) out.push({ id: 'statement', title: 'Draft your current purpose statement', why: 'It will change, and that’s fine.', to: '/purpose/statement', kind: 'purpose' });
  if (out.length < limit) {
    const remaining = SIMULATIONS.filter((s) => !p.simulations.some((r) => r.simulationId === s.id));
    if (remaining[0]) out.push({ id: `sim-${remaining[0].id}`, title: `Try it: ${remaining[0].title}`, why: `${remaining[0].role}, ${remaining[0].minutes} minutes.`, to: `/try/${remaining[0].id}`, kind: 'try' });
  }
  return out.slice(0, limit);
}

export function progressCounts(p: Profile) {
  return {
    assessments: Object.keys(p.completed).length,
    careersExplored: new Set(p.careerViews).size,
    simulations: new Set(p.simulations.map((s) => s.simulationId)).size,
    interviews: p.interviews + p.experiments.filter((e) => e.experimentId === 'interview-pro' && e.status === 'done').length,
    experiments: p.experiments.filter((e) => e.status === 'done').length,
    saved: p.saved.length,
    comparisons: p.comparisons,
    reflections: p.journal.length,
  };
}
