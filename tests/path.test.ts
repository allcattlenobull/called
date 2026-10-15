import { describe, expect, it } from 'vitest';
import { CAREER_BY_ID } from '../src/data/careers';
import { INTEREST_ITEMS } from '../src/data/assessments';
import { emptyProfile } from '../src/lib/profile';
import { canLead, doneCount, gateDue, generateRoadmap, isDone, learnedInsights, nextBestAction, pathEvidence, retailorRoadmap } from '../src/lib/path';
import type { Profile } from '../src/types';

const cyber = CAREER_BY_ID['cybersecurity-analyst'];

function assessed(): Profile {
  const p = emptyProfile();
  p.stage = 'highSchool';
  for (const i of INTEREST_ITEMS) p.interests[i.id] = i.interest === 'investigate' ? 1 : -1;
  p.values = { independence: 'essential', stability: 'important' };
  p.completed.interests = new Date().toISOString();
  p.completed.values = new Date().toISOString();
  return p;
}

describe('path evidence', () => {
  it('starts early and grows as experience is gathered', () => {
    const p = assessed();
    const before = pathEvidence(cyber, p);
    expect(before.level).toBe('Early');
    expect(before.checks.find((c) => c.id === 'interview')?.met).toBe(false);

    p.reality[cyber.id] = 'definitely';
    p.simulations.push({ simulationId: cyber.simulationId!, completedAt: '', enjoyment: 5, enjoyed: [], frustrated: [], regularly: 'yes', natural: '', quality: 1 });
    p.interviews = 1;
    p.roiChecked.push(cyber.id);
    const after = pathEvidence(cyber, p);
    expect(after.score).toBeGreaterThan(before.score);
    expect(['Moderate', 'Strong']).toContain(after.level);
  });

  it('only offers a leading path after real experience', () => {
    const p = assessed();
    const r = generateRoadmap(cyber, p);
    expect(canLead(r, pathEvidence(cyber, p)).ok).toBe(false);
    p.reality[cyber.id] = 'definitely';
    p.simulations.push({ simulationId: cyber.simulationId!, completedAt: '', enjoyment: 5, enjoyed: [], frustrated: [], regularly: 'yes', natural: '', quality: 1 });
    p.interviews = 1;
    p.roiChecked.push(cyber.id);
    expect(canLead(r, pathEvidence(cyber, p)).ok).toBe(true);
  });
});

describe('next best action', () => {
  it('asks for missing assessments first, then follows the evidence', () => {
    const fresh = emptyProfile();
    expect(nextBestAction(cyber, fresh, undefined).to).toBe('/discover/interests');

    const p = assessed();
    expect(nextBestAction(cyber, p, undefined).to).toContain('#reality');
    p.reality[cyber.id] = 'maybe';
    expect(nextBestAction(cyber, p, undefined).to).toBe(`/try/${cyber.simulationId}`);
    p.simulations.push({ simulationId: cyber.simulationId!, completedAt: '', enjoyment: 4, enjoyed: [], frustrated: [], regularly: 'yes', natural: '', quality: 1 });
    const a = nextBestAction(cyber, p, undefined);
    expect(a.title).toMatch(/talk to someone/i);
    expect(a.why).toMatch(/no real-world evidence/);
    expect(a.to).toBe('/network?career=cybersecurity-analyst');
  });

  it('satisfies interview evidence with a career-specific conversation log', () => {
    const p = assessed();
    p.conversations.push({ id: 'talk_1', careerId: cyber.id, role: 'Security analyst', date: '2026-10-15', notes: 'Learned about the work.' });
    expect(pathEvidence(cyber, p).checks.find((c) => c.id === 'interview')?.met).toBe(true);
  });
});

describe('roadmaps and decision gates', () => {
  it('auto-checks steps from evidence elsewhere in Called', () => {
    const p = assessed();
    const r = generateRoadmap(cyber, p);
    const reality = r.items.find((i) => i.auto === 'reality')!;
    expect(isDone(reality, cyber, p)).toBe(false);
    p.reality[cyber.id] = 'definitely';
    expect(isDone(reality, cyber, p)).toBe(true);
  });

  it('tailors plans to stage of life', () => {
    const teen = assessed();
    const adult = assessed();
    adult.stage = 'working';
    const a = generateRoadmap(cyber, teen).items.map((i) => i.text).join('|');
    const b = generateRoadmap(cyber, adult).items.map((i) => i.text).join('|');
    expect(a).not.toEqual(b);
    expect(a).toMatch(/club, team or volunteer/);
    expect(b).toMatch(/while you keep working/);
  });

  it('adds debt-aware steps when the user wants to avoid debt', () => {
    const p = assessed();
    p.lifestyle.debt = 'avoid';
    const nurse = CAREER_BY_ID['registered-nurse'];
    expect(generateRoadmap(nurse, p).items.some((i) => /cut debt/.test(i.text))).toBe(true);
  });

  it('asks for a gate after three new steps, then waits for more', () => {
    const p = assessed();
    const r = generateRoadmap(cyber, p);
    p.roadmaps.push(r);
    expect(gateDue(r, p)).toBe(false);
    r.items.slice(0, 3).forEach((i) => (i.done = true));
    expect(gateDue(r, p)).toBe(true);
    r.gates = [{ at: '', answer: 'stronger', evidence: 0.3, doneCount: doneCount(r, p) }];
    expect(gateDue(r, p)).toBe(false);
  });

  it('re-tailoring keeps finished and user-written steps', () => {
    const p = assessed();
    const r = generateRoadmap(cyber, p);
    r.items[0].done = true;
    r.items.push({ id: 'mine', text: 'Ask my cousin about her job', horizon: 'six', done: false, mine: true });
    p.stage = 'working';
    const next = retailorRoadmap(r, cyber, p);
    expect(next.items.some((i) => i.id === r.items[0].id)).toBe(true);
    expect(next.items.some((i) => i.id === 'mine')).toBe(true);
    expect(next.items.some((i) => /while you keep working/.test(i.text))).toBe(true);
  });
});

describe('what you have learned', () => {
  it('needs more than one signal before naming a pattern', () => {
    const p = emptyProfile();
    p.workStyle.social = 2;
    expect(learnedInsights(p).some((i) => i.id === 'people')).toBe(false);
    for (const i of INTEREST_ITEMS) p.interests[i.id] = i.interest === 'help' ? 1 : 0;
    const people = learnedInsights(p).find((i) => i.id === 'people');
    expect(people?.text).toBe('You consistently prefer people-centered work.');
    expect(people?.basis).toMatch(/interests/);
  });

  it('spots enjoyed analysis but frustrating number work', () => {
    const p = emptyProfile();
    p.simulations.push({ simulationId: 'financial-analyst', completedAt: '', enjoyment: 3, enjoyed: ['pattern'], frustrated: ['numbers'], regularly: 'maybe', natural: '', quality: 0.5 });
    expect(learnedInsights(p).map((i) => i.text)).toContain('You enjoy analysis but dislike repetitive numerical tasks.');
  });

  it('names flexibility as a priority from values and lifestyle together', () => {
    const p = emptyProfile();
    p.values.flexibility = 'essential';
    p.lifestyle.schedule = 'flexible';
    p.lifestyle.remote = 'hybrid';
    expect(learnedInsights(p).map((i) => i.text)).toContain('Flexibility has emerged as one of your top lifestyle priorities.');
  });
});
