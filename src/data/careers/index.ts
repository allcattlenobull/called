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
  ai: 'Eloundou, Manning, Mishkin & Rock, “GPTs are GPTs,” Science (2024), using O*NET task statements',
};

/** SOC codes that O*NET OnLine files under a different (current) O*NET-SOC code. */
const ONET_CODE: Record<string, string> = {
  '29-2010': '29-2011.00',
  '25-1099': '25-1199.00',
  '21-1018': '21-1014.00',
  '25-2052': '25-2056.00',
};

export function onetUrl(soc?: string): string | undefined {
  if (!soc) return undefined;
  const code = ONET_CODE[soc] ?? (soc.length === 7 ? `${soc}.00` : soc);
  return `https://www.onetonline.org/link/summary/${code}`;
}

/** SOC codes that BLS wage statistics publish under a combined code. */
const BLS_CODE: Record<string, string> = { '31-1122': '31-1120' };

/** The BLS occupation profile: national, state and metro wages for the year Called’s figures come from. */
export function blsUrl(soc?: string): string | undefined {
  if (!soc) return undefined;
  const code = (BLS_CODE[soc] ?? soc).replace('-', '');
  const year = DATA_SOURCES.wagesAsOf.match(/(20\d\d)/)?.[1] ?? '2025';
  return `https://data.bls.gov/oesprofile/?year=${year}&major_group=${code.slice(0, 2)}0000&occupation=${code}&measure=01&areas=INDUSTRY,STATE,MSA`;
}
