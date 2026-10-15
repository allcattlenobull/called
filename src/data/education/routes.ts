import type { RouteId } from '../../types';

/**
 * Education and training routes with rough cost assumptions.
 * Tuition figures are rounded from College Board "Trends in College Pricing 2024" published prices
 * (tuition and fees only, before grants). Living costs vary too much by situation to bake in;
 * the ROI tool lets users add them. Every figure here is an editable starting assumption, not a quote.
 */
export interface Route {
  id: RouteId;
  label: string;
  summary: string;
  typicalYears: string;
  /** Annual tuition + fees estimate, USD. Negative means you are typically paid while training. */
  annualCost: number;
  paidWhileTraining: boolean;
  goodFor: string[];
  watchOut: string[];
}

export const ROUTE_DETAILS: Route[] = [
  {
    id: 'college',
    label: 'Four-year college',
    summary: 'A bachelor’s degree at a public or private university.',
    typicalYears: '4 to 5 years',
    annualCost: 11600,
    paidWhileTraining: false,
    goodFor: ['Careers that require a bachelor’s (teaching, engineering, nursing BSN, accounting)', 'Exploring several subjects', 'Professional networks'],
    watchOut: ['Average time to degree is often over 4 years', 'Private schools list around $43,000 a year before aid', 'Debt without finishing is the worst outcome'],
  },
  {
    id: 'communityCollege',
    label: 'Community college',
    summary: 'Two-year associate degrees, certificates, and transfer pathways to universities.',
    typicalYears: '1 to 2 years',
    annualCost: 4050,
    paidWhileTraining: false,
    goodFor: ['Nursing (ADN), dental hygiene, IT and many technical careers', 'Cutting the cost of a bachelor’s by transferring', 'Living at home while you decide'],
    watchOut: ['Check that credits transfer before you take them', 'Programs like nursing can have waitlists'],
  },
  {
    id: 'certification',
    label: 'Certification',
    summary: 'Short, focused credentials such as CompTIA, CNA, EMT, real estate or CDL.',
    typicalYears: 'Weeks to 1 year',
    annualCost: 2500,
    paidWhileTraining: false,
    goodFor: ['Getting into the workforce quickly', 'Testing a field before bigger investments', 'Stacking credentials over time'],
    watchOut: ['Some for-profit programs overcharge; compare with community college prices', 'Check that employers in your area value the credential'],
  },
  {
    id: 'tradeSchool',
    label: 'Trade school',
    summary: 'Hands-on technical programs for welding, HVAC, automotive and more.',
    typicalYears: '6 months to 2 years',
    annualCost: 10000,
    paidWhileTraining: false,
    goodFor: ['Building hands-on skills fast', 'Preparing for an apprenticeship'],
    watchOut: ['Private trade schools vary widely in price and quality', 'Ask for job placement rates'],
  },
  {
    id: 'apprenticeship',
    label: 'Apprenticeship',
    summary: 'Paid on-the-job training plus classroom instruction, often 3 to 5 years.',
    typicalYears: '3 to 5 years (paid)',
    annualCost: 1000,
    paidWhileTraining: true,
    goodFor: ['Earning while learning', 'Electricians, plumbers, lineworkers, carpenters', 'Graduating with little or no debt'],
    watchOut: ['Competitive application windows', 'Early pay is a fraction of journey-level pay', 'Physical demands'],
  },
  {
    id: 'military',
    label: 'Military',
    summary: 'Enlisted or officer service with technical training and education benefits.',
    typicalYears: '4+ year commitment',
    annualCost: 0,
    paidWhileTraining: true,
    goodFor: ['Technical training in IT, cyber, medicine, logistics and trades', 'GI Bill education benefits', 'Leadership experience'],
    watchOut: ['A binding service commitment', 'You may not get your first choice of job', 'Talk to veterans, not only recruiters'],
  },
  {
    id: 'entrepreneurship',
    label: 'Start a business',
    summary: 'Learn by building something of your own, often after gaining experience.',
    typicalYears: 'Ongoing',
    annualCost: 0,
    paidWhileTraining: false,
    goodFor: ['People with high tolerance for uncertainty', 'Trades and services with low startup costs'],
    watchOut: ['Income is unpredictable', 'Starting costs and risk are real', 'Experience in the industry first improves your odds'],
  },
  {
    id: 'directToWork',
    label: 'Straight to work',
    summary: 'Entry-level jobs with on-the-job training.',
    typicalYears: 'Start now',
    annualCost: 0,
    paidWhileTraining: true,
    goodFor: ['Earning immediately', 'Learning what you like before investing in school', 'Sales, food service, some IT and healthcare support'],
    watchOut: ['Some ceilings without credentials later', 'Look for employers who pay for training'],
  },
  {
    id: 'graduate',
    label: 'Graduate school',
    summary: 'Master’s, doctoral or professional degrees after a bachelor’s.',
    typicalYears: '2 to 4 more years',
    annualCost: 20000,
    paidWhileTraining: false,
    goodFor: ['Licensed professions: PA, PT, counseling, law, architecture', 'Research careers'],
    watchOut: ['Graduate loans have higher rates and fewer protections', 'Work experience first can clarify whether it’s worth it'],
  },
];

export const ROUTE_BY_ID = Object.fromEntries(ROUTE_DETAILS.map((r) => [r.id, r])) as Record<RouteId, Route>;

/** Rough assumptions used by the education ROI model. Users can change them in the tool. */
export const ROI_DEFAULTS = {
  /** What a recent high school graduate might earn per year working full time instead of studying. */
  alternativeEarnings: 35000,
  /** Annual living costs while studying away from home (not included in tuition). */
  livingCosts: 0,
  /** Share of the education cost borrowed. */
  borrowedShare: 0.5,
  /** Federal undergraduate loan rate, rounded. */
  loanRate: 0.065,
  /** Years used to repay. */
  repaymentYears: 10,
  /** Typical starting pay as a share of the occupation median. */
  startingShare: 0.75,
};

export const ROI_SOURCES = [
  { label: 'College Board, Trends in College Pricing', url: 'https://research.collegeboard.org/trends/college-pricing' },
  { label: 'College Scorecard (compare specific schools)', url: 'https://collegescorecard.ed.gov/' },
  { label: 'Apprenticeship.gov', url: 'https://www.apprenticeship.gov/' },
  { label: 'CareerOneStop training finder', url: 'https://www.careeronestop.org/FindTraining/find-training.aspx' },
];
