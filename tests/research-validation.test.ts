import { describe, expect, it } from 'vitest';
import { SIMULATIONS } from '../src/data/simulations';
import { SIMULATION_EVIDENCE } from '../src/data/simulations/evidence';
import { emptyProfile } from '../src/lib/profile';
import { dueOutcomeCheckIns } from '../src/lib/outcomes';

describe('simulation evidence ledger', () => {
  it('versions and labels every live simulation', () => {
    expect(Object.keys(SIMULATION_EVIDENCE).sort()).toEqual(SIMULATIONS.map((item) => item.id).sort());
    for (const simulation of SIMULATIONS) {
      const evidence = SIMULATION_EVIDENCE[simulation.id];
      expect(evidence.version).toMatch(/^\d+\.\d+$/);
      expect(evidence.constructs.length).toBeGreaterThan(1);
      expect(evidence.sources.length).toBeGreaterThanOrEqual(3);
      expect(evidence.reviewStatus).toBe('SME review pending');
    }
  });
});

describe('longitudinal outcome check-ins', () => {
  it('schedules 7, 30 and 90 day windows separately for each run', () => {
    const profile = emptyProfile();
    profile.simulations.push({ runId: 'run-a', simulationId: 'software', completedAt: '2026-01-01T00:00:00.000Z', enjoyment: 4, enjoyed: [], frustrated: [], regularly: 'yes', natural: '' });
    expect(dueOutcomeCheckIns(profile, new Date('2026-01-08T00:00:00.000Z')).map((item) => item.window)).toEqual(['7d']);
    profile.outcomeCheckIns.push({ id: 'o1', simulationId: 'software', simulationRunId: 'run-a', window: '7d', clarity: 4, confidence: 4, action: 'researched', completedAt: '2026-01-08T00:00:00.000Z' });
    expect(dueOutcomeCheckIns(profile, new Date('2026-04-02T00:00:00.000Z')).map((item) => item.window)).toEqual(['30d', '90d']);
  });
});
