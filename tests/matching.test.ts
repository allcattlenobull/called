import { describe, expect, it } from 'vitest';
import { CAREER_BY_ID, CAREERS } from '../src/data/careers';
import { emptyProfile } from '../src/lib/profile';
import { matchCareer, rankCareers, estimatedEducationCost } from '../src/lib/matching';
import { computeCompass } from '../src/lib/compass';
import { INTEREST_ITEMS } from '../src/data/assessments';

function helperProfile() {
  const p = emptyProfile();
  for (const item of INTEREST_ITEMS) p.interests[item.id] = item.interest === 'help' ? 1 : item.interest === 'build' ? -1 : 0;
  p.values = { helping: 'essential', meaningful: 'essential', income: 'notPriority' };
  p.serves = ['patients', 'children'];
  return p;
}

describe('matching engine', () => {
  it('returns no score and early confidence with no evidence', () => {
    const m = matchCareer(CAREERS[0], emptyProfile());
    expect(m.overall).toBeNull();
    expect(m.confidence).toBe('early');
    for (const d of Object.values(m.dimensions)) expect(d.score).toBeNull();
  });

  it('ranks helping careers above building careers for someone who loves helping', () => {
    const ranked = rankCareers(helperProfile());
    const pos = (id: string) => ranked.findIndex((r) => r.career.id === id);
    expect(pos('registered-nurse')).toBeLessThan(pos('welder'));
    expect(pos('elementary-teacher')).toBeLessThan(pos('software-developer'));
  });

  it('always explains why and keeps component scores visible', () => {
    const m = matchCareer(CAREER_BY_ID['registered-nurse'], helperProfile());
    expect(m.overall).not.toBeNull();
    expect(m.explanation).toMatch(/appeared because/);
    expect(m.dimensions.interest.score).toBeGreaterThan(60);
    expect(m.dimensions.purpose.reasons.length).toBeGreaterThan(0);
  });

  it('flags debt conflicts for long, expensive training', () => {
    const p = emptyProfile();
    p.lifestyle = { debt: 'avoid', trainingYears: 'short' };
    const m = matchCareer(CAREER_BY_ID['physical-therapist'], p);
    expect(m.conflicts.some((c) => c.dimension === 'financial')).toBe(true);
    expect(m.conflicts.some((c) => c.dimension === 'education')).toBe(true);
  });

  it('treats paid apprenticeships gently on training time', () => {
    const p = emptyProfile();
    p.lifestyle = { trainingYears: 'short', debt: 'avoid' };
    const m = matchCareer(CAREER_BY_ID['electrician'], p);
    expect(m.dimensions.education.score).toBeGreaterThanOrEqual(70);
    expect(m.dimensions.financial.score).toBe(100);
  });

  it('lets experience move recommendations', () => {
    const p = helperProfile();
    const before = matchCareer(CAREER_BY_ID['medical-assistant'], p).overall!;
    p.simulations.push({ simulationId: 'healthcare', completedAt: '', enjoyment: 5, enjoyed: ['calm', 'serve'], frustrated: [], regularly: 'yes', natural: '', quality: 1 });
    const after = matchCareer(CAREER_BY_ID['medical-assistant'], p).overall!;
    expect(after).toBeGreaterThan(before);
    p.careerStatus['medical-assistant'] = 'notForMe';
    expect(matchCareer(CAREER_BY_ID['medical-assistant'], p).overall!).toBeLessThan(after);
  });

  it('estimates higher costs for longer degrees', () => {
    expect(estimatedEducationCost(CAREER_BY_ID['lawyer'])).toBeGreaterThan(estimatedEducationCost(CAREER_BY_ID['accountant']));
    expect(estimatedEducationCost(CAREER_BY_ID['chef'])).toBe(0);
  });
});

describe('purpose compass', () => {
  it('has eleven dimensions that start unexplored and fill in', () => {
    expect(computeCompass(emptyProfile()).every((d) => d.evidence === 0)).toBe(true);
    const dims = computeCompass(helperProfile());
    expect(dims).toHaveLength(11);
    expect(dims.find((d) => d.id === 'interests')!.evidence).toBeGreaterThan(0.5);
    expect(dims.find((d) => d.id === 'interests')!.summary).toMatch(/Helping/);
  });
});
