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
 * One navigation structure, shown two ways: dropdowns on wide screens and a single
 * sectioned sheet on narrow ones. Groups follow the journey: know yourself, find
 * possibilities, test them, decide.
 */
export const NAV: NavGroup[] = [
  {
    id: 'discover',
    label: 'Discover',
    tagline: 'Know yourself',
    items: [
      { to: '/now', label: 'Where you are now', blurb: 'Your current job, pay, education and skills, and moves you could make from here', icon: 'briefcase' },
      { to: '/discover', label: 'Assessments', blurb: 'Interests, skills, aptitudes, work style, values and lifestyle', icon: 'discover', match: ['/discover/'] },
      { to: '/purpose', label: 'Purpose', blurb: 'Your gifts, who you want to serve and what you care about', icon: 'purpose', match: ['/purpose/'] },
      { to: '/purpose/journal', label: 'Journal', blurb: 'Private reflections, kept on this device', icon: 'journal' },
    ],
  },
  {
    id: 'explore',
    label: 'Explore',
    tagline: 'Find possibilities',
    items: [
      { to: '/careers', label: 'Careers', blurb: 'Search every career, matched to you with the reasons shown', icon: 'careers', match: ['/careers/'] },
      { to: '/places', label: 'Places and cost of living', blurb: 'Where you live or might move, what pay is worth there, college costs by state', icon: 'pin' },
      { to: '/compare/education', label: 'Training costs and payoff', blurb: 'College, trade school, apprenticeships: cost, debt and break-even', icon: 'money' },
      { to: '/compare', label: 'Compare careers', blurb: 'Up to three careers side by side', icon: 'compare', match: [] },
    ],
  },
  {
    id: 'try',
    label: 'Try it',
    tagline: 'Test the work',
    items: [
      { to: '/try', label: 'Career simulations', blurb: 'Short, realistic decisions from real jobs', icon: 'try', match: ['/try/'] },
      { to: '/try/experiments', label: 'Real-world experiments', blurb: 'Small tests in real life: shadow, volunteer, build', icon: 'flask', match: ['/try/experiments/'] },
      { to: '/network', label: 'Talk to people near you', blurb: 'Associations, apprenticeships, interview scripts and practice', icon: 'mail' },
    ],
  },
  {
    id: 'path',
    label: 'My Path',
    tagline: 'Decide your next step',
    items: [
      { to: '/path', label: 'Paths I’m testing', blurb: 'Evidence, next best step and your roadmap', icon: 'path' },
      { to: '/path/report', label: 'My Called report', blurb: 'A summary to share with a parent, counselor or mentor', icon: 'print' },
      { to: '/achievements', label: 'Your evidence and achievements', blurb: 'Evidence meters, levels, badges and quests', icon: 'spark' },
      { to: '/account/ai-export', label: 'Take your evidence to an AI', blurb: 'A privacy-reduced summary for your own assistant', icon: 'copy' },
    ],
  },
];

export const ACCOUNT_NAV: NavItem[] = [
  { to: '/account', label: 'Account', blurb: 'Your profile, progress and backups', icon: 'user' },
  { to: '/data', label: 'Privacy and data', blurb: 'Journey code, export, import and delete', icon: 'lock' },
  { to: '/counselor', label: 'For counselors', blurb: 'Receive reports people choose to share', icon: 'about' },
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
  if (ACCOUNT_NAV.includes(item)) return 'account';
  return NAV.find((g) => g.items.includes(item))?.id;
}
