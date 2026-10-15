/**
 * Credit for where someone already is: the education they've finished, the job they do now and
 * the skills they bring. Used by matching, career pages, the explorer filter, Next moves and the
 * training cost tool. Rules are transparent and deliberately conservative.
 */
import { SKILLS } from '../data/vocab';
import { CAREER_BY_ID } from '../data/careers';
import type { Career, CompletedEducation, EducationLevel, Profile, SkillId } from '../types';

export const COMPLETED_EDUCATION: { value: CompletedEducation; label: string }[] = [
  { value: 'none', label: 'Still in high school, or no diploma yet' },
  { value: 'highSchool', label: 'High school diploma or GED' },
  { value: 'certificate', label: 'Certificate, license or trade credential' },
  { value: 'associate', label: 'Associate degree' },
  { value: 'bachelor', label: 'Bachelor’s degree' },
  { value: 'master', label: 'Master’s degree' },
  { value: 'doctoral', label: 'Doctoral or professional degree' },
];

/** Comparable to EDUCATION_LEVELS order: none 0, certificate 1, associate 3, bachelor 4, master 5, doctoral 6. */
const HELD_ORDER: Record<CompletedEducation, number> = { none: -1, highSchool: 0, certificate: 1, associate: 3, bachelor: 4, master: 5, doctoral: 6 };
/** Years of school after high school that a finished credential represents. */
const HELD_YEARS: Record<CompletedEducation, number> = { none: 0, highSchool: 0, certificate: 0, associate: 2, bachelor: 4, master: 6, doctoral: 8 };
const LEVEL_ORDER: Record<EducationLevel, number> = { none: 0, certificate: 1, apprenticeship: 2, associate: 3, bachelor: 4, master: 5, doctoral: 6 };
const DEGREE: EducationLevel[] = ['associate', 'bachelor', 'master', 'doctoral'];
/** Work where the degree must be in a specific field (licensing, accreditation or prerequisites). */
const FIELD_SPECIFIC_FAMILIES = new Set(['healthcare', 'engineering', 'science']);
const FIELD_SPECIFIC_IDS = new Set(['accountant', 'actuary', 'architect', 'air-traffic-controller', 'lawyer', 'pharmacist', 'veterinarian', 'landscape-architect', 'urban-planner', 'librarian']);
export const fieldSpecific = (c: Career) => FIELD_SPECIFIC_FAMILIES.has(c.family) || FIELD_SPECIFIC_IDS.has(c.id);

export interface Readiness {
  /** Approximate years of additional school or training needed. */
  years: number;
  kind: 'ready' | 'short' | 'more';
  /** One plain sentence, e.g. "No more school: your bachelor’s degree meets the usual requirement." */
  summary: string;
  /** Extra caution, e.g. when a degree in a specific field is usually expected. */
  note?: string;
  /** Training is usually paid (apprenticeship). */
  paid: boolean;
}

const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3));

/** Does a field of study plausibly line up with the majors a career lists? */
export function fieldMatches(field: string | undefined, majors: string[] | undefined): boolean {
  if (!field || !majors?.length) return true;
  const f = words(field);
  return majors.some((m) => [...words(m)].some((w) => f.has(w) || [...f].some((x) => x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5)))));
}

/** How much more school or training a career would take from where this person is. Undefined when education is unknown. */
export function readiness(c: Career, p: Profile): Readiness | undefined {
  const cur = p.current;
  const paid = c.education.level === 'apprenticeship';
  if (cur?.careerId === c.id) return { years: 0, kind: 'ready', paid, summary: 'You already do this work.' };
  const edu = cur?.education;
  if (!edu) return undefined;
  const level = c.education.level;
  const label = { none: 'no diploma yet', highSchool: 'high school diploma', certificate: 'certificate', associate: 'associate degree', bachelor: 'bachelor’s degree', master: 'master’s degree', doctoral: 'doctoral degree' }[edu];

  if (level === 'none') {
    return edu === 'none'
      ? { years: 0, kind: 'ready', paid, summary: 'No degree needed; many employers want a high school diploma or GED.' }
      : { years: 0, kind: 'ready', paid, summary: 'No more school needed to start.' };
  }

  if (DEGREE.includes(level)) {
    // In licensed or accredited fields, a degree in another subject doesn't meet the requirement.
    const strict = fieldSpecific(c);
    // With no majors listed, the career's own title stands in (e.g. “dental hygiene” for a dental hygienist).
    const fieldOk = !!cur?.field && fieldMatches(cur.field, c.education.majors?.length ? c.education.majors : [c.title]);
    const graduate = level === 'master' || level === 'doctoral';
    if (strict && !fieldOk && graduate && HELD_YEARS[edu] >= 4) {
      // Graduate programs in these fields accept any bachelor’s; the program itself is the field-specific part.
      const years = Math.max(1, c.education.years - 4);
      return { years, kind: years <= 1 ? 'short' : 'more', paid, summary: `About ${years} more year${years === 1 ? '' : 's'} in a specialized program. Your ${label} counts toward it; expect prerequisite courses if it’s in another field.` };
    }
    if (strict && !fieldOk && !graduate && HELD_YEARS[edu] > 0) {
      const years = HELD_ORDER[edu] >= LEVEL_ORDER[level] ? Math.max(1, Math.ceil(c.education.years / 2)) : Math.max(1, c.education.years - Math.min(HELD_YEARS[edu], 2));
      const majors = c.education.majors?.slice(0, 2).join(' or ').toLowerCase();
      return {
        years,
        kind: years <= 1 ? 'short' : 'more',
        paid,
        summary: `Usually needs study in ${majors ?? 'this field'}. With a degree in ${cur?.field ? cur.field.toLowerCase() : 'another field'}, expect a bridge or accelerated program of about ${years} year${years === 1 ? '' : 's'}, plus any prerequisite courses.`,
        note: cur?.field ? undefined : 'If your degree is already in a related field, add it under “Where you are now” for a more precise answer.',
      };
    }
    if (HELD_ORDER[edu] >= LEVEL_ORDER[level]) {
      const note = fieldMatches(cur?.field, c.education.majors)
        ? undefined
        : `Employers often look for study in ${c.education.majors!.slice(0, 2).join(' or ').toLowerCase()}. Your ${cur!.field} background may still qualify, sometimes with a certificate or a few courses.`;
      return { years: 0, kind: 'ready', paid, summary: `No more school: your ${label} meets the usual requirement.`, note };
    }
    const years = Math.max(1, c.education.years - HELD_YEARS[edu]);
    const credit = HELD_YEARS[edu] > 0 ? ` Your ${label} counts toward it.` : '';
    return { years, kind: years <= 1 ? 'short' : 'more', paid, summary: `About ${years} more year${years === 1 ? '' : 's'} of school.${credit}` };
  }

  // Certificates and apprenticeships: a degree doesn't replace the hands-on training, but related work can shorten it.
  const related = cur?.careerId && (CAREER_BY_ID[cur.careerId]?.related.includes(c.id) || c.related.includes(cur.careerId));
  const years = c.education.years;
  if (years === 0) return { years: 0, kind: 'ready', paid, summary: 'No more school needed to start.' };
  const relatedNote = related ? ' Experience in related work may shorten it; ask programs about credit for prior learning.' : '';
  return {
    years,
    kind: years <= 1 ? 'short' : 'more',
    paid,
    summary: paid ? `About ${years} year${years === 1 ? '' : 's'} of paid apprenticeship training.${relatedNote}` : `About ${years} year${years === 1 ? '' : 's'} of training.${relatedNote}`,
  };
}

export function readinessLabel(r: Readiness): string {
  if (r.kind === 'ready') return 'No more school';
  if (r.paid) return `${r.years}-yr paid apprenticeship`;
  return r.years <= 1 ? 'About 1 year more' : `About ${r.years} years more`;
}

/** Skills someone brings: rated 2+ in the skills assessment, or used in the job they do now. */
export function skillsYouHave(p: Profile): SkillId[] {
  const rated = (Object.entries(p.skills) as [SkillId, number][]).filter(([, v]) => v >= 2).map(([k]) => k);
  const fromJob = p.current?.careerId ? (CAREER_BY_ID[p.current.careerId]?.skills ?? []) : [];
  return [...new Set([...rated, ...fromJob])];
}

export function transferableSkills(c: Career, p: Profile): SkillId[] {
  const have = new Set(skillsYouHave(p));
  return c.skills.filter((s) => have.has(s));
}

export const skillLabels = (ids: SkillId[]) => ids.map((s) => SKILLS[s].label.toLowerCase());
