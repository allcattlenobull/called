import { describe, expect, it } from 'vitest';
import { smartSearchScore, smartMatches } from '../src/lib/smartSearch';

describe('smart search', () => {
  const software = ['Software developer', 'Build and maintain computer applications'];
  const counselor = ['Mental health counselor', 'Provide counseling and therapy'];

  it('handles close misspellings', () => {
    expect(smartMatches('programer', software)).toBe(true);
    expect(smartMatches('councellor', counselor)).toBe(true);
    expect(smartMatches('nuse', ['Registered nurse', 'Patient care in a hospital'])).toBe(true);
    expect(smartMatches('nures', ['Registered nurse', 'Patient care in a hospital'])).toBe(true);
  });

  it('understands common related terms', () => {
    expect(smartMatches('coder', software)).toBe(true);
    expect(smartMatches('therapist', counselor)).toBe(true);
    expect(smartMatches('work from home', ['Data analyst', 'Remote work is common'])).toBe(true);
  });

  it('ranks exact phrases ahead of fuzzy matches and rejects unrelated text', () => {
    expect(smartSearchScore('software developer', software)).toBeGreaterThan(smartSearchScore('programer', software));
    expect(smartMatches('wildlife', software)).toBe(false);
  });
});
