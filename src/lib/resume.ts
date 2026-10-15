import { APTITUDE_ITEMS, INTEREST_ITEMS, LIFESTYLE_QUESTIONS, WORK_STYLE_ITEMS } from '../data/assessments';
import { SIM_BY_ID } from '../data/simulations';
import { SKILLS, VALUES } from '../data/vocab';
import type { Profile } from '../types';

export interface ResumeItem {
  id: string;
  title: string;
  detail: string;
  to: string;
  progress: number;
}

/** Everything the user started but didn’t finish, so the dashboard can offer to pick it back up. */
export function unfinished(p: Profile): ResumeItem[] {
  const out: ResumeItem[] = [];
  const partial = (id: string, title: string, have: number, total: number, to: string, noun: string) => {
    if (have > 0 && have < total) out.push({ id, title, detail: `${have} of ${total} ${noun}`, to, progress: have / total });
  };
  if (!p.completed.interests) partial('interests', 'Interests', Object.keys(p.interests).length, INTEREST_ITEMS.length, '/discover/interests', 'activities');
  if (!p.completed.skills) partial('skills', 'Skills', Object.keys(p.skills).length, Object.keys(SKILLS).length, '/discover/skills', 'skills rated');
  if (!p.completed.values) partial('values', 'Values', Object.keys(p.values).length, Object.keys(VALUES).length, '/discover/values', 'values sorted');
  if (!p.completed.lifestyle) partial('lifestyle', 'Lifestyle', Object.values(p.lifestyle).filter(Boolean).length, LIFESTYLE_QUESTIONS.length, '/discover/lifestyle', 'questions');

  const apt = p.drafts.aptitudes as { idx: number } | undefined;
  if (apt && apt.idx > 0 && apt.idx < APTITUDE_ITEMS.length) partial('aptitudes', 'Aptitude puzzles', apt.idx, APTITUDE_ITEMS.length, '/discover/aptitudes', 'puzzles');
  const ws = p.drafts.workStyle as { idx: number } | undefined;
  if (ws && ws.idx > 0 && ws.idx < WORK_STYLE_ITEMS.length) partial('workStyle', 'Work style', ws.idx, WORK_STYLE_ITEMS.length, '/discover/workStyle', 'choices');

  for (const [key, value] of Object.entries(p.drafts)) {
    if (!key.startsWith('sim:')) continue;
    const sim = SIM_BY_ID[key.slice(4)];
    const run = value as { phase: string; stepIdx: number } | undefined;
    if (!sim || !run || (run.phase !== 'steps' && run.phase !== 'reflect')) continue;
    out.push({
      id: key,
      title: `Simulation: ${sim.title}`,
      detail: run.phase === 'reflect' ? 'Reflection left to finish' : `Decision ${run.stepIdx + 1} of ${sim.steps.length}`,
      to: `/try/${sim.id}`,
      progress: run.phase === 'reflect' ? 0.9 : run.stepIdx / sim.steps.length,
    });
  }

  for (const e of p.experiments) {
    if (e.status === 'planned') {
      out.push({ id: `exp:${e.experimentId}`, title: 'Purpose experiment in progress', detail: 'Come back and record what you learned', to: `/try/experiments/${e.experimentId}`, progress: 0.5 });
    }
  }
  return out;
}
