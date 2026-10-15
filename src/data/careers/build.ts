// A compact way to write careers. Every field still ends up as a full, typed `Career`.
import type {
  AptitudeId,
  Career,
  CareerFamily,
  EducationLevel,
  GiftId,
  InterestId,
  Level,
  Outlook,
  ProblemId,
  Remote,
  RouteId,
  Schedule,
  ServeId,
  SkillId,
  ValueId,
  WorkAxis,
} from '../../types';

export interface CompactCareer {
  id: string;
  title: string;
  family: CareerFamily;
  soc?: string;
  summary: string;
  /** Interest weights, e.g. "help3 investigate2 organize1". */
  int: string;
  skills: SkillId[];
  apt: AptitudeId[];
  plus: ValueId[];
  minus?: ValueId[];
  ws?: Partial<Record<WorkAxis, number>>;
  gifts: GiftId[];
  serves: ServeId[];
  problems: ProblemId[];
  /** level, years after high school, routes, summary, majors?, credentials? */
  edu: [EducationLevel, number, RouteId[], string, string[]?, string[]?];
  /** median, ~10th percentile, ~90th percentile, note? */
  pay: [number, number, number, string?];
  outlook: Outlook;
  env: string;
  sched: Schedule;
  remote: Remote;
  /** physical, travel, stress, entrepreneurial (1 low to 3 high) */
  levels: [Level, Level, Level, Level];
  /** -2 mostly data/things, +2 mostly people */
  pd: number;
  does: string[];
  day: string[];
  imagine: string[];
  reality: string[];
  frustrations: string[];
  emo: string;
  related: string[];
  alt: string[];
  sim?: string;
  exps?: string[];
}

function parseInterests(s: string): Partial<Record<InterestId, number>> {
  const out: Partial<Record<InterestId, number>> = {};
  for (const tok of s.trim().split(/\s+/)) {
    const m = tok.match(/^([a-z]+)(\d)$/);
    if (m) out[m[1] as InterestId] = Number(m[2]);
  }
  return out;
}

export function define(c: CompactCareer): Career {
  const [level, years, routes, summary, majors, credentials] = c.edu;
  const [median, low, high, note] = c.pay;
  const [physical, travel, stress, entrepreneurial] = c.levels;
  return {
    id: c.id,
    title: c.title,
    family: c.family,
    soc: c.soc,
    summary: c.summary,
    interests: parseInterests(c.int),
    skills: c.skills,
    aptitudes: c.apt,
    values: { supports: c.plus, strains: c.minus ?? [] },
    workStyle: c.ws ?? {},
    gifts: c.gifts,
    serves: c.serves,
    problems: c.problems,
    education: { level, years, routes, summary, majors, credentials },
    pay: { median, low, high, note },
    outlook: c.outlook,
    environment: c.env,
    schedule: c.sched,
    remote: c.remote,
    physical,
    travel,
    stress,
    entrepreneurial,
    peopleData: c.pd,
    responsibilities: c.does,
    dayInLife: c.day,
    imagine: c.imagine,
    reality: c.reality,
    frustrations: c.frustrations,
    emotionalDemands: c.emo,
    related: c.related,
    alternativeRoutes: c.alt,
    simulationId: c.sim,
    experimentIds: c.exps,
  };
}
