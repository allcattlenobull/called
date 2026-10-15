/**
 * How AI is changing each career. Exposure scores come from published research (see
 * scripts/build-ai-impact.mjs and docs/DATA.md); the guidance below is written by Called.
 * Exposure means AI tools could speed up a share of the job's tasks. It is not a prediction
 * that the job will disappear.
 */
import exposure from '../data/careers/overrides/ai-exposure.json';
import type { CareerFamily } from '../types';

export type AiBand = 'low' | 'moderate' | 'high';

const EXPOSURE = exposure as Record<string, number>;

export function aiExposure(careerId: string): number | undefined {
  return EXPOSURE[careerId];
}

/** Bands split the 900+ occupations in the study into roughly equal thirds. */
export function aiBand(score: number): AiBand {
  if (score < 0.2) return 'low';
  if (score < 0.4) return 'moderate';
  return 'high';
}

export function careerAiBand(careerId: string): AiBand | undefined {
  const s = aiExposure(careerId);
  return s === undefined ? undefined : aiBand(s);
}

export const AI_BANDS: Record<AiBand, { label: string; short: string; meaning: string }> = {
  low: {
    label: 'Low exposure to AI',
    short: 'Low',
    meaning: 'AI tools can speed up only a small part of this work, usually the paperwork. Most of it is physical, hands-on or in person.',
  },
  moderate: {
    label: 'Moderate exposure to AI',
    short: 'Moderate',
    meaning: 'AI is likely to change parts of this job, not replace it. People who use AI well for routine parts will have more time for the parts only people can do.',
  },
  high: {
    label: 'High exposure to AI',
    short: 'High',
    meaning: 'Expect this work to change noticeably. High exposure doesn’t mean the job disappears; it often means the same work gets done faster. Learning to work with AI, and to check it, matters more here.',
  },
};

/** What holds up in each kind of work, written by Called. */
export const AI_FAMILY_GUIDANCE: Record<CareerFamily, string> = {
  healthcare: 'Hands-on care, clinical judgment and earning a patient’s trust stay human. AI is most likely to help with charting, documentation and spotting patterns in data, so comfort with health technology is a plus.',
  technology: 'Tech is changing fastest. Routine code, tests and documentation are speeding up; designing systems, judging what is correct and secure, and understanding what people actually need matter more. Learn to use AI tools, and learn to check them.',
  business: 'Drafts, summaries, reports and first-pass analysis are speeding up. Relationships, persuasion, judgment and leading people are much harder to automate.',
  finance: 'Routine bookkeeping, reports and first-pass analysis are increasingly automated. Interpreting numbers, advising people, noticing what doesn’t add up and taking responsibility for decisions matter more.',
  education: 'AI can help prepare materials, give feedback and personalize practice. Knowing students, motivating them, running a room and building trust stay human, so relationship skills count even more.',
  trades: 'Most of this work is physical and on site, which AI language tools can’t do. AI may help with estimates, paperwork, diagnostics and code lookups. Skilled trades are among the work least exposed to AI tools.',
  government: 'Paperwork, records and routine communication are likely to speed up. Serving the public in person, applying rules fairly and handling exceptions remain human work.',
  creative: 'AI can now produce drafts, images and edits quickly, so creative work is changing noticeably. Taste, original ideas, a distinct voice and knowing what an audience needs set people apart. Treat AI tools as part of the craft.',
  humanServices: 'AI may help with records, scheduling and finding resources. The heart of the work, listening, building trust and walking with people through hard moments, stays human.',
  engineering: 'AI is speeding up calculations, documentation and design options. Engineering judgment, responsibility for safety, testing in the real world and working across teams stay human.',
  science: 'AI is accelerating literature reviews, data analysis and modeling. Asking good questions, designing experiments, fieldwork and judging what results mean stay human.',
  entrepreneurship: 'AI lowers the cost of starting something: marketing, websites and bookkeeping get easier. Spotting real needs, building relationships and taking risks stay human.',
  operations: 'Scheduling, tracking and routing are increasingly automated, and some physical work uses more robotics over time. Coordinating people, solving problems on the floor and handling the unexpected stay valuable.',
  legal: 'Legal research, document review and first drafts are speeding up noticeably. Judgment, advocacy, ethics and counseling clients stay human, and checking accuracy matters more than ever.',
  publicSafety: 'Most of this work happens in person and under pressure, which AI tools can’t do. AI may help with reports, dispatch and analysis. Presence, judgment and calm in a crisis stay human.',
};

export const AI_SOURCE = {
  short: 'Eloundou, Manning, Mishkin & Rock, “GPTs are GPTs,” Science (2024)',
  url: 'https://www.science.org/doi/10.1126/science.adj0998',
  data: 'https://github.com/openai/GPTs-are-GPTs',
};
