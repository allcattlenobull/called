/**
 * Next moves for someone who already works: careers they could move into from where they are,
 * weighing transferable skills, school still needed, pay where they live and their personal fit.
 * Every score is explained in plain words on the page.
 */
import { CAREERS } from '../data/careers';
import type { Career, Profile } from '../types';
import { matchCareer, type MatchResult } from './matching';
import { homePlace, localPay } from './places';
import { readiness, transferableSkills, type Readiness } from './readiness';

export interface NextMove {
  career: Career;
  match: MatchResult;
  ready?: Readiness;
  skills: ReturnType<typeof transferableSkills>;
  skillShare: number;
  pay: number;
  payLabel: string;
  /** Pay where they live minus what they earn now, when known. */
  payChange?: number;
  score: number;
}

export interface NextMoveOptions {
  /** Only careers that need no more school than they already have. */
  noMoreSchool?: boolean;
  /** Also allow up to about a year of training. */
  shortOk?: boolean;
  limit?: number;
}

export function nextMoves(p: Profile, opts: NextMoveOptions = {}): NextMove[] {
  const home = homePlace(p);
  const now = p.current?.pay;
  const out: NextMove[] = [];
  for (const c of CAREERS) {
    if (c.id === p.current?.careerId || p.careerStatus[c.id] === 'notForMe') continue;
    const ready = readiness(c, p);
    if (opts.noMoreSchool && ready && ready.years > (opts.shortOk ? 1 : 0)) continue;
    const skills = transferableSkills(c, p);
    const skillShare = c.skills.length ? skills.length / c.skills.length : 0;
    const local = localPay(c, home);
    const payChange = now ? local.pay - now : undefined;
    const match = matchCareer(c, p);
    const school = !ready ? 0.5 : ready.years === 0 ? 1 : ready.paid ? 0.7 : ready.years <= 1 ? 0.6 : Math.max(0.05, 0.4 - (ready.years - 2) * 0.1);
    const payScore = payChange === undefined ? 0.5 : Math.max(0, Math.min(1, 0.5 + payChange / 40000));
    const fit = match.overall === null ? 0.5 : match.overall / 100;
    const cur = p.current?.careerId ? CAREERS.find((x) => x.id === p.current!.careerId) : undefined;
    const related = cur && (cur.related.includes(c.id) || c.related.includes(cur.id)) ? 0.1 : 0;
    const score = 0.35 * skillShare + 0.25 * school + 0.2 * fit + 0.2 * payScore + related;
    out.push({ career: c, match, ready, skills, skillShare, pay: local.pay, payLabel: local.label, payChange, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, opts.limit ?? 12);
}
