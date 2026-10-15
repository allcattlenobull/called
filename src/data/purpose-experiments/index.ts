import type { GiftId, InterestId, SkillId } from '../../types';

export interface ExperimentQuestion {
  id: string;
  text: string;
}

export interface PurposeExperiment {
  id: string;
  title: string;
  hypothesis: string;
  steps: string[];
  time: string;
  interests: InterestId[];
  skills: SkillId[];
  gifts: GiftId[];
  questions: ExperimentQuestion[];
  safety?: string;
}

const standard = (activity: string): ExperimentQuestion[] => [
  { id: 'enjoy', text: `Did you enjoy ${activity}?` },
  { id: 'energy', text: 'Did it give you energy rather than drain you?' },
  { id: 'natural', text: 'Did it feel natural, like something you were made for?' },
  { id: 'again', text: 'Would you voluntarily do it again?' },
];

export const EXPERIMENTS: PurposeExperiment[] = [
  {
    id: 'teach-a-skill',
    title: 'Teach someone a skill',
    hypothesis: 'You think you might enjoy teaching.',
    steps: ['Pick something you understand well: a math concept, a recipe, a guitar chord, a video game strategy.', 'Find a willing learner: a sibling, a friend, a younger student.', 'Teach it in 15 to 30 minutes, then have them show you they can do it.'],
    time: '30 minutes',
    interests: ['help'],
    skills: ['teaching', 'communication'],
    gifts: ['teaching', 'encouraging'],
    questions: [
      { id: 'enjoy', text: 'Did you enjoy explaining it?' },
      { id: 'click', text: 'Did you enjoy seeing them understand?' },
      { id: 'patience', text: 'Did you have patience when they struggled?' },
      { id: 'again', text: 'Would you voluntarily do it again?' },
    ],
  },
  {
    id: 'interview-pro',
    title: 'Interview a professional',
    hypothesis: 'You want to know what a career is really like from the inside.',
    steps: ['Ask a parent, teacher, pastor or counselor to connect you with someone in a career you’re curious about.', 'Ask for 20 minutes, in person or by video.', 'Ask: What does a normal day look like? What’s harder than people expect? What would you tell your 16-year-old self?', 'Send a thank-you message afterward.'],
    time: '1 hour including prep',
    interests: ['investigate'],
    skills: ['communication', 'research'],
    gifts: ['discernment'],
    questions: [
      { id: 'enjoy', text: 'Did what you heard make the career more interesting?' },
      { id: 'surprise', text: 'Did anything surprise you in a good way?' },
      { id: 'fit', text: 'Can you picture yourself doing their typical day?' },
      { id: 'again', text: 'Would you want to learn more about this career?' },
    ],
    safety: 'Meet in a public place or by video, and tell a parent or guardian who you are meeting.',
  },
  {
    id: 'volunteer-shift',
    title: 'Volunteer for a shift',
    hypothesis: 'You might feel most useful serving people directly.',
    steps: ['Find a food pantry, shelter, hospital, care home or church outreach that takes volunteers your age.', 'Sign up for one shift.', 'Pay attention to which tasks you liked and which you avoided.'],
    time: '2 to 4 hours',
    interests: ['help'],
    skills: ['empathy', 'communication'],
    gifts: ['serving', 'mercy', 'hospitality'],
    questions: standard('serving people directly'),
  },
  {
    id: 'organize-event',
    title: 'Organize something',
    hypothesis: 'You might enjoy making things run well.',
    steps: ['Plan a small event: a study group, a game night, a team dinner, a service project.', 'Make a checklist, invite people, handle the details.', 'Notice what you did when something went wrong.'],
    time: '1 to 2 weeks',
    interests: ['organize', 'lead'],
    skills: ['organization', 'leadership'],
    gifts: ['organizing', 'leading', 'hospitality'],
    questions: standard('planning the details'),
  },
  {
    id: 'make-something',
    title: 'Create something',
    hypothesis: 'You might come alive when you make things.',
    steps: ['Make one complete thing: a short video, a logo, a song, a piece of furniture, an app, a meal for others.', 'Finish it, even if it isn’t perfect.', 'Show it to one person and ask for honest feedback.'],
    time: '1 to 2 weeks',
    interests: ['create', 'build'],
    skills: ['creativity', 'handsOn'],
    gifts: ['creating', 'craftsmanship'],
    questions: standard('making it'),
  },
  {
    id: 'help-someone',
    title: 'Help someone through a problem',
    hypothesis: 'You might be good at walking alongside people.',
    steps: ['Notice someone who is stuck: with homework, a decision, a hard week.', 'Offer help and mostly listen.', 'Afterward, reflect on what you did that helped.'],
    time: 'Varies',
    interests: ['help'],
    skills: ['empathy'],
    gifts: ['mercy', 'encouraging', 'discernment'],
    questions: standard('helping them'),
  },
  {
    id: 'fix-something',
    title: 'Fix something',
    hypothesis: 'You might enjoy figuring out why things break.',
    steps: ['Find something broken: a bike, a lamp, a laptop problem, a squeaky door.', 'Research how it works and what might be wrong.', 'Fix it safely, with an adult’s help if it involves electricity, gas or tools you haven’t used.'],
    time: 'An afternoon',
    interests: ['build', 'investigate'],
    skills: ['handsOn', 'problemSolving'],
    gifts: ['craftsmanship', 'problemSolving'],
    questions: standard('figuring it out'),
    safety: 'Never work on anything connected to household electricity or gas without a qualified adult.',
  },
  {
    id: 'lead-something',
    title: 'Lead something',
    hypothesis: 'You might be a leader others want to follow.',
    steps: ['Volunteer to lead a group project, a small team, a youth group activity or a club meeting.', 'Set a goal, divide the work and keep people moving.', 'Ask one person afterward what you did well and what you could improve.'],
    time: '1 to 3 weeks',
    interests: ['lead'],
    skills: ['leadership', 'communication'],
    gifts: ['leading', 'encouraging'],
    questions: standard('leading the group'),
  },
  {
    id: 'research-deep-dive',
    title: 'Research a question deeply',
    hypothesis: 'You might love finding out what’s actually true.',
    steps: ['Pick a real question you care about: Why is housing so expensive? How do vaccines work? Are electric cars better?', 'Spend three hours finding reliable sources.', 'Write a one-page answer someone else could understand.'],
    time: '3 to 4 hours',
    interests: ['investigate'],
    skills: ['research', 'writing', 'analysis'],
    gifts: ['discernment'],
    questions: standard('the research'),
  },
  {
    id: 'sell-something',
    title: 'Sell something',
    hypothesis: 'You might enjoy persuading and building something of your own.',
    steps: ['Sell something real: baked goods, a service like lawn mowing, items you made, or tickets for a cause.', 'Set a goal and a price.', 'Track what you sold and what worked.'],
    time: '1 to 2 weeks',
    interests: ['lead'],
    skills: ['persuasion', 'communication'],
    gifts: ['communicating', 'courage'],
    questions: standard('selling'),
  },
  {
    id: 'budget-month',
    title: 'Run a real budget',
    hypothesis: 'You might enjoy managing money and numbers.',
    steps: ['Track every dollar you or your household (with permission) spend for one month.', 'Sort it into categories.', 'Find one thing that surprised you and one change you’d make.'],
    time: '1 month, 10 minutes a day',
    interests: ['organize', 'investigate'],
    skills: ['math', 'organization', 'analysis'],
    gifts: ['organizing', 'discernment', 'giving'],
    questions: standard('working with the numbers'),
  },
  {
    id: 'care-visit',
    title: 'Spend time with older adults',
    hypothesis: 'You might be drawn to caring for people who are vulnerable.',
    steps: ['Visit a grandparent, a neighbor or a care home that accepts young visitors.', 'Ask about their life and really listen.', 'Help with something practical if they want it.'],
    time: '1 to 2 hours',
    interests: ['help'],
    skills: ['empathy', 'communication'],
    gifts: ['mercy', 'serving', 'hospitality'],
    questions: standard('the time with them'),
  },
];

export const EXPERIMENT_BY_ID: Record<string, PurposeExperiment> = Object.fromEntries(EXPERIMENTS.map((e) => [e.id, e]));

export const EXPERIMENT_SCALE = [
  { value: 1, label: 'Not at all' },
  { value: 2, label: 'A little' },
  { value: 3, label: 'Somewhat' },
  { value: 4, label: 'Mostly' },
  { value: 5, label: 'Very much' },
];
