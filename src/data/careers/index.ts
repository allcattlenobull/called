import type { Career } from '../../types';
import { healthcare } from './healthcare';
import { technology } from './technology';
import { businessFinance } from './business-finance';
import { educationHuman } from './education-human';
import { trades } from './trades';
import { publicService } from './public-service';
import { creativeStem } from './creative-stem';
import { operations } from './operations';
import { moreHealthcare } from './more-healthcare';
import { moreTech, moreBusiness } from './more-tech-business';
import { morePeople } from './more-people';
import { moreTrades, moreOps } from './more-trades-ops';
import { moreCreative, moreStem } from './more-creative-stem';
import wageOverrides from './overrides/wages.json';

interface WageOverride {
  median: number;
  low?: number;
  high?: number;
}

const overrides = (wageOverrides as { asOf: string | null; wages: Record<string, WageOverride> }).wages;

function applyOverrides(career: Career): Career {
  const o = career.soc ? overrides[career.soc] : undefined;
  if (!o) return career;
  return {
    ...career,
    pay: { ...career.pay, median: o.median, low: o.low ?? career.pay.low, high: o.high ?? career.pay.high },
  };
}

/** Every career, alphabetized. Add new careers in a family file; this index never needs editing. */
export const CAREERS: Career[] = [
  ...healthcare,
  ...technology,
  ...businessFinance,
  ...educationHuman,
  ...trades,
  ...publicService,
  ...creativeStem,
  ...operations,
  ...moreHealthcare,
  ...moreTech,
  ...moreBusiness,
  ...morePeople,
  ...moreTrades,
  ...moreOps,
  ...moreCreative,
  ...moreStem,
]
  .map(applyOverrides)
  .sort((a, b) => a.title.localeCompare(b.title));

export const CAREER_BY_ID: Record<string, Career> = Object.fromEntries(CAREERS.map((c) => [c.id, c]));

export const DATA_SOURCES = {
  wagesAsOf: (wageOverrides as { asOf: string | null }).asOf ?? 'May 2024 (entered by hand)',
  wages: 'U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics and Occupational Outlook Handbook',
  outlook: 'U.S. Bureau of Labor Statistics, Employment Projections 2023 to 2033',
  tasks: 'Written by the Called team, informed by O*NET OnLine task and work-context data',
};

export function onetUrl(soc?: string): string | undefined {
  if (!soc) return undefined;
  const code = soc.length === 7 ? `${soc}.00` : soc;
  return `https://www.onetonline.org/link/summary/${code}`;
}

export function blsUrl(soc?: string): string | undefined {
  if (!soc) return undefined;
  return `https://www.bls.gov/oes/current/oes${soc.replace('-', '')}.htm`;
}
