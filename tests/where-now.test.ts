import { describe, expect, it } from 'vitest';
import { CAREER_BY_ID } from '../src/data/careers';
import { emptyProfile, normalizeProfile } from '../src/lib/profile';
import { fieldMatches, readiness, transferableSkills } from '../src/lib/readiness';
import { matchCareer, remainingEducationCost, estimatedEducationCost } from '../src/lib/matching';
import { nextMoves } from '../src/lib/nextMoves';
import { computeRoi, defaultAssumptions } from '../src/lib/roi';
import { placeSearches } from '../src/lib/network';
import type { Profile } from '../src/types';

function teacher(): Profile {
  const p = emptyProfile();
  p.stage = 'working';
  p.current = { careerId: 'high-school-teacher', pay: 60000, yearsInRole: 8, education: 'bachelor', field: 'Education' };
  p.lifestyle.trainingYears = 'none';
  p.location = { place: 'm12060', state: 'GA', considering: [] };
  return p;
}

describe('where you are now', () => {
  it('credits a finished degree', () => {
    const p = teacher();
    expect(readiness(CAREER_BY_ID['hr-specialist'], p)?.kind).toBe('ready');
    const pa = readiness(CAREER_BY_ID['physician-assistant'], p)!;
    expect(pa.years).toBe(CAREER_BY_ID['physician-assistant'].education.years - 4);
    expect(pa.summary).toMatch(/counts toward it/);
    expect(readiness(CAREER_BY_ID['high-school-teacher'], p)?.summary).toBe('You already do this work.');
    expect(readiness(CAREER_BY_ID.electrician, p)?.paid).toBe(true);
    expect(readiness(CAREER_BY_ID.electrician, emptyProfile())).toBeUndefined();
  });

  it('flags when a degree is usually expected in a different field', () => {
    expect(fieldMatches('Education', ['Instructional design', 'Education'])).toBe(true);
    expect(fieldMatches('Fire science', ['Accounting', 'Finance'])).toBe(false);
    const p = teacher();
    p.current!.field = 'Music';
    const acc = readiness(CAREER_BY_ID.accountant, p)!;
    expect(acc.kind).not.toBe('ready');
    expect(acc.summary).toMatch(/accounting/i);
    for (const id of ['registered-nurse', 'dental-hygienist', 'air-traffic-controller']) expect(readiness(CAREER_BY_ID[id], teacher())?.kind, id).not.toBe('ready');
    p.current!.field = 'Business';
    expect(readiness(CAREER_BY_ID['hr-specialist'], p)?.note).toBeUndefined();
  });

  it('respects “no more school than I already have” in matching', () => {
    const p = teacher();
    const ready = matchCareer(CAREER_BY_ID['hr-specialist'], p);
    const more = matchCareer(CAREER_BY_ID['physician-assistant'], p);
    expect(ready.dimensions.education.score!).toBeGreaterThanOrEqual(85);
    expect(more.dimensions.education.score!).toBeLessThan(40);
    expect(more.conflicts.some((c) => /no more school/.test(c.text))).toBe(true);
  });

  it('compares pay with current pay', () => {
    const p = teacher();
    p.current!.pay = 150000;
    const m = matchCareer(CAREER_BY_ID['hr-specialist'], p);
    expect(m.conflicts.some((c) => /less than you earn now/.test(c.text))).toBe(true);
  });

  it('suggests next moves that need no more school, with skills that carry over', () => {
    const p = teacher();
    p.skills = { teaching: 3, communication: 3, organization: 2, empathy: 2 };
    const moves = nextMoves(p, { noMoreSchool: true });
    expect(moves.length).toBeGreaterThan(3);
    for (const m of moves) expect(m.ready?.years).toBe(0);
    expect(moves.some((m) => m.career.id === 'instructional-designer')).toBe(true);
    expect(moves.every((m) => m.career.id !== 'high-school-teacher')).toBe(true);
    expect(transferableSkills(CAREER_BY_ID['instructional-designer'], p).length).toBeGreaterThan(0);
    expect(moves[0].payChange).toBeDefined();
  });

  it('prices only the school still ahead and uses current pay as what you give up', () => {
    const p = teacher();
    const pa = CAREER_BY_ID['physician-assistant'];
    expect(remainingEducationCost(pa, p)).toBeLessThan(estimatedEducationCost(pa));
    const a = defaultAssumptions(pa, { profile: p });
    expect(a.years).toBe(pa.education.years - 4);
    expect(a.alternativeEarnings).toBe(60000);
    expect(defaultAssumptions(CAREER_BY_ID['hr-specialist'], { profile: p }).tuition).toBe(0);
    expect(computeRoi(pa, a).opportunityCost).toBe(60000 * a.years);
  });

  it('keeps the current situation safe through import', () => {
    const p = normalizeProfile({ current: { pay: -5, education: 'phd', careerId: 'x', yearsInRole: 3 } });
    expect(p.current?.pay).toBeUndefined();
    expect(p.current?.education).toBeUndefined();
    expect(p.current?.yearsInRole).toBe(3);
  });

  it('builds live local searches for each place', () => {
    const s = placeSearches(CAREER_BY_ID.electrician, 'Houston, TX');
    expect(s.some((x) => /IBEW/.test(x.label))).toBe(true);
    expect(s.every((x) => x.url.startsWith('https://www.google.com/maps/search/?api=1&query='))).toBe(true);
    expect(s.find((x) => /American Job/.test(x.label))?.url).toContain(encodeURIComponent('Houston, TX'));
  });
});
