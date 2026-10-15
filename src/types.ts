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

/** A published-instrument pilot result; not a normed score or career prediction. */
export interface ValidatedReasoningResult {
  instrument: 'OMIB-pilot';
  correct: number;
  total: number;
  completedAt: string;
}

export interface LifestylePrefs {
  /** 'none' means no more school than the person already has (see Profile.current.education). */
  trainingYears?: 'none' | 'short' | 'two' | 'four' | 'long';
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
  /** Distinguishes repeat attempts of the same simulation. */
  runId?: string;
  simulationId: string;
  completedAt: string;
  /** 1 to 5 */
  enjoyment: number;
  enjoyed: string[];
  frustrated: string[];
  regularly: 'yes' | 'maybe' | 'no';
  natural: string;
  /** Legacy field retained for imported journeys; unvalidated editorial scores are no longer used. */
  quality?: number;
  /** Version of the simulation content completed, for reproducible validation research. */
  instrumentVersion?: string;
  /** Optional immediate outcome measures. These do not affect career matching. */
  outcome?: {
    understanding: number;
    clarity: number;
    nextStep: 'explore' | 'compare' | 'talk' | 'pause';
    completedAt: string;
  };
}

export interface OutcomeCheckIn {
  id: string;
  simulationId: string;
  simulationRunId: string;
  window: '7d' | '30d' | '90d';
  clarity: number;
  confidence: number;
  action: 'researched' | 'talked' | 'tried' | 'applied' | 'paused' | 'none';
  completedAt: string;
}

export interface ExperimentLog {
  experimentId: string;
  status: 'planned' | 'done';
  startedAt: string;
  completedAt?: string;
  answers?: Record<string, number>;
  notes?: string;
}

/** Highest education someone has finished. */
export type CompletedEducation = 'none' | 'highSchool' | 'certificate' | 'associate' | 'bachelor' | 'master' | 'doctoral';

/** Where someone is now: used to credit what they already have, not to judge it. */
export interface CurrentSituation {
  /** The Called career closest to their current job, if any. */
  careerId?: string;
  /** Their own words for the job, e.g. "8th-grade science teacher". */
  jobTitle?: string;
  /** Yearly pay before taxes. */
  pay?: number;
  yearsInRole?: number;
  education?: CompletedEducation;
  /** Field of study for their highest degree or credential. */
  field?: string;
  /** Licenses and certifications they hold, e.g. "EMT-B, Firefighter II". */
  credentials?: string;
}

/** Optional place context. Stored locally; no coordinates or inferred location are kept. */
export interface ProfileLocation {
  city?: string;
  state?: string;
  zip?: string;
  /** The home state or metro area chosen on the Places page ('GA' or 'm12060'). */
  place?: string;
  /** Other places the person would realistically consider living or working. */
  considering: string[];
}

/** A conversation is evidence about a path, not a contact record or CRM entry. */
export interface ConversationEntry {
  id: string;
  careerId: string;
  name?: string;
  role: string;
  organization?: string;
  location?: string;
  date: string;
  notes: string;
}

/** Steps that check themselves off when the evidence exists elsewhere in Called. */
export type AutoCheck = 'sim' | 'interview' | 'reality' | 'experiment' | 'roi' | 'compare' | `assessment:${AssessmentId}`;

export interface RoadmapItem {
  id: string;
  text: string;
  horizon: 'now' | 'six' | 'twelve';
  done: boolean;
  auto?: AutoCheck;
  /** Link to where the step can be done in Called. */
  to?: string;
  /** Written by the user, so re-tailoring never removes it. */
  mine?: boolean;
}

export type GateAnswer = 'stronger' | 'same' | 'less' | 'ruleOut';

export interface DecisionGate {
  at: string;
  answer: GateAnswer;
  /** Evidence level when the user answered, for the interest-over-time line. */
  evidence: number;
  /** Roadmap steps done at that moment, so the next gate waits for new evidence. */
  doneCount?: number;
  note?: string;
}

/** A path the user is testing. Exploring is the default; leading is a deliberate later choice. */
export interface Roadmap {
  careerId: string;
  goal: string;
  createdAt: string;
  items: RoadmapItem[];
  stage?: 'exploring' | 'leading' | 'ruledOut';
  gates?: DecisionGate[];
  stageChangedAt?: string;
}

/* ---------- The whole stored profile ---------- */

export interface Profile {
  version: number;
  createdAt: string;
  updatedAt: string;
  onboarded: boolean;
  /** Versioned acknowledgement required before the guided guest journey begins. */
  guestTermsAcceptedVersion?: string;
  guestTermsAcceptedAt?: string;
  /** Versioned acknowledgement required before individual account features open. */
  accountTermsAcceptedVersion?: string;
  accountTermsAcceptedAt?: string;
  /** First name or preferred name. Kept as `name` for backwards-compatible journey files. */
  name?: string;
  lastName?: string;
  stage?: 'highSchool' | 'graduated' | 'college' | 'working' | 'other';
  location?: ProfileLocation;
  current?: CurrentSituation;

  interests: Record<string, LikeAnswer>;
  skills: Partial<Record<SkillId, SkillLevel>>;
  aptitudes: Partial<Record<AptitudeId, AptitudeResult>>;
  validatedReasoning?: ValidatedReasoningResult;
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
  outcomeCheckIns: OutcomeCheckIn[];
  experiments: ExperimentLog[];
  roadmaps: Roadmap[];
  comparisons: number;
  interviews: number;
  conversations: ConversationEntry[];

  /** Unique journey code, e.g. CALL-7KQ2-M9XD-4HPA-R2TW. Used to restore this journey. */
  code: string;
  /** Stable, share-safe account identifier. It cannot restore or unlock a journey. */
  memberId: string;
  /** Random pseudonymous key used only to update a student-approved counselor packet. */
  counselorShareId: string;
  /** Counselors this person deliberately shared a limited report with. */
  counselorShares: Array<{ counselorId: string; counselorName: string; sharedAt: string; updatedAt: string; shareKey: string }>;
  /** Dates (YYYY-MM-DD) the user did something, for gentle weekly streaks. */
  activeDays: string[];
  /** Badges and level the user has already been celebrated for. */
  seenBadges: string[];
  seenLevel: number;
  /** Careers whose education costs the user has checked in the ROI tool. */
  roiChecked: string[];
  /** Unfinished work saved so the user can come back and finish it. */
  drafts: Record<string, unknown>;
}

export interface Settings {
  faithLens: boolean;
  theme: 'system' | 'light' | 'dark';
  /** Keep an encrypted backup tied to the journey code (only when a sync service is configured). */
  cloudBackup: boolean;
  /** Explicit opt-in to send de-identified assessment events for validation research. */
  researchParticipation: boolean;
  /** Separate opt-in for minimal page and completion analytics. */
  productAnalytics: boolean;
  /** A roomier, simpler presentation for readers who want less density. */
  readingMode: 'standard' | 'plain';
}
