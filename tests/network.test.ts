import { describe, expect, it } from 'vitest';
import { CAREER_BY_ID } from '../src/data/careers';
import { marketFor, stateCode } from '../src/lib/market';
import { outreachScript, resourcesForCareer } from '../src/lib/network';
import { emptyProfile, normalizeProfile } from '../src/lib/profile';

describe('local context and networking evidence', () => {
  it('normalizes state names and keeps an older profile safe', () => {
    expect(stateCode('Minnesota')).toBe('MN');
    expect(stateCode('mn')).toBe('MN');
    const old = normalizeProfile({ saved: ['electrician'], interviews: 2 });
    expect(old.saved).toEqual(['electrician']);
    expect(old.conversations).toEqual([]);
    expect(old.location).toBeUndefined();
    const withPlaces = normalizeProfile({ location: { state: 'MN', considering: ['A', 'B', 'C', 'D'] } });
    expect(withPlaces.location?.considering).toEqual(['A', 'B', 'C']);
  });

  it('uses an explicit national fallback when state data is missing', () => {
    const p = emptyProfile();
    p.location = { city: 'Minneapolis', state: 'MN', considering: [] };
    const market = marketFor(CAREER_BY_ID.electrician, p);
    expect(market.pay).toBe(CAREER_BY_ID.electrician.pay.median);
    expect(market.payScope).toBe('national');
    expect(market.payLabel).toBe('U.S. median pay');
  });

  it('maps relevant organizations without making Called a social network', () => {
    const resources = resourcesForCareer(CAREER_BY_ID.electrician, 'highSchool');
    expect(resources.map((r) => r.name)).toEqual(expect.arrayContaining(['IBEW', 'NECA', 'IEC', 'Apprenticeship.gov', 'SkillsUSA']));
  });

  it('writes stage-aware, location-aware outreach language deterministically', () => {
    const p = emptyProfile();
    p.stage = 'working';
    p.location = { city: 'Minneapolis', state: 'MN', considering: [] };
    const script = outreachScript(CAREER_BY_ID.electrician, p);
    expect(script).toMatch(/currently working and considering/);
    expect(script).toMatch(/Minneapolis, MN/);
    expect(script).toMatch(/not asking for a job/);
  });
});
