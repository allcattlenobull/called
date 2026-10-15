// Core domain types for Called. Everything the app stores or scores is described here.

/* ---------- Shared vocabularies ---------- */

/** Holland-style interest families, renamed in plain language. */
export type InterestId = 'build' | 'investigate' | 'create' | 'help' | 'lead' | 'organize';

export type SkillId =
  | 'communication'
  | 'writing'
  | 'math'
  | 'analysis'
  | 'technology'
  | 'handsOn'
  | 'creativity'
  | 'leadership'
  | 'organization'
  | 'teaching'
  | 'empathy'
  | 'persuasion'
  | 'research'
  | 'problemSolving';

export type AptitudeId = 'numerical' | 'verbal' | 'spatial' | 'detail' | 'logical';

/** Work style axes. Negative values lean to the left pole, positive to the right. */
export type WorkAxis = 'social' | 'structure' | 'variety' | 'visibility' | 'handsIdeas' | 'pace';

export type ValueId =
  | 'income'
  | 'stability'
  | 'flexibility'
  | 'familyTime'
  | 'creativity'
  | 'leadership'
  | 'helping'
  | 'independence'
  | 'recognition'
  | 'meaningful'
  | 'entrepreneurship'
  | 'travel'
  | 'community'
  | 'predictability';

export type ValueTier = 'essential' | 'important' | 'somewhat' | 'notPriority';

export type GiftId =
  | 'teaching'
  | 'encouraging'
  | 'leading'
  | 'organizing'
  | 'serving'
  | 'mercy'
  | 'giving'
  | 'hospitality'
  | 'craftsmanship'
  | 'creating'
  | 'discernment'
  | 'communicating'
  | 'problemSolving'
  | 'courage';

export type ServeId =
  | 'children'
  | 'teens'
  | 'patients'
  | 'families'
  | 'elderly'
  | 'communities'
  | 'smallBusinesses'
  | 'organizations'
  | 'crisis'
  | 'vulnerable'
  | 'customers'
  | 'futureGenerations'
  | 'church'
  | 'animals';

export type ProblemId =
  | 'health'
  | 'mentalHealth'
  | 'education'
  | 'poverty'
  | 'justice'
  | 'environment'
  | 'technology'
  | 'infrastructure'
  | 'safety'
  | 'family'
  | 'finance'
  | 'culture'
  | 'food'
  | 'housing'
  | 'faith';

export type CareerFamily =
  | 'healthcare'
  | 'technology'
  | 'business'
  | 'finance'
  | 'education'
  | 'trades'
  | 'government'
  | 'creative'
  | 'humanServices'
  | 'engineering'
  | 'science'
  | 'entrepreneurship'
  | 'operations'
  | 'legal'
  | 'publicSafety';

export type EducationLevel =
  | 'none'
  | 'certificate'
  | 'apprenticeship'
  | 'associate'
  | 'bachelor'
  | 'master'
  | 'doctoral';

export type RouteId =
  | 'college'
  | 'communityCollege'
  | 'certification'
  | 'tradeSchool'
  | 'apprenticeship'
  | 'military'
  | 'entrepreneurship'
  | 'directToWork'
  | 'graduate';

export type Outlook = 'declining' | 'littleChange' | 'average' | 'faster' | 'muchFaster';
export type Schedule = 'regular' | 'shifts' | 'irregular' | 'seasonal';
export type Remote = 'none' | 'some' | 'common';
export type Level = 1 | 2 | 3;

/* ---------- Careers ---------- */

export interface CareerPay {
  /** Annual median, USD. */
  median: number;
  /** Roughly the 10th percentile, USD. */
  low: number;
  /** Roughly the 90th percentile, USD. */
  high: number;
  note?: string;
}

export interface CareerEducation {
  level: EducationLevel;
  /** Typical years of education or training after high school. */
  years: number;
  routes: RouteId[];
  summary: string;
  majors?: string[];
  credentials?: string[];
}

export interface Career {
  id: string;
  title: string;
  family: CareerFamily;
  summary: string;
  /** Standard Occupational Classification code, for linking to O*NET and BLS. */
  soc?: string;
  /** Interest weights 0 to 3. */
  interests: Partial<Record<InterestId, number>>;
  skills: SkillId[];
  aptitudes: AptitudeId[];
  values: { supports: ValueId[]; strains: ValueId[] };
  workStyle: Partial<Record<WorkAxis, number>>;
  gifts: GiftId[];
  serves: ServeId[];
  problems: ProblemId[];
  education: CareerEducation;
  pay: CareerPay;
  outlook: Outlook;
  environment: string;
  schedule: Schedule;
  remote: Remote;
  physical: Level;
  travel: Level;
  stress: Level;
  entrepreneurial: Level;
  /** -2 mostly data, things or ideas; +2 mostly people. */
  peopleData: number;
  responsibilities: string[];
  dayInLife: string[];
  imagine: string[];
  reality: string[];
  frustrations: string[];
  emotionalDemands: string;
  related: string[];
  alternativeRoutes: string[];
  simulationId?: string;
  experimentIds?: string[];
  path?: { now: string[]; six: string[]; twelve: string[] };
}

/* ---------- Assessments ---------- */

export type AssessmentId = 'interests' | 'skills' | 'aptitudes' | 'workStyle' | 'values' | 'lifestyle';

export type LikeAnswer = -1 | 0 | 1;

export type SkillLevel = 0 | 1 | 2 | 3;

export interface AptitudeResult {
  correct: number;
  total: number;
}

export interface LifestylePrefs {
  trainingYears?: 'short' | 'two' | 'four' | 'long';
  debt?: 'avoid' | 'small' | 'moderate' | 'comfortable';
  income?: 'modest' | 'comfortable' | 'high' | 'veryHigh' | 'notFactor';
  schedule?: 'regular' | 'flexible' | 'shiftsOk' | 'noPref';
  remote?: 'inPerson' | 'hybrid' | 'remote' | 'noPref';
  geography?: 'stayClose' | 'relocate' | 'anywhere';
  physical?: 'desk' | 'some' | 'active' | 'noPref';
  travel?: 'rarely' | 'sometimes' | 'often';
  balance?: 'high' | 'moderate' | 'hustle';
  entrepreneurship?: 'no' | 'maybe' | 'yes';
  uncertainty?: 'low' | 'medium' | 'high';
}

/* ---------- Purpose ---------- */

export interface JournalEntry {
  id: string;
  createdAt: string;
  prompt?: string;
  body: string;
  faith?: boolean;
}

export interface ExperienceEntry {
  id: string;
  createdAt: string;
  title: string;
  kind: 'job' | 'volunteer' | 'school' | 'project' | 'church' | 'hobby' | 'other';
  /** 1 to 5 */
  enjoyment: number;
  /** -1 drained, 0 neutral, 1 energized */
  energy: -1 | 0 | 1;
  notes?: string;
  interests: InterestId[];
}

export interface FeedbackEntry {
  id: string;
  createdAt: string;
  from: string;
  said: string;
  gifts: GiftId[];
}

export interface PurposeStatement {
  id: string;
  createdAt: string;
  text: string;
}

/* ---------- Experience: simulations, experiments, career reactions ---------- */

export type RealityResponse = 'definitely' | 'maybe' | 'unsure' | 'probablyNot';
export type CareerStatus = 'curious' | 'exploring' | 'strong' | 'notForMe';

export interface SimulationResult {
  simulationId: string;
  completedAt: string;
  /** 1 to 5 */
  enjoyment: number;
  enjoyed: string[];
  frustrated: string[];
  regularly: 'yes' | 'maybe' | 'no';
  natural: string;
  /** Share of steps where the response matched the strongest professional approach. */
  quality: number;
}

export interface ExperimentLog {
  experimentId: string;
  status: 'planned' | 'done';
  startedAt: string;
  completedAt?: string;
  answers?: Record<string, number>;
  notes?: string;
}

export interface RoadmapItem {
  id: string;
  text: string;
  horizon: 'now' | 'six' | 'twelve';
  done: boolean;
}

export interface Roadmap {
  careerId: string;
  goal: string;
  createdAt: string;
  items: RoadmapItem[];
}

/* ---------- The whole stored profile ---------- */

export interface Profile {
  version: 1;
  createdAt: string;
  updatedAt: string;
  onboarded: boolean;
  name?: string;
  stage?: 'highSchool' | 'graduated' | 'college' | 'working' | 'other';

  interests: Record<string, LikeAnswer>;
  skills: Partial<Record<SkillId, SkillLevel>>;
  aptitudes: Partial<Record<AptitudeId, AptitudeResult>>;
  workStyle: Partial<Record<WorkAxis, number>>;
  values: Partial<Record<ValueId, ValueTier>>;
  lifestyle: LifestylePrefs;
  completed: Partial<Record<AssessmentId, string>>;

  gifts: GiftId[];
  serves: ServeId[];
  problems: ProblemId[];
  experiences: ExperienceEntry[];
  feedback: FeedbackEntry[];
  journal: JournalEntry[];
  statements: PurposeStatement[];
  principleNotes: Record<string, string>;

  careerViews: string[];
  careerStatus: Record<string, CareerStatus>;
  saved: string[];
  compare: string[];
  reality: Record<string, RealityResponse>;
  simulations: SimulationResult[];
  experiments: ExperimentLog[];
  roadmaps: Roadmap[];
  comparisons: number;
  interviews: number;

  /** Unique journey code, e.g. CALL-7KQ2-M9XD-4HPA-R2TW. Used to restore this journey. */
  code: string;
  /** Dates (YYYY-MM-DD) the user did something, for gentle weekly streaks. */
  activeDays: string[];
  /** Badges and level the user has already been celebrated for. */
  seenBadges: string[];
  seenLevel: number;
  /** Unfinished work saved so the user can come back and finish it. */
  drafts: Record<string, unknown>;
}

export interface Settings {
  faithLens: boolean;
  theme: 'system' | 'light' | 'dark';
  /** Keep an encrypted backup tied to the journey code (only when a sync service is configured). */
  cloudBackup: boolean;
}
