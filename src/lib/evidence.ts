/**
 * The real game in Called: gathering evidence about yourself.
 *
 * Four kinds of evidence, each built from things the user has actually done. Points and
 * levels sit underneath as the motivational layer; this is what the user should see first.
 */
import { CAREER_BY_ID } from '../data/careers';
import { ASSESSMENTS } from '../data/assessments';
import type { Profile } from '../types';
import { pathEvidence } from './path';

export type EvidenceId = 'self' | 'exposure' | 'real' | 'decision';

export interface EvidencePart {
  id: string;
  label: string;
  have: number;
  need: number;
  weight: number;
  next: string;
  to: string;
}

export interface EvidenceCategory {
  id: EvidenceId;
  label: string;
  blurb: string;
  score: number; // 0..1
  band: string;
  parts: EvidencePart[];
  next?: EvidencePart;
}

export const EVIDENCE_META: Record<EvidenceId, { label: string; blurb: string }> = {
  self: { label: 'Self-understanding', blurb: 'Your interests, strengths, values and gifts.' },
  exposure: { label: 'Career exposure', blurb: 'What you’ve seen of what work is really like.' },
  real: { label: 'Real-world experience', blurb: 'What you’ve learned by doing, not imagining.' },
  decision: { label: 'Decision readiness', blurb: 'How ready you are for your next wise decision.' },
};

const part = (id: string, label: string, have: number, need: number, weight: number, next: string, to: string): EvidencePart => ({ id, label, have: Math.min(have, need), need, weight, next, to });

export function band(score: number): string {
  if (score >= 0.75) return 'Strong';
  if (score >= 0.5) return 'Solid';
  if (score >= 0.2) return 'Building';
  return score > 0 ? 'Just starting' : 'Not started';
}

function category(id: EvidenceId, parts: EvidencePart[]): EvidenceCategory {
  const total = parts.reduce((s, x) => s + x.weight, 0);
  const score = parts.reduce((s, x) => s + x.weight * (x.have / x.need), 0) / total;
  // The next step is the missing piece worth the most evidence.
  const next = [...parts].filter((x) => x.have < x.need).sort((a, b) => b.weight * (1 - b.have / b.need) - a.weight * (1 - a.have / a.need))[0];
  return { id, ...EVIDENCE_META[id], score, band: band(score), parts, next };
}

export function evidenceProfile(p: Profile): EvidenceCategory[] {
  const sims = new Set(p.simulations.map((s) => s.simulationId)).size;
  const interviewed = p.conversations.length > 0 || p.interviews > 0 || p.experiments.some((e) => e.experimentId === 'interview-pro' && e.status === 'done');
  const experiments = p.experiments.filter((e) => e.status === 'done' && e.experimentId !== 'interview-pro').length;
  const paths = p.roadmaps.filter((r) => CAREER_BY_ID[r.careerId]);
  const bestPath = paths.reduce((best, r) => Math.max(best, pathEvidence(CAREER_BY_ID[r.careerId], p).score), 0);
  const gates = p.roadmaps.reduce((n, r) => n + (r.gates?.length ?? 0), 0);
  const ruledOut = Object.values(p.careerStatus).filter((s) => s === 'notForMe').length;

  return [
    category('self', [
      part('assess', 'Discover assessments', Object.keys(p.completed).length, ASSESSMENTS.length, 4, 'Finish another Discover assessment', '/discover'),
      part('gifts', 'Gifts named', p.gifts.length, 3, 1, 'Name the gifts you bring', '/purpose/gifts'),
      part('care', 'Who and what you care about', (p.serves.length ? 1 : 0) + (p.problems.length ? 1 : 0), 2, 1, 'Choose who you want to help and what you care about', p.serves.length ? '/purpose/care' : '/purpose/serve'),
      part('feedback', 'What others see in you', p.feedback.length, 3, 1.5, 'Ask someone what they see in you', '/purpose/feedback'),
      part('journal', 'Reflections', p.journal.length, 5, 1, 'Write a short reflection', '/purpose/journal'),
    ]),
    category('exposure', [
      part('views', 'Careers explored', new Set(p.careerViews).size, 20, 1, 'Explore a few careers you hadn’t considered', '/careers'),
      part('reality', 'Reality checks', Object.keys(p.reality).length, 6, 2, 'Read a career’s reality check', '/careers'),
      part('sims', 'Simulations tried', sims, 4, 3, 'Try a career simulation', '/try'),
      part('compare', 'Careers compared', p.comparisons, 1, 1, 'Compare two careers side by side', '/compare'),
    ]),
    category('real', [
      part('interview', 'Talked with a professional', interviewed ? 1 : 0, 1, 3, 'Talk with someone who does work you’re curious about', '/network'),
      part('experiments', 'Real-world experiments', experiments, 3, 3, 'Try a real-world experiment', '/try/experiments'),
      part('experiences', 'Experiences reflected on', p.experiences.length, 3, 2, 'Log something you’ve actually done and how it felt', '/purpose/experiences'),
    ]),
    category('decision', [
      part('paths', 'Paths being tested', paths.length, 2, 1, 'Start exploring a path', '/path'),
      part('evidence', 'Evidence on your strongest path', Math.round(bestPath * 100), 100, 3, 'Gather more evidence on a path you’re testing', '/path'),
      part('gates', 'Check-ins on your interest', gates, 2, 2, 'Check in on how your interest has changed', '/path'),
      part('ruledOut', 'Careers ruled out', ruledOut, 1, 1, 'Rule out a career that doesn’t fit', '/careers'),
      part('roi', 'Training costs checked', p.roiChecked.length, 1, 1, 'Check whether the training is worth it', '/compare/education'),
    ]),
  ];
}

/** The category with the most room to grow, and its next step. */
export function biggestGap(cats: EvidenceCategory[]): EvidenceCategory | undefined {
  return [...cats].filter((c) => c.next).sort((a, b) => a.score - b.score)[0];
}
