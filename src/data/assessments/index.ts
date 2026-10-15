import type { AptitudeId, AssessmentId, InterestId, LifestylePrefs, WorkAxis } from '../../types';

export interface AssessmentMeta {
  id: AssessmentId;
  title: string;
  question: string;
  minutes: number;
  blurb: string;
  group: 'self' | 'life';
}

export const ASSESSMENTS: AssessmentMeta[] = [
  { id: 'interests', title: 'Interests', question: 'What captures your attention?', minutes: 4, group: 'self', blurb: 'React to 30 everyday activities. There are no right answers.' },
  { id: 'skills', title: 'Skills', question: 'What can you do well right now?', minutes: 3, group: 'self', blurb: 'Rate 14 skills by what you have actually done, not what you hope.' },
  { id: 'aptitudes', title: 'Aptitudes', question: 'What might come naturally?', minutes: 6, group: 'self', blurb: 'Fifteen short puzzles across five kinds of thinking. Take your time.' },
  { id: 'workStyle', title: 'Work style', question: 'How do you prefer to work?', minutes: 2, group: 'self', blurb: 'Twelve this-or-that choices about how you like to spend a workday.' },
  { id: 'values', title: 'Values', question: 'What matters most to you?', minutes: 3, group: 'life', blurb: 'Sort 14 values from essential to not a priority.' },
  { id: 'lifestyle', title: 'Lifestyle', question: 'What kind of life are you building?', minutes: 3, group: 'life', blurb: 'Training time, debt, income, schedule, location and risk.' },
];

/* ---------- Interests ---------- */

export interface InterestItem {
  id: string;
  interest: InterestId;
  text: string;
}

const raw: [InterestId, string][] = [
  ['build', 'Repair a bike, a phone screen or a small engine'],
  ['investigate', 'Figure out why an experiment didn’t work'],
  ['create', 'Design a logo, poster or T-shirt'],
  ['help', 'Tutor a younger student who is struggling'],
  ['lead', 'Pitch an idea and convince a group to try it'],
  ['organize', 'Keep a budget and track where money goes'],
  ['build', 'Build furniture or a structure from plans'],
  ['investigate', 'Learn how the body fights off disease'],
  ['create', 'Write a short story, poem or song'],
  ['help', 'Care for someone who is sick or hurt'],
  ['lead', 'Start a club, team or small business'],
  ['organize', 'Organize files, schedules or inventory so nothing gets lost'],
  ['build', 'Work outdoors with plants, animals or the land'],
  ['investigate', 'Dig through data to find a hidden pattern'],
  ['create', 'Film and edit a video'],
  ['help', 'Listen to a friend work through a hard situation'],
  ['lead', 'Negotiate a better deal for your group'],
  ['organize', 'Check a document carefully for mistakes'],
  ['build', 'Wire a circuit or install equipment'],
  ['investigate', 'Solve logic puzzles or coding challenges'],
  ['create', 'Perform, present or act in front of people'],
  ['help', 'Volunteer at a shelter, food pantry or care home'],
  ['lead', 'Take charge of a group project when it stalls'],
  ['organize', 'Follow a detailed procedure exactly'],
  ['build', 'Use power tools or operate machinery'],
  ['investigate', 'Research a question until you find the real answer'],
  ['create', 'Redesign a room or a space so it feels better'],
  ['help', 'Coach a team or lead a youth group activity'],
  ['lead', 'Sell something you believe in'],
  ['organize', 'Plan the logistics for a trip or event'],
];

export const INTEREST_ITEMS: InterestItem[] = raw.map(([interest, text], i) => ({ id: `i${i + 1}`, interest, text }));

/* ---------- Work style ---------- */

export interface WorkStyleItem {
  id: string;
  axis: WorkAxis;
  left: string;
  right: string;
}

export const WORK_STYLE_ITEMS: WorkStyleItem[] = [
  { id: 'w1', axis: 'social', left: 'Working independently with headphones on', right: 'Collaborating with a team all day' },
  { id: 'w2', axis: 'structure', left: 'Problems with a clear right answer', right: 'Open-ended problems with many possible answers' },
  { id: 'w3', axis: 'variety', left: 'Getting really good at a familiar routine', right: 'A different challenge every day' },
  { id: 'w4', axis: 'visibility', left: 'Doing important work behind the scenes', right: 'Being the person in front presenting' },
  { id: 'w5', axis: 'handsIdeas', left: 'Working with ideas, words and screens', right: 'Working with my hands and moving around' },
  { id: 'w6', axis: 'pace', left: 'A calm pace with time to think', right: 'A fast pace with urgent decisions' },
  { id: 'w7', axis: 'social', left: 'A few deep conversations a day', right: 'Talking with lots of different people' },
  { id: 'w8', axis: 'structure', left: 'Clear instructions and expectations', right: 'Freedom to figure out my own approach' },
  { id: 'w9', axis: 'variety', left: 'Knowing what tomorrow looks like', right: 'Not knowing what tomorrow brings' },
  { id: 'w10', axis: 'visibility', left: 'Quiet credit for good work', right: 'Public recognition and a visible role' },
  { id: 'w11', axis: 'handsIdeas', left: 'Indoors at a desk', right: 'On a site, in the field or on my feet' },
  { id: 'w12', axis: 'pace', left: 'Long projects that build slowly', right: 'Quick wins and constant motion' },
];

/* ---------- Aptitudes ---------- */

export type Grid = number[][];

export interface AptitudeItem {
  id: string;
  aptitude: AptitudeId;
  prompt: string;
  /** Lines shown in a fixed-width card, for detail comparisons. */
  compare?: [string, string];
  /** For spatial items: the shape to rotate. Options are generated from it. */
  grid?: Grid;
  options: string[];
  answer: number;
  explain: string;
}

export const APTITUDE_ITEMS: AptitudeItem[] = [
  { id: 'n1', aptitude: 'numerical', prompt: 'What comes next? 3, 6, 12, 24, …', options: ['30', '36', '48', '72'], answer: 2, explain: 'Each number doubles.' },
  { id: 'n2', aptitude: 'numerical', prompt: 'What comes next? 7, 10, 14, 19, …', options: ['23', '24', '25', '26'], answer: 2, explain: 'The gap grows by one each time: +3, +4, +5, +6.' },
  { id: 'n3', aptitude: 'numerical', prompt: 'What comes next? 2, 5, 11, 23, …', options: ['35', '46', '47', '49'], answer: 2, explain: 'Double the number and add one.' },
  { id: 'v1', aptitude: 'verbal', prompt: 'Seed is to tree as spark is to …', options: ['Light', 'Fire', 'Match', 'Heat'], answer: 1, explain: 'A seed grows into a tree; a spark grows into a fire.' },
  { id: 'v2', aptitude: 'verbal', prompt: 'Teacher is to lesson plan as architect is to …', options: ['Building', 'Client', 'Blueprint', 'Hammer'], answer: 2, explain: 'Both are the plan each professional prepares before the work happens.' },
  { id: 'v3', aptitude: 'verbal', prompt: 'Generous is to stingy as humble is to …', options: ['Modest', 'Arrogant', 'Quiet', 'Kind'], answer: 1, explain: 'The pairs are opposites.' },
  { id: 'l1', aptitude: 'logical', prompt: 'Everyone on this crew is certified. Jordan is on this crew. Which must be true?', options: ['Jordan is the crew leader', 'Jordan is certified', 'Everyone certified is on this crew', 'None of these'], answer: 1, explain: 'If all crew members are certified and Jordan is a crew member, Jordan is certified. The reverse doesn’t follow.' },
  { id: 'l2', aptitude: 'logical', prompt: 'If the store is open, its sign is lit. Tonight the sign is not lit. What follows?', options: ['The store is open', 'The store is closed', 'The sign is broken', 'You can’t tell'], answer: 1, explain: 'If being open always means the sign is lit, an unlit sign means it isn’t open.' },
  { id: 'l3', aptitude: 'logical', prompt: 'Maya finished before Leo. Sam finished after Leo. Ana finished before Maya. Who finished last?', options: ['Maya', 'Leo', 'Sam', 'Ana'], answer: 2, explain: 'The order is Ana, Maya, Leo, Sam.' },
  {
    id: 'd1',
    aptitude: 'detail',
    prompt: 'Are these two shipping labels identical?',
    compare: ['Order 48213-B, 1720 Elm St, Apt 4, Dayton OH', 'Order 48213-B, 1702 Elm St, Apt 4, Dayton OH'],
    options: ['Identical', 'Order number differs', 'Street number differs', 'Apartment differs'],
    answer: 2,
    explain: '1720 versus 1702.',
  },
  {
    id: 'd2',
    aptitude: 'detail',
    prompt: 'Are these two dosage notes identical?',
    compare: ['Take 2 tablets every 6 hours with food', 'Take 2 tablets every 6 hours with food'],
    options: ['Identical', 'Tablet count differs', 'Hours differ', 'Instructions differ'],
    answer: 0,
    explain: 'They match exactly. Checking carefully and confirming a match is part of detail work too.',
  },
  {
    id: 'd3',
    aptitude: 'detail',
    prompt: 'Are these two account codes identical?',
    compare: ['ACCT-7731-QR9-0058-LX', 'ACCT-7731-QR9-0O58-LX'],
    options: ['Identical', 'Differs in the first group', 'Differs in the fourth group', 'Differs in the last group'],
    answer: 2,
    explain: 'The fourth group uses the letter O instead of a zero: 0O58.',
  },
  {
    id: 's1',
    aptitude: 'spatial',
    prompt: 'Which option is this shape turned a quarter turn clockwise?',
    grid: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
    ],
    options: [],
    answer: 0,
    explain: 'The long side moves from the left to the top, and the foot moves from the bottom to the left.',
  },
  {
    id: 's2',
    aptitude: 'spatial',
    prompt: 'Which option is this shape turned a quarter turn clockwise?',
    grid: [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    options: [],
    answer: 0,
    explain: 'Picture the top row swinging around to the right side.',
  },
  {
    id: 's3',
    aptitude: 'spatial',
    prompt: 'Which option is this shape turned a quarter turn clockwise?',
    grid: [
      [1, 1, 1],
      [1, 0, 0],
      [0, 0, 0],
    ],
    options: [],
    answer: 0,
    explain: 'The top row becomes the right column, and the left cell drops to the top.',
  },
];

/* ---------- Lifestyle ---------- */

export interface LifestyleQuestion<K extends keyof LifestylePrefs = keyof LifestylePrefs> {
  key: K;
  question: string;
  options: { value: NonNullable<LifestylePrefs[K]>; label: string }[];
}

export const LIFESTYLE_QUESTIONS: LifestyleQuestion[] = [
  {
    key: 'trainingYears',
    question: 'How long are you willing to train after high school?',
    options: [
      { value: 'short', label: 'As short as possible, a year or less' },
      { value: 'two', label: 'Up to about 2 years' },
      { value: 'four', label: 'Up to about 4 years' },
      { value: 'long', label: 'Longer is fine if the career is worth it' },
    ],
  },
  {
    key: 'debt',
    question: 'How do you feel about student debt?',
    options: [
      { value: 'avoid', label: 'I want to avoid it completely' },
      { value: 'small', label: 'A small amount is okay' },
      { value: 'moderate', label: 'A moderate amount for the right path' },
      { value: 'comfortable', label: 'I’m comfortable borrowing for a high-paying path' },
    ],
  },
  {
    key: 'income',
    question: 'What yearly income would feel like enough, mid-career?',
    options: [
      { value: 'modest', label: 'Around $40,000 is enough' },
      { value: 'comfortable', label: 'Around $60,000' },
      { value: 'high', label: 'Around $90,000' },
      { value: 'veryHigh', label: '$130,000 or more' },
      { value: 'notFactor', label: 'Income isn’t a big factor for me' },
    ],
  },
  {
    key: 'schedule',
    question: 'What kind of schedule do you want?',
    options: [
      { value: 'regular', label: 'Regular weekday hours' },
      { value: 'flexible', label: 'Flexible hours I control' },
      { value: 'shiftsOk', label: 'Shifts, nights or weekends are fine' },
      { value: 'noPref', label: 'No strong preference' },
    ],
  },
  {
    key: 'remote',
    question: 'Where do you want to work?',
    options: [
      { value: 'inPerson', label: 'In person, with people around' },
      { value: 'hybrid', label: 'A mix of home and on site' },
      { value: 'remote', label: 'Mostly from home' },
      { value: 'noPref', label: 'No strong preference' },
    ],
  },
  {
    key: 'geography',
    question: 'How flexible are you about where you live?',
    options: [
      { value: 'stayClose', label: 'I want to stay near home' },
      { value: 'relocate', label: 'I’d move for the right opportunity' },
      { value: 'anywhere', label: 'I’d love to live in different places' },
    ],
  },
  {
    key: 'physical',
    question: 'How physical do you want your work to be?',
    options: [
      { value: 'desk', label: 'Mostly sitting' },
      { value: 'some', label: 'Some movement' },
      { value: 'active', label: 'Active and physical' },
      { value: 'noPref', label: 'No strong preference' },
    ],
  },
  {
    key: 'travel',
    question: 'How much travel do you want?',
    options: [
      { value: 'rarely', label: 'Rarely' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'often', label: 'Often' },
    ],
  },
  {
    key: 'balance',
    question: 'How important is work-life balance right now?',
    options: [
      { value: 'high', label: 'Very important, I want protected time' },
      { value: 'moderate', label: 'Important, with occasional crunch' },
      { value: 'hustle', label: 'I’m willing to work long hours early on' },
    ],
  },
  {
    key: 'entrepreneurship',
    question: 'Would you like to run your own business someday?',
    options: [
      { value: 'no', label: 'Probably not' },
      { value: 'maybe', label: 'Maybe someday' },
      { value: 'yes', label: 'Yes, that’s a real goal' },
    ],
  },
  {
    key: 'uncertainty',
    question: 'How comfortable are you with uncertain income or job security?',
    options: [
      { value: 'low', label: 'I need steady and predictable' },
      { value: 'medium', label: 'Some ups and downs are okay' },
      { value: 'high', label: 'I’m comfortable with risk for a bigger upside' },
    ],
  },
];
