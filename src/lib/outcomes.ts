import type { OutcomeCheckIn, Profile, SimulationResult } from '../types';

const WINDOWS: { window: OutcomeCheckIn['window']; days: number }[] = [
  { window: '7d', days: 7 },
  { window: '30d', days: 30 },
  { window: '90d', days: 90 },
];

export interface DueCheckIn {
  simulation: SimulationResult;
  window: OutcomeCheckIn['window'];
  dueAt: string;
}

export function dueOutcomeCheckIns(profile: Profile, now = new Date()): DueCheckIn[] {
  return profile.simulations
    .flatMap((simulation) =>
      WINDOWS.map(({ window, days }) => ({
        simulation,
        window,
        dueAt: new Date(new Date(simulation.completedAt).getTime() + days * 86_400_000).toISOString(),
      })),
    )
    .filter(({ simulation, window, dueAt }) => {
      const runId = simulation.runId ?? `legacy:${simulation.completedAt}`;
      return new Date(dueAt) <= now && !profile.outcomeCheckIns.some((item) => item.simulationRunId === runId && item.window === window);
    })
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}
