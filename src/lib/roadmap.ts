import type { Career, Roadmap, RoadmapItem } from '../types';
import { uid } from './profile';

/** Builds a starter roadmap. Careers can define their own steps; otherwise steps come from the training route. */
export function generateRoadmap(c: Career): Roadmap {
  const steps = c.path ?? genericSteps(c);
  const items: RoadmapItem[] = [
    ...steps.now.map((text) => ({ id: uid('step'), text, horizon: 'now' as const, done: false })),
    ...steps.six.map((text) => ({ id: uid('step'), text, horizon: 'six' as const, done: false })),
    ...steps.twelve.map((text) => ({ id: uid('step'), text, horizon: 'twelve' as const, done: false })),
  ];
  return { careerId: c.id, goal: c.title, createdAt: new Date().toISOString(), items };
}

function genericSteps(c: Career) {
  const now = [
    c.simulationId ? `Complete the ${c.title.toLowerCase()}-related simulation` : 'Read the reality check for this career',
    `Interview someone who works as a ${c.title.toLowerCase()}`,
    'Write down what excites you and what worries you about this path',
  ];
  const level = c.education.level;
  let six: string[];
  let twelve: string[];
  if (level === 'apprenticeship') {
    six = ['Find apprenticeship programs near you on Apprenticeship.gov', 'Take any related shop, math or technical class', 'Do a supervised hands-on project'];
    twelve = ['Apply to a pre-apprenticeship or apprenticeship', 'Get a driver’s license and reliable transportation', 'Compare trade school and direct apprenticeship'];
  } else if (level === 'certificate' || level === 'none') {
    six = ['Look up local certificate programs and compare costs', 'Volunteer or find part-time work near this field', 'Ask an employer what they look for in new hires'];
    twelve = ['Enroll in a training program or apply for an entry-level role', 'Earn your first credential', 'Reassess: is this still a fit after real experience?'];
  } else if (level === 'associate') {
    six = ['Compare community college programs and their prerequisites', 'Take a related class or dual-enrollment course', 'Shadow someone for a day'];
    twelve = ['Apply to programs (some have waitlists)', 'Look into financial aid and employer tuition help', 'Reassess with what you’ve learned'];
  } else {
    six = [
      `Take a course related to ${(c.education.majors?.[0] ?? 'this field').toLowerCase()}`,
      'Find a club, competition or volunteer role connected to this work',
      'Compare at least three schools using College Scorecard',
    ];
    twelve = [
      'Look for an internship, job shadow or summer program',
      'Estimate total cost and debt with the Education ROI tool',
      level === 'master' || level === 'doctoral' ? 'Learn the graduate-school requirements early, including experience hours' : 'Compare a four-year start with a community college transfer',
    ];
  }
  return { now, six, twelve };
}

export const HORIZONS = [
  { id: 'now', label: 'Now' },
  { id: 'six', label: 'Next 6 months' },
  { id: 'twelve', label: 'Next 12 months' },
] as const;
