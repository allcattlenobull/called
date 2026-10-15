/**
 * Places: where someone lives now, where they might move, and what money is worth there.
 *
 * Data comes from scripts/update-location-data.mjs (BEA Regional Price Parities, College Scorecard
 * and BLS state and metro wages). Everything degrades gracefully: when a value is missing, Called
 * says so and falls back to the national figure rather than guessing.
 */
import placesJson from '../data/market/places.json';
import wagesJson from '../data/market/local-wages.json';
import type { Career, Profile } from '../types';

export interface CollegeCosts {
  public4InState: number | null;
  public4OutOfState: number | null;
  public4RoomBoard: number | null;
  public2InState: number | null;
  schools4?: number;
  schools2?: number;
}

interface StateRecord {
  name: string;
  rpp?: number;
  rppHousing?: number | null;
  college?: CollegeCosts;
}

interface MetroRecord {
  name: string;
  states: string[];
  rpp?: number;
  rppHousing?: number | null;
  population?: number | null;
  /** One of the large metros Called always tracks pay for. */
  core?: boolean;
}

/** Bigger, better-covered metros first: by population when known, otherwise tracked metros first, then by name. */
function metroRank(a: MetroRecord, b: MetroRecord): number {
  return (b.population ?? 0) - (a.population ?? 0) || Number(!!b.core) - Number(!!a.core) || a.name.localeCompare(b.name);
}

interface PlacesFile {
  sources: { costOfLiving?: string; college?: string };
  updated?: string;
  states: Record<string, StateRecord>;
  metros: Record<string, MetroRecord>;
}

interface WagesFile {
  asOf: string | null;
  source: string;
  socs: string[];
  states: Record<string, (number | null)[]>;
  metros: Record<string, (number | null)[]>;
}

export const PLACE_DATA = placesJson as unknown as PlacesFile;
const WAGES = wagesJson as unknown as WagesFile;
const SOC_INDEX = new Map(WAGES.socs.map((s, i) => [s, i]));

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};
const NAME_TO_CODE = Object.fromEntries(Object.entries(STATE_NAMES).map(([c, n]) => [n.toLowerCase(), c]));

export function toStateCode(text?: string): string | undefined {
  if (!text) return undefined;
  const t = text.trim();
  if (/^[A-Za-z]{2}$/.test(t) && STATE_NAMES[t.toUpperCase()]) return t.toUpperCase();
  return NAME_TO_CODE[t.toLowerCase()];
}

export interface Place {
  /** 'GA' for a state, 'm12060' for a metro area. */
  id: string;
  kind: 'state' | 'metro';
  name: string;
  /** Short label, e.g. "Atlanta area, GA" or "Georgia". */
  label: string;
  state: string;
  rpp?: number;
  rppHousing?: number | null;
}

function metroPlace(cbsa: string): Place | undefined {
  const m = PLACE_DATA.metros[cbsa];
  if (!m) return undefined;
  const city = m.name.split(', ')[0].split('-')[0];
  return { id: `m${cbsa}`, kind: 'metro', name: m.name, label: `${city} area, ${m.states[0] ?? ''}`.replace(/, $/, ''), state: m.states[0], rpp: m.rpp, rppHousing: m.rppHousing };
}

function statePlace(code: string): Place | undefined {
  const s = PLACE_DATA.states[code];
  const name = s?.name ?? STATE_NAMES[code];
  if (!name) return undefined;
  return { id: code, kind: 'state', name, label: name, state: code, rpp: s?.rpp, rppHousing: s?.rppHousing };
}

export function placeById(id: string): Place | undefined {
  return id.startsWith('m') ? metroPlace(id.slice(1)) : statePlace(id);
}

/** Metro areas sorted by population, for pickers. */
export function metroOptions(state?: string): Place[] {
  return Object.entries(PLACE_DATA.metros)
    .filter(([, m]) => !state || m.states.includes(state))
    .sort((a, b) => metroRank(a[1], b[1]))
    .map(([cbsa]) => metroPlace(cbsa)!)
    .filter(Boolean);
}

/**
 * Turn what a person typed ("Atlanta, GA", "Denver, Colorado", "Texas", "m12060") into a place.
 * A city inside a known metro area resolves to that metro; otherwise to its state.
 */
export function resolvePlace(text?: string, stateHint?: string): Place | undefined {
  if (!text?.trim() && !stateHint) return undefined;
  const raw = (text ?? '').trim();
  if (/^m\d{5}$/.test(raw)) return metroPlace(raw.slice(1));
  const parts = raw.split(',').map((x) => x.trim()).filter(Boolean);
  const onlyState = parts.length === 1 ? toStateCode(parts[0]) : undefined;
  if (onlyState && !stateHint) return statePlace(onlyState);
  const city = (onlyState ? '' : parts[0] ?? '').toLowerCase();
  const state = toStateCode(parts[1]) ?? toStateCode(stateHint) ?? onlyState;
  if (city) {
    const hit = Object.entries(PLACE_DATA.metros)
      .filter(([, m]) => (!state || m.states.includes(state)) && m.name.split(', ')[0].toLowerCase().split('-').some((c) => c === city || c.startsWith(`${city} `)))
      .sort((a, b) => metroRank(a[1], b[1]))[0];
    if (hit) return metroPlace(hit[0]);
  }
  return state ? statePlace(state) : undefined;
}

export function homePlace(p: Profile): Place | undefined {
  const loc = p.location;
  if (!loc) return undefined;
  if (loc.place) {
    const chosen = placeById(loc.place);
    if (chosen) return chosen;
  }
  return resolvePlace(loc.city ? `${loc.city}${loc.state ? `, ${loc.state}` : ''}` : loc.state, loc.state);
}

export function consideredPlaces(p: Profile): Place[] {
  const home = homePlace(p);
  const seen = new Set(home ? [home.id] : []);
  return (p.location?.considering ?? [])
    .map((t) => resolvePlace(t))
    .filter((x): x is Place => !!x && !seen.has(x.id) && (seen.add(x.id), true));
}

/* ---------- Pay ---------- */

export interface LocalPay {
  pay: number;
  scope: 'metro' | 'state' | 'national';
  /** e.g. "Atlanta area median" */
  label: string;
}

function wageAt(table: Record<string, (number | null)[]>, key: string, soc?: string): number | null {
  if (!soc) return null;
  const i = SOC_INDEX.get(soc);
  return i === undefined ? null : (table[key]?.[i] ?? null);
}

/** Median pay for a career in a place: metro, then state, then the U.S. median. */
export function localPay(c: Career, place?: Place): LocalPay {
  if (place?.kind === 'metro') {
    const v = wageAt(WAGES.metros, place.id.slice(1), c.soc);
    if (v) return { pay: v, scope: 'metro', label: `${place.label} median` };
  }
  if (place) {
    const v = wageAt(WAGES.states, place.state, c.soc);
    if (v) return { pay: v, scope: 'state', label: `${STATE_NAMES[place.state] ?? place.state} median` };
  }
  return { pay: c.pay.median, scope: 'national', label: 'U.S. median' };
}

export const WAGE_SOURCE = { asOf: WAGES.asOf, source: WAGES.source };
export const hasLocalWages = WAGES.socs.length > 0;

/* ---------- Cost of living ---------- */

export const hasCostOfLiving = Object.values(PLACE_DATA.states).some((s) => s.rpp);
export const COST_SOURCE = PLACE_DATA.sources.costOfLiving ?? 'U.S. Bureau of Economic Analysis, Regional Price Parities';

/** What a salary buys there, in average-U.S. dollars. RPP 110 means prices are 10% above average. */
export function inUsDollars(amount: number, rpp?: number): number | undefined {
  return rpp ? Math.round(amount / (rpp / 100)) : undefined;
}

/** How a place compares with the U.S. average, in words. */
export function costWords(rpp?: number): string {
  if (!rpp) return 'No cost-of-living data yet';
  const d = Math.round(rpp - 100);
  if (Math.abs(d) <= 2) return 'About the U.S. average';
  return `${Math.abs(d)}% ${d > 0 ? 'more expensive' : 'less expensive'} than average`;
}

/** Equivalent salary: what you'd need in `to` to live like `amount` does in `from`. */
export function equivalentSalary(amount: number, from?: Place, to?: Place): number | undefined {
  if (!from?.rpp || !to?.rpp) return undefined;
  return Math.round((amount * to.rpp) / from.rpp);
}

/* ---------- College ---------- */

export function collegeCosts(state?: string): CollegeCosts | undefined {
  return state ? PLACE_DATA.states[state]?.college : undefined;
}
export const COLLEGE_SOURCE = PLACE_DATA.sources.college ?? 'U.S. Department of Education, College Scorecard';
