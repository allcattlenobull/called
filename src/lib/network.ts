import type { Career, ConversationEntry, Profile, ProfileLocation } from '../types';

export interface NetworkResource {
  id: string;
  name: string;
  description: string;
  url: string;
  kind: 'general' | 'career' | 'student';
}

export const GENERAL_RESOURCES: NetworkResource[] = [
  { id: 'careeronestop', name: 'CareerOneStop Professional Association Finder', description: 'Search established professional associations by occupation and location.', url: 'https://www.careeronestop.org/BusinessCenter/Toolkit/find-professional-associations.aspx', kind: 'general' },
  { id: 'apprenticeship', name: 'Apprenticeship.gov', description: 'Find registered apprenticeships and earn-while-you-learn programs.', url: 'https://www.apprenticeship.gov/apprenticeship-job-finder', kind: 'general' },
  { id: 'ajc', name: 'American Job Centers', description: 'Find local workforce centers that offer career and training help at no cost.', url: 'https://www.careeronestop.org/LocalHelp/service-locator.aspx', kind: 'general' },
];

const CAREER_RESOURCES: { test: (c: Career) => boolean; resources: NetworkResource[] }[] = [
  { test: (c) => /electric|electrical|lineworker|power technician/i.test(c.title), resources: [
    { id: 'ibew', name: 'IBEW', description: 'Electrical workers and apprenticeship information through local unions.', url: 'https://www.ibew.org/Tools/Local-Union-Directory', kind: 'career' },
    { id: 'neca', name: 'NECA', description: 'Electrical contractors and local chapters.', url: 'https://www.necanet.org/chapters', kind: 'career' },
    { id: 'iec', name: 'IEC', description: 'Independent Electrical Contractors chapters and training.', url: 'https://www.ieci.org/chapters', kind: 'career' },
  ] },
  { test: (c) => /plumb|pipe|hvac|heating|cooling/i.test(c.title), resources: [
    { id: 'ua', name: 'United Association', description: 'Pipe trades training and local union connections.', url: 'https://ua.org/join-the-ua', kind: 'career' },
  ] },
  { test: (c) => /construction|carpenter|welder|mason|ironworker|roof|insulation|equipment operator/i.test(c.title), resources: [
    { id: 'abc', name: 'Associated Builders and Contractors', description: 'Construction education, apprenticeships, and local chapters.', url: 'https://www.abc.org/Connect/Find-a-Chapter', kind: 'career' },
    { id: 'agc', name: 'Associated General Contractors', description: 'Construction employers, chapters, and career pathways.', url: 'https://www.agc.org/chapters', kind: 'career' },
  ] },
  { test: (c) => c.family === 'healthcare' || /nurs|medical|therap|dental|paramedic|pharmacy/i.test(c.title), resources: [
    { id: 'nursing-associations', name: 'State and professional healthcare associations', description: 'Find the association for your state and role through CareerOneStop.', url: 'https://www.careeronestop.org/BusinessCenter/Toolkit/find-professional-associations.aspx', kind: 'career' },
  ] },
];

const STUDENT_RESOURCES: { test: (c: Career) => boolean; resource: NetworkResource }[] = [
  { test: (c) => c.family === 'trades' || c.family === 'operations', resource: { id: 'skillsusa', name: 'SkillsUSA', description: 'Student chapters, competitions, and hands-on career learning.', url: 'https://www.skillsusa.org/get-involved/students/', kind: 'student' } },
  { test: (c) => c.family === 'healthcare', resource: { id: 'hosa', name: 'HOSA', description: 'Health science student chapters and events.', url: 'https://hosa.org/chapters/', kind: 'student' } },
  { test: (c) => /farm|agricultur|natural resource|animal|food/i.test(c.title), resource: { id: 'ffa', name: 'FFA', description: 'Agriculture, food, natural resources, and leadership opportunities.', url: 'https://www.ffa.org/participate/', kind: 'student' } },
  { test: (c) => ['business', 'finance', 'entrepreneurship'].includes(c.family) || /marketing|sales/i.test(c.title), resource: { id: 'deca', name: 'DECA', description: 'Business, marketing, finance, and entrepreneurship experiences.', url: 'https://www.deca.org/participate', kind: 'student' } },
  { test: (c) => ['business', 'finance', 'technology'].includes(c.family), resource: { id: 'fbla', name: 'FBLA', description: 'Business and leadership opportunities for students.', url: 'https://www.fbla.org/participate/', kind: 'student' } },
];

export const stageLabel = (stage: Profile['stage']) => ({ highSchool: 'in high school', graduated: 'recently graduated', college: 'in college or training', working: 'working or changing careers', other: 'exploring a next step' }[stage ?? 'other']);

export function locationText(location?: ProfileLocation): string {
  if (!location) return '';
  return [location.city, location.state].filter(Boolean).join(', ') || location.state || '';
}

export function resourcesForCareer(career: Career, stage?: Profile['stage']): NetworkResource[] {
  const relevant = CAREER_RESOURCES.find(({ test }) => test(career))?.resources ?? [];
  const student = stage === 'highSchool' ? STUDENT_RESOURCES.filter(({ test }) => test(career)).map(({ resource }) => resource) : [];
  return [...GENERAL_RESOURCES, ...relevant, ...student];
}

export function conversationsForCareer(careerId: string, profile: Profile): ConversationEntry[] {
  return profile.conversations.filter((entry) => entry.careerId === careerId);
}

export function outreachScript(career: Career, profile: Profile): string {
  const place = locationText(profile.location);
  const where = place ? ` in the ${place} area` : '';
  const stage = profile.stage;
  if (stage === 'highSchool') return `Hi — I’m a high school student exploring what working as a ${career.title.toLowerCase()} is really like${where}. Would you be open to a short conversation, an open house, or pointing me toward a student or apprentice who could share what the work and training are like? I’m not asking for a job — I’m trying to learn what to explore next. I’ll be glad to include a teacher, counselor, parent, or other trusted adult.`;
  if (stage === 'college') return `Hi — I’m in college or training and exploring ${career.title.toLowerCase()}${where}. Would you be open to a 20-minute conversation, or point me toward an alumnus, internship contact, or local professional group? I’m not asking for a job — I’m trying to understand the work, training path, and what you wish you had known when you started.`;
  if (stage === 'working') return `Hi — I’m currently working and considering a career change into ${career.title.toLowerCase()}${where}. Would you be open to a 20-minute conversation, an open house, or pointing me toward someone who helps people explore the field? I’m not asking for a job — I’m trying to understand the work, training path, and what you wish you had known when you started.`;
  if (stage === 'graduated') return `Hi — I recently graduated and am exploring ${career.title.toLowerCase()}${where}. Would you be open to a 20-minute conversation or point me toward a local professional, training program, or open house? I’m not asking for a job — I’m trying to learn what the work and training path are really like.`;
  return `Hi — I’m exploring what working as a ${career.title.toLowerCase()} is really like${where}. Would you be open to a 20-minute conversation or point me toward someone who could help me understand the work, training path, and what you wish you had known when you started? I’m not asking for a job — I’m trying to learn what to explore next.`;
}

export function localContext(profile: Profile): string {
  const place = locationText(profile.location);
  return place ? `near ${place}` : 'in your area';
}
