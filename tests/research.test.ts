import { describe, expect, it } from 'vitest';
import { RESEARCH_AUDIT, RESEARCH_SOURCES, researchSourceById } from '../src/data/research';
import { CAREERS } from '../src/data/careers';
import { emptyProfile } from '../src/lib/profile';
import { matchCareer } from '../src/lib/matching';

describe('research and trust audit', () => {
  it('links every audited component to at least two peer-reviewed sources', () => {
    expect(RESEARCH_SOURCES.length).toBeGreaterThanOrEqual(5);
    for (const item of RESEARCH_AUDIT) {
      expect(item.sources.length, item.area).toBeGreaterThanOrEqual(2);
      for (const id of item.sources) expect(researchSourceById[id], item.area + ' -> ' + id).toBeDefined();
    }
  });

  it('does not let the unvalidated custom aptitude bank affect matching', () => {
    const profile = emptyProfile();
    const career = CAREERS.find((c) => c.aptitudes.length > 0)!;
    profile.aptitudes = Object.fromEntries(career.aptitudes.map((a) => [a, { correct: 99, total: 100 }]));
    const result = matchCareer(career, profile);
    expect(result.dimensions.aptitude.score).toBeNull();
  });
});
