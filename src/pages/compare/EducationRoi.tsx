import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CAREERS, CAREER_BY_ID } from '../../data/careers';
import { ROUTE_DETAILS, ROI_SOURCES } from '../../data/education/routes';
import { EDUCATION_LEVELS } from '../../data/vocab';
import { computeRoi, defaultAssumptions, type RoiAssumptions } from '../../lib/roi';
import { money } from '../../lib/format';
import { Callout, PageHeader } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useStore } from '../../state/store';
import { STATE_NAMES, collegeCosts, consideredPlaces, costWords, homePlace, inUsDollars, localPay, placeById, type Place } from '../../lib/places';

function NumberField({ id, label, value, onChange, step = 1000, suffix, hint }: { id: string; label: string; value: number; onChange: (n: number) => void; step?: number; suffix?: string; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-affix">
        <input id={id} type="number" inputMode="decimal" className="input" value={Number.isFinite(value) ? value : 0} step={step} min={0} onChange={(e) => onChange(Number(e.target.value))} />
        {suffix && <span className="input-affix__suffix">{suffix}</span>}
      </div>
      {hint && <span className="field__hint">{hint}</span>}
    </div>
  );
}

export default function EducationRoi() {
  useDocumentTitle('Training costs and payoff');
  const [params, setParams] = useSearchParams();
  const careerId = params.get('career') && CAREER_BY_ID[params.get('career')!] ? params.get('career')! : 'registered-nurse';
  const career = CAREER_BY_ID[careerId];
  const { update, profile } = useStore();
  const home = homePlace(profile);
  const studyParam = params.get('study');
  const study = studyParam === 'us' ? '' : (studyParam ?? home?.state ?? '');
  const studyPlace = study ? placeById(study) : undefined;
  const awayDefault = !!study && study !== home?.state;
  const away = params.get('away') === null ? awayDefault : params.get('away') === '1';
  const workOptions: Place[] = [...(home ? [home] : []), ...consideredPlaces(profile), ...(studyPlace && !(home?.state === study) ? [studyPlace] : [])].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  const workParam = params.get('work');
  const workId = workParam === 'us' ? '' : (workParam ?? workOptions[0]?.id ?? '');
  const workPlace = workId ? placeById(workId) : undefined;
  const college = collegeCosts(study || undefined);
  const outOfState = !!study && !!home && study !== home.state;
  const workPay = localPay(career, workPlace);
  const plan = { college, outOfState, livingAway: away, workPay: workPay.pay };
  const planKey = JSON.stringify([career.id, study, away, workId]);
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const [a, setA] = useState<RoiAssumptions>(() => defaultAssumptions(career, plan));

  useEffect(() => {
    setA(defaultAssumptions(career, plan));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey]);

  useEffect(() => {
    // Checking the numbers counts as evidence for this path.
    update((p) => {
      if (!p.roiChecked.includes(career.id)) p.roiChecked.push(career.id);
    });
  }, [career, update]);


  const r = useMemo(() => computeRoi(career, a), [career, a]);
  const set = <K extends keyof RoiAssumptions>(k: K, v: RoiAssumptions[K]) => setA((x) => ({ ...x, [k]: v }));

  return (
    <div className="wrap">
      <PageHeader
        title="Is the training worth it?"
        lead="Education is an investment of money and time. This model makes every assumption visible so you can change it. It isn’t trying to prove that college is good or bad; it shows the tradeoffs for one path."
        back={{ to: '/compare', label: 'Compare' }}
      />

      <div className="split">
        <div className="stack-lg">
          <div className="field">
            <label htmlFor="roi-career">Career</label>
            <select id="roi-career" className="select" value={careerId} onChange={(e) => setParam('career', e.target.value)}>
              {CAREERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({EDUCATION_LEVELS[c.education.level].label.toLowerCase()})
                </option>
              ))}
            </select>
          </div>

          <section className="card stack roi-place" aria-labelledby="place-h">
            <h2 id="place-h" className="h3">
              Where you’d study, live and work
            </h2>
            <div className="grid grid--2">
              <div className="field">
                <label htmlFor="study-state">Study or train in</label>
                <select id="study-state" className="select" value={study || 'us'} onChange={(e) => setParam('study', e.target.value)}>
                  <option value="us">U.S. averages</option>
                  {Object.entries(STATE_NAMES)
                    .sort((x, y) => x[1].localeCompare(y[1]))
                    .map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                        {home?.state === code ? ' (where you live)' : ''}
                      </option>
                    ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="work-place">Work afterward in</label>
                <select id="work-place" className="select" value={workId || 'us'} onChange={(e) => setParam('work', e.target.value)}>
                  <option value="us">Anywhere in the U.S. (U.S. median)</option>
                  {workOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                      {p.id === home?.id ? ' (where you live)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {study && career.education.years > 0 && (
              <label className="check">
                <input type="checkbox" checked={away} onChange={(e) => setParam('away', e.target.checked ? '1' : '0')} />
                I’d live away from home while training (adds {STATE_NAMES[study]}’s typical room and board)
              </label>
            )}
            {study && (
              <p className="small" style={{ margin: 0 }}>
                <strong>{STATE_NAMES[study]}:</strong>{' '}
                {college?.public4InState ? `public universities about ${money(college.public4InState)}/yr in state` : 'no public university figure'}
                {college?.public4OutOfState ? ` (${money(college.public4OutOfState)} out of state)` : ''}
                {college?.public2InState ? `, community colleges about ${money(college.public2InState)}/yr` : ''}
                {college?.public4RoomBoard ? `, room and board about ${money(college.public4RoomBoard)}/yr` : ''}. Living costs there: {costWords(studyPlace?.rpp).toLowerCase()}.
                {outOfState ? ' Out-of-state prices are used because it isn’t where you live; residency rules vary.' : ''}
              </p>
            )}
            <p className="small" style={{ margin: 0 }}>
              <strong>After training:</strong> median pay for {career.title.toLowerCase()} {workPlace ? `in ${workPlace.label}` : 'in the U.S.'} is {money(workPay.pay)}
              {workPlace && workPay.scope !== workPlace.kind ? ` (${workPay.scope === 'national' ? 'U.S. figure; no local estimate' : 'statewide figure'})` : ''}
              {workPlace?.rpp ? `, which buys about what ${money(inUsDollars(workPay.pay, workPlace.rpp)!)} does in an average U.S. place` : ''}.
            </p>
            {study && studyPlace && workPlace?.state !== study && (
              <p className="small muted" style={{ margin: 0 }}>
                Many people stay where they study. In {studyPlace.label}, the median for this work is {money(localPay(career, studyPlace).pay)}.{' '}
                <button type="button" className="linkish" onClick={() => setParam('work', study)}>
                  Use {studyPlace.label} for work too
                </button>
              </p>
            )}
            {!home && (
              <p className="small muted" style={{ margin: 0 }}>
                <Link to="/places">Add where you live and places you’d consider</Link> to compare in-state prices and local pay.
              </p>
            )}
          </section>

          <section className="roi-results" aria-live="polite" aria-labelledby="roi-h">
            <h2 id="roi-h" className="visually-hidden">
              Results
            </h2>
            <div className="roi-grid">
              <div className="roi-stat">
                <span className="stat__value">{money(r.totalCost)}</span>
                <span className="stat__label">Estimated education cost</span>
              </div>
              <div className="roi-stat">
                <span className="stat__value">{money(r.opportunityCost)}</span>
                <span className="stat__label">Earnings given up while training</span>
              </div>
              <div className="roi-stat">
                <span className="stat__value">{r.monthlyPayment < 1 ? '$0' : `$${Math.round(r.monthlyPayment).toLocaleString('en-US')}`}</span>
                <span className="stat__label">Monthly loan payment</span>
              </div>
              <div className="roi-stat">
                <span className="stat__value">{Math.round(r.paymentShareOfIncome * 100)}%</span>
                <span className="stat__label">Of starting pay going to loans</span>
              </div>
              <div className="roi-stat">
                <span className="stat__value">{r.breakEvenYears === null ? 'Not within 30 yrs' : r.breakEvenYears === 0 ? 'Immediately' : `${r.breakEvenYears} yrs`}</span>
                <span className="stat__label">To earn back cost and lost earnings</span>
              </div>
              <div className="roi-stat">
                <span className="stat__value">{r.tenYearNet >= 0 ? money(r.tenYearNet) : `−${money(-r.tenYearNet)}`}</span>
                <span className="stat__label">Ahead after 10 years of work, vs. your alternative</span>
              </div>
            </div>
            {r.paymentShareOfIncome > 0.1 && (
              <Callout tone="warn" title="Loan payments may be heavy">
                A common rule of thumb is to keep student loan payments under about 10% of your income. Consider community college first, scholarships, employer tuition help, or borrowing less.
              </Callout>
            )}
            {r.breakEvenYears !== null && r.breakEvenYears <= 6 && r.totalCost > 0 && (
              <Callout tone="evidence" title="Strong payoff in this model">
                With these assumptions, the training pays for itself within {r.breakEvenYears} years of work.
              </Callout>
            )}
          </section>

          <section className="card stack" aria-labelledby="assume-h">
            <h2 id="assume-h" className="h3">
              Assumptions you can change
            </h2>
            <div className="grid grid--2">
              <NumberField id="tuition" label="Total tuition and fees" value={a.tuition} onChange={(n) => set('tuition', n)} hint="Before grants and scholarships." />
              <NumberField id="years" label="Years of training" value={a.years} step={1} onChange={(n) => set('years', n)} />
              <NumberField id="living" label="Living costs per year while training" value={a.livingCosts} onChange={(n) => set('livingCosts', n)} hint="Leave at 0 if you’d live at home." />
              <NumberField id="alt" label="What you’d earn per year instead" value={a.alternativeEarnings} onChange={(n) => set('alternativeEarnings', n)} hint="Full-time work right after high school." />
              <NumberField id="borrow" label="Share you’d borrow" value={Math.round(a.borrowedShare * 100)} step={5} suffix="%" onChange={(n) => set('borrowedShare', Math.min(100, n) / 100)} />
              <NumberField id="rate" label="Loan interest rate" value={Math.round(a.loanRate * 1000) / 10} step={0.5} suffix="%" onChange={(n) => set('loanRate', n / 100)} />
            </div>
            <label className="check">
              <input type="checkbox" checked={a.paidWhileTraining} onChange={(e) => set('paidWhileTraining', e.target.checked)} />
              I’d be paid while training (apprenticeship, military, employer program)
            </label>
            <button type="button" className="btn btn--quiet" onClick={() => setA(defaultAssumptions(career, plan))}>
              Reset to defaults
            </button>
          </section>

          <Callout title="What this model leaves out">
            Grants and scholarships, raises beyond the median, differences between schools in the same state, the value of enjoying your work, and the chance of changing careers. It assumes pay ramps from {Math.round(a.startingShare * 100)}% of the median to the median over five years, using pay where you’d work. Use it to compare paths, not to predict your future.
          </Callout>
        </div>

        <aside className="stack-lg sticky">
          <section aria-labelledby="routes-h">
            <h2 id="routes-h" className="h3">
              Routes into {career.title.toLowerCase()}
            </h2>
            <ul className="route-list">
              {ROUTE_DETAILS.filter((rt) => career.education.routes.includes(rt.id)).map((rt) => (
                <li key={rt.id} className="card">
                  <h3 className="h4">{rt.label}</h3>
                  <p className="small muted">
                    {rt.summary} {rt.typicalYears}.
                  </p>
                  <p className="small">
                    <strong>Good for:</strong> {rt.goodFor.join('; ')}.
                  </p>
                  <p className="small">
                    <strong>Watch out:</strong> {rt.watchOut.join('; ')}.
                  </p>
                </li>
              ))}
            </ul>
            <p className="small">
              <Link to={`/careers/${career.id}`}>Back to {career.title}</Link>
            </p>
          </section>
          <section aria-labelledby="all-routes-h">
            <h2 id="all-routes-h" className="h4">
              Every route Called considers
            </h2>
            <ul className="plain small">
              {ROUTE_DETAILS.map((rt) => (
                <li key={rt.id}>
                  <strong>{rt.label}:</strong> {rt.summary}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="src-h">
            <h2 id="src-h" className="h4">
              Check real numbers
            </h2>
            <ul className="plain small">
              {ROI_SOURCES.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
