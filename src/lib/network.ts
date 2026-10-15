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
  { test: (c) => c.family === 'technology', resources: [
    { id: 'acm', name: 'Association for Computing Machinery', description: 'Professional chapters, student chapters, events, and computing communities.', url: 'https://www.acm.org/chapters/find-a-chapter', kind: 'career' },
    { id: 'ieee', name: 'IEEE local organizations', description: 'Geographic sections, technical communities, and student branches for engineering and technology.', url: 'https://www.ieee.org/communities/geographic-activities.html', kind: 'career' },
  ] },
  { test: (c) => ['engineering', 'science'].includes(c.family), resources: [
    { id: 'nspe', name: 'National Society of Professional Engineers', description: 'State societies and local professional engineering connections.', url: 'https://www.nspe.org/membership/about-nspe/state-societies', kind: 'career' },
    { id: 'science-societies', name: 'Science and engineering associations', description: 'Search recognized professional associations by occupation.', url: 'https://www.careeronestop.org/BusinessCenter/Toolkit/find-professional-associations.aspx', kind: 'career' },
  ] },
  { test: (c) => ['business', 'finance', 'entrepreneurship'].includes(c.family), resources: [
    { id: 'score', name: 'SCORE', description: 'Free business mentoring and local workshops from experienced volunteers.', url: 'https://www.score.org/find-mentor', kind: 'career' },
    { id: 'business-associations', name: 'Business and finance associations', description: 'Find role-specific professional associations and chapters.', url: 'https://www.careeronestop.org/BusinessCenter/Toolkit/find-professional-associations.aspx', kind: 'career' },
  ] },
  { test: (c) => ['education', 'humanServices', 'government', 'publicSafety'].includes(c.family), resources: [
    { id: 'public-service-associations', name: 'Education and public-service associations', description: 'Find established national, state, and local professional organizations.', url: 'https://www.careeronestop.org/BusinessCenter/Toolkit/find-professional-associations.aspx', kind: 'career' },
  ] },
  { test: (c) => c.family === 'creative', resources: [
    { id: 'aiga', name: 'AIGA chapters', description: 'Local design communities, events, portfolio reviews, and student groups.', url: 'https://www.aiga.org/membership-community/aiga-chapters', kind: 'career' },
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

export function shadowRequestScript(career: Career, profile: Profile): string {
  const place = locationText(profile.location);
  const where = place ? ` in ${place}` : '';
  const trustedAdult = profile.stage === 'highSchool' ? ' A parent, teacher, counselor, or other trusted adult can coordinate and attend.' : '';
  return `Hello — I’m exploring ${career.title.toLowerCase()}${where} and would like to understand the work beyond a job description. Does your organization offer an open house, workplace tour, short job shadow, volunteer opportunity, or another safe way to observe the field? I’m looking to learn, not asking for a job.${trustedAdult}`;
}

export function interviewQuestions(career: Career): string[] {
  return [
    `What does a normal week as a ${career.title.toLowerCase()} actually look like?`,
    'What part of the work surprises people after they enter the field?',
    `Which skill matters most when ${career.frustrations[0]?.toLowerCase() ?? 'the work gets difficult'}?`,
    'What training route gives someone the best chance to test the work before taking on debt?',
    'How have AI or other new tools changed what beginners do?',
    'What is one thing I could try in the next month to learn whether this fits me?',
  ];
}

export function localContext(profile: Profile): string {
  const place = locationText(profile.location);
  return place ? `near ${place}` : 'in your area';
}
