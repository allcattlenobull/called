import stateMarket from '../data/market/state-market.json';
import type { Career, Profile } from '../types';
import { WAGE_SOURCE, homePlace, localPay } from './places';

export type MarketScope = 'metro' | 'state' | 'national';

export interface MarketResult {
  pay: number;
  payScope: MarketScope;
  payLabel: string;
  paySource: string;
  outlook: number | null;
  outlookScope: MarketScope;
  outlookLabel: string;
  outlookSource: string;
  asOf?: string | null;
  state?: string;
}

interface StateMarketRecord {
  pay?: { median: number; low?: number; high?: number };
  outlook?: { growth: number; annualOpenings?: number; baseYear?: number; projectionYear?: number };
}

interface MarketFile {
  asOf: string | null;
  source: string;
  states: Record<string, Record<string, StateMarketRecord>>;
}

const DATA = stateMarket as unknown as MarketFile;
const STATES: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
};

export function stateCode(state?: string): string | undefined {
  if (!state) return undefined;
  const normalized = state.trim().toLowerCase();
  return normalized.length === 2 ? normalized.toUpperCase() : STATES[normalized];
}

function outlookLabel(growth: number | null, scope: MarketScope): string {
  if (growth === null) return scope === 'national' ? 'U.S. outlook category' : 'Outlook unavailable';
  return `${growth > 0 ? '+' : ''}${growth}% projected growth`;
}

/**
 * One market lookup keeps geography policy out of components and the matching engine.
 * Metro is deliberately a future slot: no metro record is used until an official source
 * is added to the generated file.
 */
export function marketFor(career: Career, profile: Profile): MarketResult {
  const code = stateCode(profile.location?.state);
  // Official BLS metro and state medians (generated) come first.
  const place = homePlace(profile);
  const local = place ? localPay(career, place) : undefined;
  if (local && local.scope !== 'national') {
    return {
      pay: local.pay,
      payScope: local.scope,
      payLabel: local.label.replace(/ median$/, ' median pay'),
      paySource: `${WAGE_SOURCE.source}, ${WAGE_SOURCE.asOf ?? 'latest'}`,
      outlook: null,
      outlookScope: 'national',
      outlookLabel: outlookLabel(null, 'national'),
      outlookSource: 'U.S. Bureau of Labor Statistics, Employment Projections',
      asOf: WAGE_SOURCE.asOf,
      state: place?.state ?? code,
    };
  }
  const record = code && career.soc ? DATA.states?.[code]?.[career.soc] : undefined;
  const placeName = [profile.location?.city, code].filter(Boolean).join(', ');
  if (record?.pay?.median) {
    const growth = record.outlook?.growth ?? null;
    return {
      pay: record.pay.median,
      payScope: 'state',
      payLabel: code ? `${placeName || code} median pay` : 'State median pay',
      paySource: DATA.source,
      outlook: growth,
      outlookScope: record.outlook ? 'state' : 'national',
      outlookLabel: outlookLabel(growth, record.outlook ? 'state' : 'national'),
      outlookSource: record.outlook ? DATA.source : 'U.S. Bureau of Labor Statistics, Employment Projections',
      asOf: DATA.asOf,
      state: code,
    };
  }
  return {
    pay: career.pay.median,
    payScope: 'national',
    payLabel: 'U.S. median pay',
    paySource: 'U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics',
    outlook: null,
    outlookScope: 'national',
    outlookLabel: outlookLabel(null, 'national'),
    outlookSource: 'U.S. Bureau of Labor Statistics, Employment Projections',
    asOf: null,
    state: code,
  };
}

export function dataSourceLabel(market: MarketResult): string {
  return market.payScope === 'metro' ? 'Metro estimate' : market.payScope === 'state' ? 'State estimate' : 'National fallback';
}
