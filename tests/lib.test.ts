import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { CAREER_BY_ID } from '../src/data/careers';
import { computeRoi, defaultAssumptions, monthlyPayment } from '../src/lib/roi';
import { generateRoadmap } from '../src/lib/path';
import { emptyProfile, normalizeProfile } from '../src/lib/profile';
import { exportJourney, loadProfile, parseJourney, saveProfile, clearProfile } from '../src/lib/storage';

describe('education ROI', () => {
  it('computes standard loan payments', () => {
    expect(Math.round(monthlyPayment(10000, 0.06, 10))).toBe(111);
    expect(monthlyPayment(0, 0.06, 10)).toBe(0);
  });

  it('shows an apprenticeship pays back faster than a doctorate', () => {
    const e = CAREER_BY_ID['electrician'];
    const pt = CAREER_BY_ID['physical-therapist'];
    const re = computeRoi(e, defaultAssumptions(e));
    const rp = computeRoi(pt, defaultAssumptions(pt));
    expect(re.breakEvenYears).not.toBeNull();
    expect(rp.totalCost).toBeGreaterThan(re.totalCost);
    expect(rp.breakEvenYears === null || rp.breakEvenYears > (re.breakEvenYears ?? 0)).toBe(true);
  });
});

describe('roadmaps', () => {
  it('uses career-specific steps when present and generic steps otherwise', () => {
    const cyber = generateRoadmap(CAREER_BY_ID['cybersecurity-analyst']);
    expect(cyber.items.some((i) => i.text.includes('home lab'))).toBe(true);
    const welder = generateRoadmap(CAREER_BY_ID['welder']);
    expect(welder.items.filter((i) => i.horizon === 'now').length).toBeGreaterThanOrEqual(2);
    expect(welder.items.every((i) => !i.done)).toBe(true);
  });
});

describe('local storage of the profile', () => {
  it('round-trips through IndexedDB', async () => {
    const p = emptyProfile();
    p.name = 'Sam';
    p.saved = ['electrician'];
    await saveProfile(p);
    const loaded = await loadProfile();
    expect(loaded.name).toBe('Sam');
    expect(loaded.saved).toEqual(['electrician']);
    await clearProfile();
    expect((await loadProfile()).name).toBeUndefined();
  });

  it('exports and imports a journey, rejecting foreign files', () => {
    const p = emptyProfile();
    p.gifts = ['teaching'];
    expect(parseJourney(exportJourney(p)).gifts).toEqual(['teaching']);
    expect(() => parseJourney('{"hello":1}')).toThrow(/Called/);
  });

  it('repairs malformed imports', () => {
    const p = normalizeProfile({ saved: 'oops', values: [], comparisons: 'x' });
    expect(p.saved).toEqual([]);
    expect(p.values).toEqual({});
    expect(p.comparisons).toBe(0);
  });
});
