import { CAREER_BY_ID } from '../data/careers';
import { SIM_BY_ID } from '../data/simulations';
import { GIFTS, INTERESTS, SKILLS, VALUES } from '../data/vocab';
import type { Profile } from '../types';
import { topInterests, topSkills, topValues } from './compass';
import { suggestions } from './matching';
import { progressCounts } from './next';
import { nextBestAction, pathEvidence } from './path';
import { giftSignals } from './signals';

export interface CounselorPacket {
  app: 'called';
  kind: 'counselor-report';
  version: 1;
  studentId: string;
  displayName?: string;
  generatedAt: string;
  journeyUpdatedAt: string;
  summary: {
    assessments: number;
    careersExplored: number;
    simulations: number;
    experiments: number;
    saved: number;
  };
  interests: string[];
  strengths: string[];
  values: string[];
  topCareers: Array<{ id: string; title: string; score: number; confidence: string; watch?: string }>;
  simulations: Array<{ title: string; enjoyment: number; regularly: string }>;
  paths: Array<{ id: string; title: string; stage: string; evidence: string; nextStep?: string }>;
}

export function createCounselorPacket(profile: Profile, includeName: boolean): CounselorPacket {
  const counts = progressCounts(profile);
  return {
    app: 'called',
    kind: 'counselor-report',
    version: 1,
    studentId: profile.counselorShareId,
    displayName: includeName && profile.name ? profile.name : undefined,
    generatedAt: new Date().toISOString(),
    journeyUpdatedAt: profile.updatedAt,
    summary: {
      assessments: counts.assessments,
      careersExplored: counts.careersExplored,
      simulations: counts.simulations,
      experiments: counts.experiments,
      saved: counts.saved,
    },
    interests: topInterests(profile, 3).map((id) => INTERESTS[id].label),
    strengths: [...topSkills(profile, 5).map((id) => SKILLS[id].label), ...giftSignals(profile).all.slice(0, 4).map((id) => GIFTS[id].label)],
    values: topValues(profile, 5).map((id) => VALUES[id].label),
    topCareers: suggestions(profile, 5).flatMap(({ career, match }) => match.overall === null ? [] : [{ id: career.id, title: career.title, score: match.overall, confidence: match.confidence, watch: match.conflicts[0]?.text }]),
    simulations: profile.simulations.slice(-8).map((result) => ({ title: SIM_BY_ID[result.simulationId]?.title ?? result.simulationId, enjoyment: result.enjoyment, regularly: result.regularly })),
    paths: profile.roadmaps.flatMap((roadmap) => {
      const career = CAREER_BY_ID[roadmap.careerId];
      if (!career) return [];
      const evidence = pathEvidence(career, profile);
      return [{ id: career.id, title: career.title, stage: roadmap.stage ?? 'exploring', evidence: evidence.level, nextStep: roadmap.stage === 'ruledOut' ? undefined : nextBestAction(career, profile, roadmap, evidence).title }];
    }),
  };
}

export function counselorPacketFile(packet: CounselorPacket): File {
  const name = (packet.displayName ?? 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'student';
  return new File([JSON.stringify(packet, null, 2)], `called-counselor-${name}-${packet.generatedAt.slice(0, 10)}.json`, { type: 'application/json' });
}

export function parseCounselorPacket(value: string): CounselorPacket {
  const packet = JSON.parse(value) as Partial<CounselorPacket>;
  if (packet.app !== 'called' || packet.kind !== 'counselor-report' || packet.version !== 1 || typeof packet.studentId !== 'string' || !packet.summary || !Array.isArray(packet.topCareers) || !Array.isArray(packet.paths)) {
    throw new Error('This is not a valid Called counselor packet.');
  }
  return packet as CounselorPacket;
}
