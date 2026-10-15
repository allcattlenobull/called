import { CAREER_BY_ID } from '../data/careers';
import { SIM_BY_ID } from '../data/simulations';
import { INTERESTS, SKILLS, VALUES } from '../data/vocab';
import type { Profile } from '../types';
import { topInterests, topSkills } from './compass';
import { suggestions } from './matching';

export type AiExportGoal = 'next-step' | 'compare' | 'contradictions' | 'counselor';

const GOALS: Record<AiExportGoal, string> = {
  'next-step': 'Recommend the next small real-world experiment that would reduce the most uncertainty.',
  compare: 'Help me compare the paths I am actively testing without choosing for me.',
  contradictions: 'Look for contradictions, flattering assumptions, and evidence I may be ignoring.',
  counselor: 'Help me prepare focused questions for a counselor or trusted mentor.',
};

export function createPrivateEvidenceSummary(profile: Profile) {
  const topMatches = suggestions(profile, 5).map(({ career, match }) => ({
    career: career.title,
    calledDecisionSupportScore: match.overall,
    evidenceLevel: match.confidence,
    potentialConflicts: match.conflicts.slice(0, 2),
  }));
  const values = Object.entries(profile.values)
    .filter(([, tier]) => tier === 'essential' || tier === 'important')
    .map(([id, tier]) => `${VALUES[id as keyof typeof VALUES].label} (${tier})`);
  const paths = profile.roadmaps.map((path) => ({
    career: CAREER_BY_ID[path.careerId]?.title ?? path.goal,
    stage: path.stage ?? 'exploring',
    completedSteps: path.items.filter((item) => item.done).length,
    totalSteps: path.items.length,
    interestCheckIns: (path.gates ?? []).map((gate) => gate.answer),
  }));
  const simulations = profile.simulations.slice(-12).map((result) => ({
    simulation: SIM_BY_ID[result.simulationId]?.title ?? result.simulationId,
    enjoyment: `${result.enjoyment}/5`,
    wouldDoRegularly: result.regularly,
    selectedEnjoyedSignals: result.enjoyed,
    selectedFrustrationSignals: result.frustrated,
  }));

  return {
    generatedBy: 'Called',
    privacy: 'Names, location, member ID, journey code, journal, counselor records, and free-text responses are intentionally excluded.',
    caution: 'Called scores are explainable decision support, not validated predictions.',
    evidence: {
      strongestInterests: topInterests(profile, 4).map((id) => INTERESTS[id].label),
      selfRatedStrengths: topSkills(profile, 6).map((id) => SKILLS[id].label),
      importantValues: values,
      careerReactions: Object.entries(profile.careerStatus).map(([id, status]) => ({ career: CAREER_BY_ID[id]?.title ?? id, status })),
      realityChecks: Object.entries(profile.reality).map(([id, response]) => ({ career: CAREER_BY_ID[id]?.title ?? id, response })),
      topMatches,
      activePaths: paths,
      simulationReflections: simulations,
      realWorldEvidence: {
        experimentsCompleted: profile.experiments.filter((experiment) => experiment.status === 'done').length,
        professionalConversationsLogged: profile.conversations.length,
        comparisonsCompleted: profile.comparisons,
      },
    },
  };
}

export function createAiPrompt(profile: Profile, goal: AiExportGoal): string {
  const summary = createPrivateEvidenceSummary(profile);
  return `I am using Called to gather evidence about career paths. Use the privacy-reduced evidence below as context.

My goal: ${GOALS[goal]}

Rules for your response:
1. Do not choose a career for me or treat a score as a prediction.
2. Separate facts in my evidence from your inferences.
3. Point out missing evidence and plausible conflicts, including evidence against the leading option.
4. Prefer a small real-world action—conversation, observation, simulation, class, project, or job shadow—over another personality quiz.
5. If you state current salary, licensing, education, or labor-market facts, cite a current official source and say when it was updated.
6. Ask at most three focused follow-up questions.
7. Do not ask for my name, journey code, member ID, school, exact location, or other identifying information.
8. Your response is advice for reflection only and must not alter my Called scores.

CALLED EVIDENCE
${JSON.stringify(summary, null, 2)}`;
}
