import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CAREERS } from '../../data/careers';
import { EDUCATION_LEVELS, FAMILIES, INTERESTS, OUTLOOK } from '../../data/vocab';
import { useStore } from '../../state/store';
import { rankCareers } from '../../lib/matching';
import { CareerCard } from '../../components/CareerCard';
import { EmptyState, PageHeader } from '../../components/ui';
import { Icon } from '../../components/Icon';
import type { CareerFamily, EducationLevel, InterestId, Career } from '../../types';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { smartSearchScore } from '../../lib/smartSearch';

type Sort = 'match' | 'az' | 'pay' | 'outlook' | 'training';

interface Filters {
  maxEducation: EducationLevel | '';
  minPay: number;
  family: CareerFamily | '';
  interest: InterestId | '';
  remote: '' | 'some' | 'common';
  physical: '' | 'desk' | 'active';
  outlook: '' | 'growing';
  orientation: '' | 'people' | 'data';
  schedule: '' | 'regular';
  entrepreneurial: boolean;
  saved: boolean;
}

const EMPTY: Filters = { maxEducation: '', minPay: 0, family: '', interest: '', remote: '', physical: '', outlook: '', orientation: '', schedule: '', entrepreneurial: false, saved: false };

function applyFilters(c: Career, f: Filters, q: string, saved: string[]): boolean {
  if (q) {
    if (careerSearchScore(c, q) < 0) return false;
  }
  if (f.maxEducation && EDUCATION_LEVELS[c.education.level].order > EDUCATION_LEVELS[f.maxEducation].order) return false;
  if (f.minPay && c.pay.median < f.minPay) return false;
  if (f.family && c.family !== f.family) return false;
  if (f.interest && (c.interests[f.interest] ?? 0) < 2) return false;
  if (f.remote === 'some' && c.remote === 'none') return false;
  if (f.remote === 'common' && c.remote !== 'common') return false;
  if (f.physical === 'desk' && c.physical > 1) return false;
  if (f.physical === 'active' && c.physical < 3) return false;
  if (f.outlook === 'growing' && OUTLOOK[c.outlook].rank < 3) return false;
  if (f.orientation === 'people' && c.peopleData < 1) return false;
  if (f.orientation === 'data' && c.peopleData > -1) return false;
  if (f.schedule === 'regular' && c.schedule !== 'regular') return false;
  if (f.entrepreneurial && c.entrepreneurial < 3) return false;
  if (f.saved && !saved.includes(c.id)) return false;
  return true;
}

function careerSearchScore(c: Career, q: string): number {
  return smartSearchScore(q, [c.title, c.summary, FAMILIES[c.family], c.education.majors?.join(' '), c.responsibilities.join(' '), c.environment, c.alternativeRoutes.join(' ')]);
}

export default function Careers() {
  useDocumentTitle('Careers');
  const { profile } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [f, setF] = useState<Filters>(() => ({ ...EMPTY, family: (params.get('family') as CareerFamily) || '' }));
  const ranked = useMemo(() => rankCareers(profile), [profile]);
  const hasMatches = ranked.some((r) => r.match.overall !== null);
  const sort = (params.get('sort') as Sort) || (hasMatches ? 'match' : 'az');

  const results = useMemo(() => {
    const list = ranked.filter((r) => applyFilters(r.career, f, q.trim(), profile.saved));
    const by: Record<Sort, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      match: (a, b) => (b.match.overall ?? -1) - (a.match.overall ?? -1),
      az: (a, b) => a.career.title.localeCompare(b.career.title),
      pay: (a, b) => b.career.pay.median - a.career.pay.median,
      outlook: (a, b) => OUTLOOK[b.career.outlook].rank - OUTLOOK[a.career.outlook].rank,
      training: (a, b) => a.career.education.years - b.career.education.years,
    };
    return [...list].sort((a, b) => q.trim() ? careerSearchScore(b.career, q) - careerSearchScore(a.career, q) || by[sort](a, b) : by[sort](a, b));
  }, [ranked, f, q, sort, profile.saved]);

  const [limit, setLimit] = useState(24);
  useEffect(() => setLimit(24), [f, q, sort]);
  const activeCount = Object.entries(f).filter(([k, v]) => v !== EMPTY[k as keyof Filters]).length;
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((x) => ({ ...x, [k]: v }));

  return (
    <div className="wrap">
      <PageHeader title="Explore careers" lead={`${CAREERS.length} careers across ${Object.keys(FAMILIES).length} fields, from no-degree jobs and apprenticeships to doctoral degrees. Each one shows what the work is really like.`}>
        <div className="row"><Link to="/compare" className="btn btn--secondary"><Icon name="compare" size={18} /> Compare careers</Link><Link to="/network" className="btn btn--quiet">Find connections</Link></div>
      </PageHeader>

      <div className="explorer">
        <aside className="explorer__filters" aria-label="Search and filters">
          <div className="field">
            <label htmlFor="q">Search</label>
            <div className="search">
              <Icon name="search" size={18} />
              <input
                id="q"
                type="search"
                className="input"
                placeholder="Try “nurse,” “coder,” or even a close spelling"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <details className="filters" open={typeof window !== 'undefined' && window.innerWidth >= 900}>
            <summary>
              <Icon name="filter" size={18} /> Filters {activeCount > 0 && <span className="tag tag--primary">{activeCount} on</span>}
            </summary>
            <div className="filters__body">
              <FilterSelect id="f-edu" label="Most education I’d do" value={f.maxEducation} onChange={(v) => set('maxEducation', v as EducationLevel | '')} options={(Object.keys(EDUCATION_LEVELS) as EducationLevel[]).map((k) => ({ value: k, label: EDUCATION_LEVELS[k].label }))} />
              <FilterSelect
                id="f-pay"
                label="Median pay at least"
                value={String(f.minPay || '')}
                onChange={(v) => set('minPay', Number(v) || 0)}
                options={[40000, 60000, 80000, 100000].map((n) => ({ value: String(n), label: `$${n / 1000}k` }))}
              />
              <FilterSelect id="f-fam" label="Career family" value={f.family} onChange={(v) => set('family', v as CareerFamily | '')} options={(Object.keys(FAMILIES) as CareerFamily[]).map((k) => ({ value: k, label: FAMILIES[k] }))} />
              <FilterSelect id="f-int" label="Interest" value={f.interest} onChange={(v) => set('interest', v as InterestId | '')} options={(Object.keys(INTERESTS) as InterestId[]).map((k) => ({ value: k, label: INTERESTS[k].label }))} />
              <FilterSelect id="f-or" label="Mostly works with" value={f.orientation} onChange={(v) => set('orientation', v as Filters['orientation'])} options={[{ value: 'people', label: 'People' }, { value: 'data', label: 'Data, things or ideas' }]} />
              <FilterSelect id="f-remote" label="Remote work" value={f.remote} onChange={(v) => set('remote', v as Filters['remote'])} options={[{ value: 'some', label: 'At least some' }, { value: 'common', label: 'Common' }]} />
              <FilterSelect id="f-phys" label="Physical activity" value={f.physical} onChange={(v) => set('physical', v as Filters['physical'])} options={[{ value: 'desk', label: 'Mostly desk' }, { value: 'active', label: 'Very active' }]} />
              <FilterSelect id="f-out" label="Growth outlook" value={f.outlook} onChange={(v) => set('outlook', v as Filters['outlook'])} options={[{ value: 'growing', label: 'Faster than average' }]} />
              <FilterSelect id="f-sched" label="Schedule" value={f.schedule} onChange={(v) => set('schedule', v as Filters['schedule'])} options={[{ value: 'regular', label: 'Regular weekday hours' }]} />
              <label className="check">
                <input type="checkbox" checked={f.entrepreneurial} onChange={(e) => set('entrepreneurial', e.target.checked)} />
                High business-ownership potential
              </label>
              <label className="check">
                <input type="checkbox" checked={f.saved} onChange={(e) => set('saved', e.target.checked)} />
                Only my saved careers
              </label>
              {activeCount > 0 && (
                <button type="button" className="btn btn--quiet btn--sm" onClick={() => setF(EMPTY)}>
                  Clear filters
                </button>
              )}
            </div>
          </details>
        </aside>

        <section className="explorer__results" aria-labelledby="results-h">
          <div className="row row--between results-bar">
            <h2 id="results-h" className="results-count" aria-live="polite">
              {results.length} {results.length === 1 ? 'career' : 'careers'}
            </h2>
            <div className="field field--inline">
              <label htmlFor="sort">Sort by</label>
              <select
                id="sort"
                className="select"
                value={sort}
                onChange={(e) => {
                  const next = new URLSearchParams(params);
                  next.set('sort', e.target.value);
                  setParams(next, { replace: true });
                }}
              >
                {hasMatches && <option value="match">Best fit for me</option>}
                <option value="az">A to Z</option>
                <option value="pay">Highest median pay</option>
                <option value="outlook">Fastest growing</option>
                <option value="training">Shortest training</option>
              </select>
            </div>
          </div>
          {!hasMatches && (
            <p className="callout small" style={{ marginBottom: 'var(--s-4)' }}>
              <Icon name="info" size={18} />
              <span>
                <Link to="/discover">Complete any Discover assessment</Link> to see how each career fits you.
              </span>
            </p>
          )}
          {q.trim() && <p className="small muted search-help">Search understands close spellings and related terms such as “coder” for software work or “therapist” for counseling.</p>}
          {results.length ? (
            <>
              <div className="grid grid--2">
                {results.slice(0, limit).map(({ career, match }, i) => (
                  <div key={career.id} className="card-enter" style={{ ['--i' as string]: i % 24 }}>
                    <CareerCard career={career} match={match} />
                  </div>
                ))}
              </div>
              {results.length > limit && (
                <div className="show-more">
                  <button type="button" className="btn btn--secondary btn--lg" onClick={() => setLimit((l) => l + 24)}>
                    Show more careers
                  </button>
                  <span className="small muted">
                    Showing {limit} of {results.length}
                  </span>
                </div>
              )}
            </>
          ) : (
            <EmptyState icon="search" title="No careers match those filters" action={<button type="button" className="btn btn--secondary" onClick={() => { setF(EMPTY); setQ(''); }}>Clear search and filters</button>}>
              Try removing a filter or two.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}

function FilterSelect({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
