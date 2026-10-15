import { describe, expect, it } from 'vitest';
import { CAREER_BY_ID } from '../src/data/careers';
import { emptyProfile } from '../src/lib/profile';
import { consideredPlaces, costWords, equivalentSalary, homePlace, inUsDollars, localPay, placeById, resolvePlace, toStateCode, PLACE_DATA } from '../src/lib/places';
import { computeRoi, defaultAssumptions } from '../src/lib/roi';
import { collegeCosts } from '../src/lib/places';

describe('places', () => {
  it('has cost of living, college costs and local pay for every state', () => {
    const states = Object.keys(PLACE_DATA.states).filter((k) => k.length === 2);
    expect(states.length).toBeGreaterThanOrEqual(51);
    for (const code of states) {
      const s = PLACE_DATA.states[code];
      expect(s.rpp, code).toBeGreaterThan(70);
      expect(s.rpp, code).toBeLessThan(130);
    }
    expect(collegeCosts('GA')?.public4InState).toBeGreaterThan(1000);
  });

  it('resolves what people type into states and metro areas', () => {
    expect(toStateCode('georgia')).toBe('GA');
    expect(toStateCode('tx')).toBe('TX');
    expect(resolvePlace('Atlanta, GA')?.id).toBe('m12060');
    expect(resolvePlace('Texas')?.kind).toBe('state');
    expect(resolvePlace('Smallville, KS')?.id).toBe('KS');
    expect(resolvePlace('m12060')?.label).toBe('Atlanta area, GA');
  });

  it('uses the chosen home place, then city and state', () => {
    const p = emptyProfile();
    p.location = { city: 'Decatur', state: 'GA', place: 'm12060', considering: ['Denver, CO', 'TX', 'Nowhere'] };
    expect(homePlace(p)?.id).toBe('m12060');
    expect(consideredPlaces(p).map((x) => x.id)).toEqual(['m19740', 'TX']);
  });

  it('prefers metro pay, then state, then the U.S. median', () => {
    const e = CAREER_BY_ID.electrician;
    const atl = localPay(e, placeById('m12060'));
    expect(atl.scope).toBe('metro');
    expect(localPay(e, placeById('TX')).scope).toBe('state');
    expect(localPay(e).scope).toBe('national');
    expect(localPay(CAREER_BY_ID['small-business-owner'], placeById('GA')).scope).toBe('national');
  });

  it('adjusts money for cost of living', () => {
    expect(inUsDollars(110000, 110)).toBe(100000);
    expect(costWords(100.5)).toBe('About the U.S. average');
    expect(costWords(112)).toBe('12% more expensive than average');
    const ny = placeById('m35620');
    const atl = placeById('m12060');
    expect(equivalentSalary(50000, atl, ny)!).toBeGreaterThan(50000);
  });

  it('prices college by the state where you study and pay by where you work', () => {
    const nurse = CAREER_BY_ID['registered-nurse'];
    const accountant = CAREER_BY_ID.accountant;
    expect(accountant.education.level).toBe('bachelor');
    const ga = collegeCosts('GA')!;
    const inState = defaultAssumptions(accountant, { college: ga, outOfState: false });
    const outState = defaultAssumptions(accountant, { college: ga, outOfState: true, livingAway: true });
    expect(outState.tuition).toBeGreaterThan(inState.tuition);
    expect(outState.livingCosts).toBe(ga.public4RoomBoard);
    const ca = defaultAssumptions(nurse, { workPay: localPay(nurse, placeById('CA')).pay });
    expect(computeRoi(nurse, ca).tenYearNet).toBeGreaterThan(computeRoi(nurse, defaultAssumptions(nurse)).tenYearNet);
  });
});
