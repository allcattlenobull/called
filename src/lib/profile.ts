import type { Profile, Settings } from '../types';

export const PROFILE_VERSION = 5 as const;

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
    location: undefined,
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
    outcomeCheckIns: [],
    experiments: [],
    roadmaps: [],
    comparisons: 0,
    interviews: 0,
    conversations: [],
    code: generateCode(),
    memberId: generateMemberId(),
    counselorShareId: uid('learner'),
    counselorShares: [],
    activeDays: [],
    seenBadges: [],
    seenLevel: 0,
    roiChecked: [],
    drafts: {},
  };
}

// Crockford-style alphabet without look-alike characters (no I, L, O, U, 0, 1).
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

/** A 16-character code (about 78 bits of randomness) shown as CALL-XXXX-XXXX-XXXX-XXXX. */
export function generateCode(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `CALL-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}-${chars.slice(12, 16)}`;
}

/** A public account ID with about 60 bits of randomness. It is an identifier, never a login secret. */
export function generateMemberId(): string {
  const bytes = new Uint8Array(12);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  const chars = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
  return `CLD-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

/** Accepts codes typed with spaces, lowercase or without the CALL prefix. Returns null if invalid. */
export function normalizeCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/^CALL/, '');
  const mapped = raw;
  if (mapped.length !== 16 || [...mapped].some((c) => !CODE_ALPHABET.includes(c))) return null;
  return `CALL-${mapped.slice(0, 4)}-${mapped.slice(4, 8)}-${mapped.slice(8, 12)}-${mapped.slice(12, 16)}`;
}

export const DEFAULT_SETTINGS: Settings = {
  faithLens: true,
  theme: 'system',
  textSize: 'standard',
  cloudBackup: true,
  researchParticipation: false,
  productAnalytics: false,
  readingMode: 'standard',
};

/** Fill any fields missing from an older or imported profile so the app never crashes on shape. */
export function normalizeProfile(input: unknown): Profile {
  const base = emptyProfile();
  if (!input || typeof input !== 'object') return base;
  const p = input as Partial<Profile>;
  const out: Profile = { ...base, ...p, version: PROFILE_VERSION } as Profile;
  // Guard every array and record so malformed imports degrade gracefully.
  const arrays: (keyof Profile)[] = ['gifts', 'serves', 'problems', 'experiences', 'feedback', 'journal', 'statements', 'careerViews', 'saved', 'compare', 'simulations', 'outcomeCheckIns', 'experiments', 'roadmaps', 'activeDays', 'seenBadges', 'roiChecked', 'conversations', 'counselorShares'];
  for (const k of arrays) if (!Array.isArray(out[k])) (out as unknown as Record<string, unknown>)[k] = [];
  const records: (keyof Profile)[] = ['interests', 'skills', 'aptitudes', 'workStyle', 'values', 'lifestyle', 'completed', 'principleNotes', 'careerStatus', 'reality', 'drafts'];
  for (const k of records) {
    const v = out[k];
    if (!v || typeof v !== 'object' || Array.isArray(v)) (out as unknown as Record<string, unknown>)[k] = {};
  }
  if (typeof out.comparisons !== 'number') out.comparisons = 0;
  if (typeof out.interviews !== 'number') out.interviews = 0;
  if (out.location !== undefined) {
    if (!out.location || typeof out.location !== 'object' || Array.isArray(out.location)) out.location = undefined;
    else {
      const location = out.location as Profile['location'];
      if (location && !Array.isArray(location.considering)) location.considering = [];
      if (location) location.considering = location.considering.slice(0, 3).filter((x): x is string => typeof x === 'string');
    }
  }
  if (out.current !== undefined) {
    const c = out.current as unknown;
    if (!c || typeof c !== 'object' || Array.isArray(c)) out.current = undefined;
    else {
      const cur = out.current!;
      const EDU = ['none', 'highSchool', 'certificate', 'associate', 'bachelor', 'master', 'doctoral'];
      if (cur.education !== undefined && !EDU.includes(cur.education)) cur.education = undefined;
      if (cur.pay !== undefined && !(Number.isFinite(cur.pay) && cur.pay >= 0)) cur.pay = undefined;
      if (cur.yearsInRole !== undefined && !(Number.isFinite(cur.yearsInRole) && cur.yearsInRole >= 0)) cur.yearsInRole = undefined;
      for (const k of ['careerId', 'jobTitle', 'field', 'credentials'] as const) if (cur[k] !== undefined && typeof cur[k] !== 'string') cur[k] = undefined;
    }
  }
  if (typeof out.seenLevel !== 'number') out.seenLevel = 0;
  // Older profiles get a code on first load; malformed codes are replaced.
  if (typeof out.code !== 'string' || !normalizeCode(out.code)) out.code = generateCode();
  if (typeof out.memberId !== 'string' || !/^CLD(?:-[2-9A-HJ-NP-TV-Z]{4}){3}$/.test(out.memberId)) out.memberId = generateMemberId();
  if (typeof out.counselorShareId !== 'string' || !/^learner_[a-z0-9-]{8,}$/i.test(out.counselorShareId)) out.counselorShareId = uid('learner');
  out.counselorShares = out.counselorShares.filter((share) => share && typeof share.counselorId === 'string' && typeof share.shareKey === 'string');
  if (typeof out.lastName !== 'string') out.lastName = undefined;
  if (typeof out.guestTermsAcceptedVersion !== 'string') out.guestTermsAcceptedVersion = undefined;
  if (typeof out.guestTermsAcceptedAt !== 'string' || Number.isNaN(Date.parse(out.guestTermsAcceptedAt))) out.guestTermsAcceptedAt = undefined;
  if (typeof out.accountTermsAcceptedVersion !== 'string') out.accountTermsAcceptedVersion = undefined;
  if (typeof out.accountTermsAcceptedAt !== 'string' || Number.isNaN(Date.parse(out.accountTermsAcceptedAt))) out.accountTermsAcceptedAt = undefined;
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
