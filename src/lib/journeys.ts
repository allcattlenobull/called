/**
 * Journeys are organized around why someone came to Called, not around Called's pages.
 * Four front doors (plus a link for people helping someone else) lead to five guided journeys.
 * Steps check themselves off from evidence already in the profile, so the next step is always known.
 */
import type { IconName } from '../components/Icon';
import type { Profile } from '../types';

export type Goal = 'purpose' | 'fit' | 'change' | 'lookup' | 'decide';

export interface JourneyStep {
  id: string;
  label: string;
  why: string;
  to: string;
  cta: string;
  done: (p: Profile) => boolean;
}

export interface Journey {
  goal: Goal;
  /** The front door, in the person's own words. */
  door: string;
  /** The question they're asking. */
  question: string;
  blurb: string;
  icon: IconName;
  steps: JourneyStep[];
  /** Where to go after finishing: the natural next journey. */
  after: { label: string; to: string; goal?: Goal };
}

const anyDone = (p: Profile) => p.experiments.some((e) => e.status === 'done');
const talked = (p: Profile) => p.interviews > 0 || (p.conversations?.length ?? 0) > 0 || p.experiments.some((e) => e.experimentId === 'interview-pro' && e.status === 'done');
const triedSomething = (p: Profile) => p.simulations.length > 0 || anyDone(p) || talked(p);

export const JOURNEYS: Record<Goal, Journey> = {
  purpose: {
    goal: 'purpose',
    door: 'Discover my gifts and purpose',
    question: 'What are my gifts, and what am I made for?',
    blurb: 'Learn what gifts are, notice yours, hear what others see, and put your purpose into words.',
    icon: 'purpose',
    steps: [
      { id: 'learn', label: 'Learn what gifts are', why: 'A short guide to gifts: how they show up, how they differ from skills, and why no gift is more valuable than another.', to: '/gifts', cta: 'Read the guide', done: (p) => !!p.drafts['seen:gifts-guide'] || p.gifts.length > 0 },
      { id: 'gifts', label: 'Name your gifts', why: 'Choose the strengths that show up again and again. The ones that repeat matter most.', to: '/purpose/gifts', cta: 'Choose my gifts', done: (p) => p.gifts.length >= 2 },
      { id: 'others', label: 'Ask what others see in you', why: 'We’re not always the best judges of our own gifts. Two or three people who know you will notice things you miss.', to: '/purpose/feedback', cta: 'Record what others see', done: (p) => p.feedback.length >= 1 },
      { id: 'serve', label: 'Who you want to help and what you care about', why: 'Gifts point somewhere. Notice the people and problems you can’t walk past.', to: '/purpose/serve', cta: 'Choose who I want to help', done: (p) => p.serves.length > 0 && p.problems.length > 0 },
      { id: 'use', label: 'Use a gift this month', why: 'Try one small, real way to use a gift: teach someone, serve, volunteer, make something.', to: '/try/experiments', cta: 'Pick an experiment', done: (p) => anyDone(p) || p.experiences.length > 0 },
      { id: 'statement', label: 'Write your purpose statement', why: 'A first draft of where your gifts and the world’s needs might meet. It will change, and that’s fine.', to: '/purpose/statement', cta: 'Write my statement', done: (p) => p.statements.length > 0 },
    ],
    after: { label: 'See careers where your gifts show up', to: '/careers', goal: 'fit' },
  },
  fit: {
    goal: 'fit',
    door: 'Find careers that fit me',
    question: 'What career would fit who I am?',
    blurb: 'Three short assessments, a short list of careers with the reasons they fit, then try the one you’re most curious about.',
    icon: 'discover',
    steps: [
      { id: 'interests', label: 'What you enjoy', why: 'A 4-minute interests check: the fastest way to see which kinds of work pull at you.', to: '/discover/interests', cta: 'Start interests', done: (p) => !!p.completed.interests },
      { id: 'values', label: 'What matters to you', why: 'Sort what you value in work, like helping, stability or independence.', to: '/discover/values', cta: 'Sort my values', done: (p) => !!p.completed.values },
      { id: 'lifestyle', label: 'The life you want', why: 'Training time, money, schedule and where you’d live all shape what fits.', to: '/discover/lifestyle', cta: 'Describe my life', done: (p) => !!p.completed.lifestyle },
      { id: 'shortlist', label: 'Save 2 or 3 careers that fit', why: 'Your matches show the reasons each one fits, and the tensions too. Save the ones worth a closer look.', to: '/careers', cta: 'See my matches', done: (p) => p.saved.length >= 2 },
      { id: 'try', label: 'Try one', why: 'A short simulation or one conversation with someone in the work tells you more than any quiz.', to: '/try', cta: 'Try a career', done: triedSomething },
      { id: 'path', label: 'Pick a path to keep testing', why: 'Exploring isn’t committing. Called will suggest your next best step.', to: '/path', cta: 'Explore a path', done: (p) => p.roadmaps.length > 0 },
    ],
    after: { label: 'Compare the options you’re weighing', to: '/compare', goal: 'decide' },
  },
  change: {
    goal: 'change',
    door: 'Find careers that fit me',
    question: 'What can I move into from where I am, without starting over?',
    blurb: 'Called credits your job, pay, education and skills, then shows realistic moves.',
    icon: 'briefcase',
    steps: [
      { id: 'now', label: 'Tell Called where you are now', why: 'Your job, pay, education and skills. Called credits what you already have.', to: '/now', cta: 'Add where I am now', done: (p) => !!p.current?.education },
      { id: 'core', label: 'What you enjoy and what matters to you', why: 'Two short assessments so your moves fit you, not just your résumé.', to: '/discover/interests', cta: 'Start interests', done: (p) => !!p.completed.interests && !!p.completed.values },
      { id: 'moves', label: 'Save 2 realistic next moves', why: 'Moves are ranked by skills that carry over, school still needed and pay compared with now.', to: '/now#moves-h', cta: 'See my next moves', done: (p) => p.saved.length >= 2 },
      { id: 'talk', label: 'Talk to someone in that work', why: 'One conversation near you answers what a job description can’t.', to: '/network', cta: 'Find people near me', done: talked },
      { id: 'plan', label: 'Plan the switch', why: 'What it would cost against your current pay, and a timeline that fits around work.', to: '/path', cta: 'Plan my switch', done: (p) => p.roadmaps.length > 0 && p.roiChecked.length > 0 },
    ],
    after: { label: 'Compare places and cost of living', to: '/places', goal: 'decide' },
  },
  lookup: {
    goal: 'lookup',
    door: 'Look up a career',
    question: 'What is this career really like, and where is it good?',
    blurb: 'Go straight to any career: what the work is really like, pay, training, and how AI is changing it. No setup.',
    icon: 'search',
    steps: [
      { id: 'find', label: 'Find a career', why: 'Search by title, or a close spelling, or what you’d like to do.', to: '/careers', cta: 'Search careers', done: (p) => p.careerViews.length > 0 },
      { id: 'reality', label: 'Read the reality check', why: 'What people imagine compared with what the work is really like.', to: '/careers', cta: 'Open a career', done: (p) => Object.keys(p.reality).length > 0 },
      { id: 'places', label: 'Compare pay and cost of living', why: 'See what the work pays in the places you’re considering, and what that pay is worth there.', to: '/places', cta: 'Compare places', done: (p) => !!p.location && (p.location.considering.length > 0 || !!p.location.place) },
      { id: 'try', label: 'Try it', why: 'A short simulation or a conversation with someone who does the work.', to: '/try', cta: 'Try a career', done: triedSomething },
    ],
    after: { label: 'See if it fits you', to: '/discover/interests', goal: 'fit' },
  },
  decide: {
    goal: 'decide',
    door: 'Decide between options',
    question: 'Which of my options should I choose?',
    blurb: 'Put careers, schools and places side by side: fit, pay where you’d live, school, cost and debt.',
    icon: 'compare',
    steps: [
      { id: 'options', label: 'Add the options you’re weighing', why: 'Save two or three careers. You can add places and schools next.', to: '/careers', cta: 'Add careers', done: (p) => p.saved.length >= 2 },
      { id: 'compare', label: 'Compare them side by side', why: 'Fit, pay, training, debt and outlook in one view.', to: '/compare', cta: 'Compare', done: (p) => p.comparisons > 0 },
      { id: 'money', label: 'Check costs and payoff', why: 'Tuition by state, debt, and how long it takes to earn it back.', to: '/compare/education', cta: 'Check costs', done: (p) => p.roiChecked.length > 0 },
      { id: 'places', label: 'Compare where you’d live', why: 'Pay and cost of living in each place you’re considering.', to: '/places', cta: 'Compare places', done: (p) => (p.location?.considering.length ?? 0) > 0 },
      { id: 'evidence', label: 'Fill the biggest gap', why: 'Try the work or talk to someone, so the decision isn’t just numbers.', to: '/try', cta: 'Get real evidence', done: triedSomething },
      { id: 'lead', label: 'Choose a leading path and share it', why: 'Make one option your leading path, and share a report with someone you trust.', to: '/path', cta: 'Choose my path', done: (p) => p.roadmaps.some((r) => r.stage === 'leading') },
    ],
    after: { label: 'Share your Called report', to: '/path/report' },
  },
};

/** The four front doors. “Find careers that fit me” branches into fit or change with one question. */
export const DOORS: Goal[] = ['purpose', 'fit', 'lookup', 'decide'];

export function journeyFor(p: Profile): Journey | undefined {
  return p.goal ? JOURNEYS[p.goal] : undefined;
}

export function journeyProgress(j: Journey, p: Profile) {
  const done = j.steps.filter((s) => s.done(p));
  const next = j.steps.find((s) => !s.done(p));
  return { done: done.length, total: j.steps.length, next, index: next ? j.steps.indexOf(next) : j.steps.length, complete: !next };
}
