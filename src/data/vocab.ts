// Human-readable labels for every shared vocabulary. Keep wording plain and sentence case.
import type {
  AptitudeId,
  CareerFamily,
  EducationLevel,
  GiftId,
  InterestId,
  Outlook,
  ProblemId,
  RouteId,
  Schedule,
  ServeId,
  SkillId,
  ValueId,
  ValueTier,
  WorkAxis,
  Remote,
} from '../types';

export const INTERESTS: Record<InterestId, { label: string; blurb: string; holland: string }> = {
  build: { label: 'Building and fixing', blurb: 'Working with tools, machines, materials, plants or animals.', holland: 'Realistic' },
  investigate: { label: 'Investigating', blurb: 'Figuring out how things work, testing ideas, solving puzzles.', holland: 'Investigative' },
  create: { label: 'Creating', blurb: 'Making original things: writing, design, music, media.', holland: 'Artistic' },
  help: { label: 'Helping people', blurb: 'Teaching, caring for, counseling or serving others.', holland: 'Social' },
  lead: { label: 'Leading and persuading', blurb: 'Starting things, convincing people, taking charge.', holland: 'Enterprising' },
  organize: { label: 'Organizing', blurb: 'Keeping information, money and systems accurate and in order.', holland: 'Conventional' },
};

export const SKILLS: Record<SkillId, { label: string; example: string }> = {
  communication: { label: 'Speaking and listening', example: 'Explaining something clearly out loud, or really hearing someone out.' },
  writing: { label: 'Writing', example: 'Essays, posts, messages or stories that people understand easily.' },
  math: { label: 'Math', example: 'Working comfortably with numbers, percentages and equations.' },
  analysis: { label: 'Analyzing information', example: 'Spotting patterns or problems in data, charts or arguments.' },
  technology: { label: 'Technology', example: 'Learning software quickly, coding, troubleshooting devices.' },
  handsOn: { label: 'Hands-on work', example: 'Building, repairing, cooking, assembling, using tools.' },
  creativity: { label: 'Creative work', example: 'Designing, drawing, composing, filming or inventing.' },
  leadership: { label: 'Leading a group', example: 'Getting people moving in the same direction.' },
  organization: { label: 'Organizing', example: 'Planning events, keeping schedules, tracking details.' },
  teaching: { label: 'Teaching', example: 'Helping someone understand something they found hard.' },
  empathy: { label: 'Understanding people', example: 'Noticing how someone feels and responding well.' },
  persuasion: { label: 'Persuading', example: 'Convincing people, selling, negotiating, debating.' },
  research: { label: 'Researching', example: 'Finding reliable answers and checking sources.' },
  problemSolving: { label: 'Solving problems', example: 'Staying with a tricky problem until it works.' },
};

export const SKILL_LEVELS = [
  { value: 0, label: "Haven't tried it" },
  { value: 1, label: 'Learning' },
  { value: 2, label: 'I can do this' },
  { value: 3, label: 'Others rely on me for it' },
] as const;

export const APTITUDES: Record<AptitudeId, { label: string; blurb: string }> = {
  numerical: { label: 'Number patterns', blurb: 'Seeing how numbers relate and change.' },
  verbal: { label: 'Word relationships', blurb: 'Understanding meanings and how ideas connect.' },
  spatial: { label: 'Spatial reasoning', blurb: 'Picturing shapes and how they turn and fit.' },
  detail: { label: 'Attention to detail', blurb: 'Catching small differences others miss.' },
  logical: { label: 'Logical reasoning', blurb: 'Following rules to a sound conclusion.' },
};

export const WORK_AXES: Record<WorkAxis, { left: string; right: string; label: string }> = {
  social: { label: 'Working with others', left: 'Mostly independently', right: 'Constantly collaborating' },
  structure: { label: 'Kind of problems', left: 'Clear, structured problems', right: 'Open-ended problems' },
  variety: { label: 'Rhythm', left: 'Steady and familiar', right: 'Something new every day' },
  visibility: { label: 'Visibility', left: 'Behind the scenes', right: 'Front and center' },
  handsIdeas: { label: 'Kind of work', left: 'Ideas and information', right: 'Physical, hands-on' },
  pace: { label: 'Pace', left: 'Calm and deliberate', right: 'Fast and urgent' },
};

export const VALUES: Record<ValueId, { label: string; blurb: string }> = {
  income: { label: 'High income', blurb: 'Earning well above average.' },
  stability: { label: 'Stability', blurb: 'A secure job that is likely to last.' },
  flexibility: { label: 'Flexibility', blurb: 'Control over when and where you work.' },
  familyTime: { label: 'Family time', blurb: 'Evenings, weekends and holidays protected.' },
  creativity: { label: 'Creativity', blurb: 'Making original things and ideas.' },
  leadership: { label: 'Leadership', blurb: 'Being responsible for people and direction.' },
  helping: { label: 'Helping people', blurb: 'Directly improving someone’s day or life.' },
  independence: { label: 'Independence', blurb: 'Deciding how your work gets done.' },
  recognition: { label: 'Recognition', blurb: 'Respect and visibility for your work.' },
  meaningful: { label: 'Meaningful work', blurb: 'Work that clearly matters beyond a paycheck.' },
  entrepreneurship: { label: 'Building something of my own', blurb: 'Starting or owning a business.' },
  travel: { label: 'Travel', blurb: 'Seeing new places as part of the job.' },
  community: { label: 'Community', blurb: 'Belonging to a team and serving a local place.' },
  predictability: { label: 'Predictability', blurb: 'Knowing what each day will look like.' },
};

export const VALUE_TIERS: { id: ValueTier; label: string; weight: number }[] = [
  { id: 'essential', label: 'Essential', weight: 3 },
  { id: 'important', label: 'Important', weight: 2 },
  { id: 'somewhat', label: 'Somewhat', weight: 1 },
  { id: 'notPriority', label: 'Not a priority', weight: 0 },
];

export const GIFTS: Record<GiftId, { label: string; blurb: string }> = {
  teaching: { label: 'Teaching', blurb: 'Making things make sense for others.' },
  encouraging: { label: 'Encouraging', blurb: 'Helping people keep going.' },
  leading: { label: 'Leading', blurb: 'Seeing where a group should go and taking it there.' },
  organizing: { label: 'Organizing', blurb: 'Turning chaos into a plan that works.' },
  serving: { label: 'Serving', blurb: 'Noticing practical needs and meeting them.' },
  mercy: { label: 'Compassion', blurb: 'Staying with people who are hurting.' },
  giving: { label: 'Generosity', blurb: 'Sharing time, money and resources freely.' },
  hospitality: { label: 'Hospitality', blurb: 'Making people feel welcome and at home.' },
  craftsmanship: { label: 'Craftsmanship', blurb: 'Making and fixing things with skill and care.' },
  creating: { label: 'Creativity', blurb: 'Imagining things that don’t exist yet.' },
  discernment: { label: 'Wisdom', blurb: 'Seeing what’s really going on and judging well.' },
  communicating: { label: 'Communicating', blurb: 'Putting ideas into words that land.' },
  problemSolving: { label: 'Problem solving', blurb: 'Untangling things others find stuck.' },
  courage: { label: 'Courage', blurb: 'Stepping in when things are hard or risky.' },
};

export const SERVES: Record<ServeId, string> = {
  children: 'Children',
  teens: 'Teenagers',
  patients: 'People who are sick or injured',
  families: 'Families',
  elderly: 'Older adults',
  communities: 'My local community',
  smallBusinesses: 'Small businesses',
  organizations: 'Organizations and teams',
  crisis: 'People in crisis',
  vulnerable: 'People who are overlooked',
  customers: 'Customers and clients',
  futureGenerations: 'Future generations',
  church: 'The church',
  animals: 'Animals',
};

export const PROBLEMS: Record<ProblemId, string> = {
  health: 'Physical health',
  mentalHealth: 'Mental health and loneliness',
  education: 'Education and learning',
  poverty: 'Poverty and opportunity',
  justice: 'Justice and fairness',
  environment: 'Creation care and the environment',
  technology: 'Technology that works for people',
  infrastructure: 'Homes, roads, power and water',
  safety: 'Safety and emergencies',
  family: 'Strong families',
  finance: 'Money stress and financial wisdom',
  culture: 'Art, stories and culture',
  food: 'Food and farming',
  housing: 'Housing',
  faith: 'Faith and spiritual life',
};

export const FAMILIES: Record<CareerFamily, string> = {
  healthcare: 'Healthcare',
  technology: 'Technology',
  business: 'Business',
  finance: 'Finance',
  education: 'Education',
  trades: 'Skilled trades',
  government: 'Government and public service',
  creative: 'Creative work',
  humanServices: 'Human services',
  engineering: 'Engineering',
  science: 'Science',
  entrepreneurship: 'Entrepreneurship',
  operations: 'Operations',
  legal: 'Legal',
  publicSafety: 'Public safety',
};

export const EDUCATION_LEVELS: Record<EducationLevel, { label: string; order: number }> = {
  none: { label: 'High school diploma', order: 0 },
  certificate: { label: 'Certificate or license', order: 1 },
  apprenticeship: { label: 'Apprenticeship', order: 2 },
  associate: { label: 'Associate degree', order: 3 },
  bachelor: { label: "Bachelor's degree", order: 4 },
  master: { label: "Master's degree", order: 5 },
  doctoral: { label: 'Doctoral or professional degree', order: 6 },
};

export const ROUTES: Record<RouteId, string> = {
  college: 'Four-year college',
  communityCollege: 'Community college',
  certification: 'Certification',
  tradeSchool: 'Trade school',
  apprenticeship: 'Apprenticeship',
  military: 'Military',
  entrepreneurship: 'Start a business',
  directToWork: 'Straight to work',
  graduate: 'Graduate school',
};

export const OUTLOOK: Record<Outlook, { label: string; rank: number }> = {
  declining: { label: 'Declining', rank: 0 },
  littleChange: { label: 'Little change', rank: 1 },
  average: { label: 'About average growth', rank: 2 },
  faster: { label: 'Faster than average', rank: 3 },
  muchFaster: { label: 'Much faster than average', rank: 4 },
};

export const SCHEDULE: Record<Schedule, string> = {
  regular: 'Regular weekday hours',
  shifts: 'Shifts, including nights or weekends',
  irregular: 'Irregular or project-based',
  seasonal: 'Seasonal swings',
};

export const REMOTE: Record<Remote, string> = {
  none: 'On site',
  some: 'Some remote work',
  common: 'Remote is common',
};

export const LEVEL_WORDS = { 1: 'Low', 2: 'Moderate', 3: 'High' } as const;
