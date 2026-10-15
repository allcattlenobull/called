import { Fragment, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CAREERS, CAREER_BY_ID } from '../../data/careers';
import { EDUCATION_LEVELS, LEVEL_WORDS, OUTLOOK, REMOTE, SCHEDULE } from '../../data/vocab';
import { useStore } from '../../state/store';
import { estimatedEducationCost, geography, matchCareer, type MatchResult } from '../../lib/matching';
import { monthlyPayment } from '../../lib/roi';
import { ROI_DEFAULTS } from '../../data/education/routes';
import { money, moneyK } from '../../lib/format';
import { Callout, EmptyState, PageHeader } from '../../components/ui';
import { Icon } from '../../components/Icon';
import type { Career } from '../../types';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

interface Row {
  label: string;
  group: string;
  /** Numeric value used for bars and picking the standout; null when not comparable. */
  value: (c: Career, m: MatchResult) => number | null;
  display: (c: Career, m: MatchResult) => ReactNode;
  better?: 'high' | 'low';
  max?: number;
}

const ROWS: Row[] = [
  { group: 'Fit for you', label: 'Overall personal match', value: (_, m) => m.overall, display: (_, m) => (m.overall === null ? 'Not enough evidence' : `${m.overall} / 100`), better: 'high', max: 100 },
  { group: 'Fit for you', label: 'Interests', value: (_, m) => m.dimensions.interest.score, display: (_, m) => m.dimensions.interest.score ?? '–', better: 'high', max: 100 },
  { group: 'Fit for you', label: 'Values', value: (_, m) => m.dimensions.values.score, display: (_, m) => m.dimensions.values.score ?? '–', better: 'high', max: 100 },
  { group: 'Fit for you', label: 'Purpose', value: (_, m) => m.dimensions.purpose.score, display: (_, m) => m.dimensions.purpose.score ?? '–', better: 'high', max: 100 },
  { group: 'Fit for you', label: 'Lifestyle', value: (_, m) => m.dimensions.lifestyle.score, display: (_, m) => m.dimensions.lifestyle.score ?? '–', better: 'high', max: 100 },
  { group: 'Money', label: 'Median income', value: (c) => c.pay.median, display: (c) => money(c.pay.median), better: 'high', max: 200000 },
  { group: 'Money', label: 'Typical range', value: () => null, display: (c) => `${moneyK(c.pay.low)} to ${moneyK(c.pay.high)}` },
  { group: 'Education', label: 'Education required', value: (c) => EDUCATION_LEVELS[c.education.level].order, display: (c) => EDUCATION_LEVELS[c.education.level].label, better: 'low' },
  { group: 'Education', label: 'Years after high school', value: (c) => c.education.years, display: (c) => (c.education.years === 0 ? 'None required' : `About ${c.education.years}`), better: 'low', max: 8 },
  { group: 'Education', label: 'Estimated tuition', value: (c) => estimatedEducationCost(c), display: (c) => (estimatedEducationCost(c) < 1000 ? 'Little or none' : money(estimatedEducationCost(c))), better: 'low', max: 160000 },
  {
    group: 'Education',
    label: 'Debt consideration',
    value: (c) => monthlyPayment(estimatedEducationCost(c) * ROI_DEFAULTS.borrowedShare, ROI_DEFAULTS.loanRate, ROI_DEFAULTS.repaymentYears),
    display: (c) => {
      const pay = monthlyPayment(estimatedEducationCost(c) * ROI_DEFAULTS.borrowedShare, ROI_DEFAULTS.loanRate, ROI_DEFAULTS.repaymentYears);
      return pay < 20 ? 'Minimal' : `About $${Math.round(pay)}/month for 10 years if half is borrowed`;
    },
    better: 'low',
  },
  { group: 'Work and life', label: 'Job outlook', value: (c) => OUTLOOK[c.outlook].rank, display: (c) => OUTLOOK[c.outlook].label, better: 'high' },
  { group: 'Work and life', label: 'Schedule', value: () => null, display: (c) => SCHEDULE[c.schedule] },
  { group: 'Work and life', label: 'Remote work', value: (c) => ({ none: 0, some: 1, common: 2 })[c.remote], display: (c) => REMOTE[c.remote] },
  { group: 'Work and life', label: 'Stress', value: (c) => c.stress, display: (c) => LEVEL_WORDS[c.stress], better: 'low' },
  { group: 'Work and life', label: 'Physical demands', value: () => null, display: (c) => LEVEL_WORDS[c.physical] },
  { group: 'Work and life', label: 'Travel', value: () => null, display: (c) => LEVEL_WORDS[c.travel] },
  { group: 'Work and life', label: 'Where the jobs are', value: () => null, display: (c) => (geography(c) === 'everywhere' ? 'Most communities' : 'Larger cities') },
];

const PRESETS = [
  { label: 'Nurse, PA, physical therapist', ids: ['registered-nurse', 'physician-assistant', 'physical-therapist'] },
  { label: 'Electrician, software developer, accountant', ids: ['electrician', 'software-developer', 'accountant'] },
  { label: 'Teacher, school counselor, social worker', ids: ['high-school-teacher', 'school-counselor', 'social-worker'] },
];

export default function Compare() {
  useDocumentTitle('Compare');
  const { profile, update } = useStore();
  const ids = profile.compare.length ? profile.compare : profile.saved.slice(0, 3);
  const idKey = ids.join('|');
  const careers = useMemo(() => idKey.split('|').map((id) => CAREER_BY_ID[id]).filter(Boolean), [idKey]);
  const matches = useMemo(() => careers.map((c) => matchCareer(c, profile)), [careers, profile]);
  const counted = useRef('');

  useEffect(() => {
    const key = careers.map((c) => c.id).sort().join('|');
    if (careers.length >= 2 && counted.current !== key) {
      counted.current = key;
      update((p) => void (p.comparisons += 1));
    }
  }, [careers, update]);

  const setIds = (next: string[]) => update((p) => void (p.compare = next.slice(0, 3)));
  const available = CAREERS.filter((c) => !ids.includes(c.id));

  return (
    <div className="wrap">
      <PageHeader title="Compare paths side by side" lead="Put up to three careers next to each other. Differences are called out so you can see the tradeoffs, not just the totals.">
        <Link to="/compare/education" className="btn btn--secondary">
          <Icon name="compare" size={18} /> Education ROI tool
        </Link>
      </PageHeader>

      <div className="compare-pick">
        {careers.map((c) => (
          <span key={c.id} className="compare-pill">
            <Link to={`/careers/${c.id}`}>{c.title}</Link>
            <button type="button" className="btn btn--icon btn--sm" aria-label={`Remove ${c.title} from comparison`} onClick={() => setIds(ids.filter((x) => x !== c.id))}>
              <Icon name="close" size={16} />
            </button>
          </span>
        ))}
        {careers.length < 3 && (
          <div className="field field--inline">
            <label htmlFor="add-career" className="visually-hidden">
              Add a career to compare
            </label>
            <select
              id="add-career"
              className="select"
              value=""
              onChange={(e) => {
                if (e.target.value) setIds([...ids, e.target.value]);
              }}
            >
              <option value="">Add a career…</option>
              {profile.saved.filter((s) => !ids.includes(s)).length > 0 && (
                <optgroup label="Saved">
                  {profile.saved
                    .filter((s) => !ids.includes(s))
                    .map((s) => CAREER_BY_ID[s])
                    .filter(Boolean)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                </optgroup>
              )}
              <optgroup label="All careers">
                {available.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        )}
      </div>

      {careers.length < 2 ? (
        <div className="stack-lg" style={{ marginTop: 'var(--s-5)' }}>
          <EmptyState icon="compare" title="Pick at least two careers">
            Add careers from their pages with “Add to comparison”, choose from the list above, or start with a common comparison.
          </EmptyState>
          <div className="row">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" className="btn btn--secondary btn--wrap" onClick={() => setIds(p.ids)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="table-wrap compare-table-wrap" tabIndex={0} role="region" aria-label="Career comparison">
            <table className="table compare-table">
              <caption className="visually-hidden">Comparison of {careers.map((c) => c.title).join(', ')}</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="visually-hidden">Attribute</span>
                  </th>
                  {careers.map((c) => (
                    <th key={c.id} scope="col">
                      <Link to={`/careers/${c.id}`}>{c.title}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, ri) => {
                  const vals = careers.map((c, i) => row.value(c, matches[i]));
                  const numeric = vals.filter((v): v is number => v !== null);
                  const distinct = new Set(numeric).size > 1;
                  const best = row.better && distinct && numeric.length === vals.length ? (row.better === 'high' ? Math.max(...numeric) : Math.min(...numeric)) : null;
                  const showGroup = ri === 0 || ROWS[ri - 1].group !== row.group;
                  return (
                    <Fragment key={row.label}>
                      {showGroup && (
                        <tr className="compare-group">
                          <th scope="colgroup" colSpan={careers.length + 1}>
                            {row.group}
                          </th>
                        </tr>
                      )}
                      <tr>
                        <th scope="row">{row.label}</th>
                        {careers.map((c, i) => {
                          const v = vals[i];
                          const isBest = best !== null && v === best;
                          return (
                            <td key={c.id} className={isBest ? 'is-best' : undefined}>
                              <span className="compare-cell">
                                {row.display(c, matches[i])}
                                {isBest && <span className="best-tag">{row.better === 'high' ? 'Highest' : 'Lowest'}</span>}
                              </span>
                              {row.max && v !== null && (
                                <span className="minibar" aria-hidden="true">
                                  <span style={{ width: `${Math.min(100, (v / row.max) * 100)}%` }} />
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid grid--3" style={{ marginTop: 'var(--s-5)' }}>
            {careers.map((c, i) => (
              <div key={c.id} className="card">
                <h3 className="h4">{c.title}: watch for</h3>
                {matches[i].conflicts.length ? (
                  <ul className="small">
                    {matches[i].conflicts.slice(0, 3).map((x) => (
                      <li key={x.text}>{x.text}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="small muted">No conflicts with your stated priorities yet.</p>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 'var(--s-5)' }}>
            <Callout>
              Tuition and debt figures are rough starting estimates. Use the <Link to={`/compare/education?career=${careers[0].id}`}>Education ROI tool</Link> to adjust assumptions for your situation, and check specific schools on College Scorecard.
            </Callout>
          </div>
        </>
      )}
    </div>
  );
}
