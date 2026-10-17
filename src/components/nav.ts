import type { IconName } from './Icon';

export interface NavItem {
  to: string;
  label: string;
  blurb: string;
  icon: IconName;
  /** Extra path prefixes that count as being in this item. */
  match?: string[];
}

export interface NavGroup {
  id: string;
  label: string;
  /** What this stage of the journey is for. */
  tagline: string;
  items: NavItem[];
}

/**
 * One navigation structure, shown two ways: dropdowns on wide screens and one sectioned menu on
 * phones. It's organized by what people come to do (see src/lib/journeys.ts), not by feature:
 * My journey (home) · Purpose & gifts · Careers · My plan, with About me on the right.
 */
export const NAV: NavGroup[] = [
  {
    id: 'purpose',
    label: 'Purpose & gifts',
    tagline: 'Who you’re made to be',
    items: [
      { to: '/gifts', label: 'Understanding gifts', blurb: 'What gifts are, how they show up, and what the Bible says about them', icon: 'info' },
      { to: '/purpose/gifts', label: 'My gifts', blurb: 'Choose the strengths that show up again and again', icon: 'spark' },
      { to: '/purpose/statement', label: 'My purpose statement', blurb: 'Where your gifts and the world’s needs might meet', icon: 'journal' },
      { to: '/purpose', label: 'Everything in purpose', blurb: 'Who you want to help, what others see in you, experiences, principles and journal', icon: 'purpose', match: ['/purpose/'] },
    ],
  },
  {
    id: 'careers',
    label: 'Careers',
    tagline: 'Explore and try the work',
    items: [
      { to: '/careers', label: 'Find careers', blurb: 'Search any career, or see your matches with the reasons shown', icon: 'careers', match: ['/careers/'] },
      { to: '/try', label: 'Try a career', blurb: 'Short, realistic simulations from real jobs', icon: 'try', match: ['/try/'] },
      { to: '/try/experiments', label: 'Real-world experiments', blurb: 'Small tests in real life: shadow, volunteer, build', icon: 'flask', match: ['/try/experiments/'] },
      { to: '/network', label: 'Talk to people near you', blurb: 'Groups, programs and scripts for a first conversation', icon: 'mail' },
      { to: '/compare', label: 'Compare careers', blurb: 'Up to three careers side by side', icon: 'compare' },
    ],
  },
  {
    id: 'plan',
    label: 'My plan',
    tagline: 'Decide your next step',
    items: [
      { to: '/path', label: 'Paths I’m testing', blurb: 'Your evidence, next best step and roadmap', icon: 'path' },
      { to: '/now', label: 'Next moves from where I am', blurb: 'Credit for your job, pay, education and skills', icon: 'briefcase' },
      { to: '/compare/education', label: 'Training costs and payoff', blurb: 'College, trade school or apprenticeship: cost, debt and break-even', icon: 'money' },
      { to: '/places', label: 'Places and cost of living', blurb: 'Pay, prices and college costs where you might live', icon: 'pin' },
      { to: '/path/report', label: 'My Called report', blurb: 'A summary to share with someone you trust', icon: 'print' },
    ],
  },
];

/** “About me”: the person’s own profile, results and settings. */
export const ACCOUNT_NAV: NavItem[] = [
  { to: '/me', label: 'About me', blurb: 'Your compass, what you’ve learned and what you’ve done', icon: 'user' },
  { to: '/discover', label: 'My assessments', blurb: 'Interests, values, the life you want, skills and more', icon: 'discover', match: ['/discover/'] },
  { to: '/achievements', label: 'Evidence and achievements', blurb: 'Evidence meters, levels and badges', icon: 'spark' },
  { to: '/account', label: 'Account', blurb: 'Your member ID, backups and sharing', icon: 'lock', match: ['/account/'] },
  { to: '/data', label: 'Privacy and data', blurb: 'Journey code, export, import and delete', icon: 'lock' },
];

/** The most specific nav item for a path (so /purpose/journal highlights Journal, not Purpose). */
export function activeItem(pathname: string): NavItem | undefined {
  const all = [...NAV.flatMap((g) => g.items), ...ACCOUNT_NAV];
  const exact = all.find((i) => i.to === pathname);
  if (exact) return exact;
  return all
    .filter((i) => (i.match ?? []).some((m) => pathname.startsWith(m)))
    .sort((a, b) => b.to.length - a.to.length)[0];
}

export function activeGroup(pathname: string): string | undefined {
  const item = activeItem(pathname);
  if (!item) return undefined;
  if (ACCOUNT_NAV.includes(item)) return 'me';
  return NAV.find((g) => g.items.includes(item))?.id;
}
