export type SimulationCategory = 'Business' | 'People and service' | 'Technology' | 'Science and engineering' | 'Creative and media' | 'Operations and trades';

export interface SimulationEvidence {
  category: SimulationCategory;
  version: string;
  updatedAt: string;
  evidenceStatus: 'Exploration pilot';
  reviewStatus: 'SME review pending';
  constructs: string[];
  sources: { label: string; url: string }[];
}

const METHOD_SOURCES = [
  { label: 'O*NET occupational content model', url: 'https://www.onetcenter.org/content.html' },
  { label: 'SIOP personnel-assessment principles', url: 'https://www.apa.org/ed/accreditation/personnel-selection-procedures.pdf' },
  { label: 'Situational-judgment-test design review', url: 'https://doi.org/10.1111/j.1744-6570.2006.00065.x' },
];

const item = (category: SimulationCategory, constructs: string[]): SimulationEvidence => ({
  category,
  version: '1.0',
  updatedAt: '2026-10-15',
  evidenceStatus: 'Exploration pilot',
  reviewStatus: 'SME review pending',
  constructs,
  sources: METHOD_SOURCES,
});

/**
 * Public review ledger for every live simulation. “SME review pending” is deliberate:
 * these scenarios are useful for exploration, but no occupation-specific expert panel
 * has approved their content or scoring for employment decisions.
 */
export const SIMULATION_EVIDENCE: Record<string, SimulationEvidence> = {
  'financial-analyst': item('Business', ['quantitative interpretation', 'business reasoning', 'written recommendation']),
  'hr-manager': item('People and service', ['evidence gathering', 'fairness', 'interpersonal judgment']),
  teacher: item('People and service', ['instructional judgment', 'explanation', 'empathy']),
  software: item('Technology', ['debugging', 'logical reasoning', 'technical communication']),
  cybersecurity: item('Technology', ['threat recognition', 'incident prioritization', 'communication']),
  marketing: item('Creative and media', ['audience reasoning', 'campaign prioritization', 'persuasion']),
  'ux-research': item('Creative and media', ['research synthesis', 'prioritization', 'user empathy']),
  operations: item('Operations and trades', ['process analysis', 'bottleneck detection', 'coordination']),
  entrepreneur: item('Business', ['tradeoff reasoning', 'budgeting', 'customer focus']),
  healthcare: item('People and service', ['service recovery', 'escalation', 'clear handoff']),
  trades: item('Operations and trades', ['troubleshooting', 'service judgment', 'plain-language explanation']),
  journalist: item('Creative and media', ['source verification', 'evidence quality', 'accurate writing']),
  'clinic-handoff': item('People and service', ['observation', 'escalation', 'privacy']),
  'civil-engineering': item('Science and engineering', ['systems reasoning', 'measurement', 'tradeoff analysis']),
  paralegal: item('People and service', ['document organization', 'evidence handling', 'confidentiality']),
  'wildlife-survey': item('Science and engineering', ['sampling', 'field observation', 'uncertainty']),
  'event-planning': item('Operations and trades', ['prioritization', 'accessibility', 'team coordination']),
  'chef-service': item('Operations and trades', ['safety prioritization', 'workflow', 'team communication']),
  'architect-brief': item('Creative and media', ['design criteria', 'spatial reasoning', 'client tradeoffs']),
  'lab-investigation': item('Science and engineering', ['quality control', 'experimental reasoning', 'uncertainty']),
};

export const SIMULATION_CATEGORIES: SimulationCategory[] = ['Business', 'People and service', 'Technology', 'Science and engineering', 'Creative and media', 'Operations and trades'];
