import type { Profile, Settings } from '../types';

export const PROFILE_VERSION = 1 as const;

export function emptyProfile(): Profile {
  const now = new Date().toISOString();
  return {
    version: PROFILE_VERSION,
    createdAt: now,
    updatedAt: now,
    onboarded: false,
    interests: {},
    skills: {},
    aptitudes: {},
    workStyle: {},
    values: {},
    lifestyle: {},
    completed: {},
    gifts: [],
    serves: [],
    problems: [],
    experiences: [],
    feedback: [],
    journal: [],
    statements: [],
    principleNotes: {},
    careerViews: [],
    careerStatus: {},
    saved: [],
    compare: [],
    reality: {},
    simulations: [],
    experiments: [],
    roadmaps: [],
    comparisons: 0,
    interviews: 0,
  };
}

export const DEFAULT_SETTINGS: Settings = { faithLens: true, theme: 'system' };

/** Fill any fields missing from an older or imported profile so the app never crashes on shape. */
export function normalizeProfile(input: unknown): Profile {
  const base = emptyProfile();
  if (!input || typeof input !== 'object') return base;
  const p = input as Partial<Profile>;
  const out: Profile = { ...base, ...p, version: PROFILE_VERSION } as Profile;
  // Guard every array and record so malformed imports degrade gracefully.
  const arrays: (keyof Profile)[] = ['gifts', 'serves', 'problems', 'experiences', 'feedback', 'journal', 'statements', 'careerViews', 'saved', 'compare', 'simulations', 'experiments', 'roadmaps'];
  for (const k of arrays) if (!Array.isArray(out[k])) (out as unknown as Record<string, unknown>)[k] = [];
  const records: (keyof Profile)[] = ['interests', 'skills', 'aptitudes', 'workStyle', 'values', 'lifestyle', 'completed', 'principleNotes', 'careerStatus', 'reality'];
  for (const k of records) {
    const v = out[k];
    if (!v || typeof v !== 'object' || Array.isArray(v)) (out as unknown as Record<string, unknown>)[k] = {};
  }
  if (typeof out.comparisons !== 'number') out.comparisons = 0;
  if (typeof out.interviews !== 'number') out.interviews = 0;
  return out;
}

export function uid(prefix = 'id'): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export function hasStarted(p: Profile): boolean {
  return (
    p.onboarded ||
    Object.keys(p.completed).length > 0 ||
    p.saved.length > 0 ||
    p.simulations.length > 0 ||
    p.journal.length > 0
  );
}
