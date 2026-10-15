import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { CAREERS, CAREER_BY_ID } from '../data/careers';
import { Callout, PageHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { money } from '../lib/format';
import {
  COLLEGE_SOURCE,
  COST_SOURCE,
  STATE_NAMES,
  WAGE_SOURCE,
  collegeCosts,
  consideredPlaces,
  costWords,
  equivalentSalary,
  hasCostOfLiving,
  homePlace,
  inUsDollars,
  localPay,
  metroOptions,
  placeById,
  resolvePlace,
  type Place,
} from '../lib/places';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const STATE_OPTIONS = Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1]));

/** Pick a state, then optionally a metro area inside it. Returns 'TX' or 'm12060'. */
function PlacePicker({ id, value, onChange, label }: { id: string; value: string; onChange: (v: string) => void; label: string }) {
  const place = value ? (placeById(value) ?? resolvePlace(value)) : undefined;
  const state = place?.state ?? '';
  const metros = useMemo(() => (state ? metroOptions(state) : []), [state]);
  return (
    <fieldset className="place-picker">
      <legend className="small">{label}</legend>
      <div className="place-picker__row">
        <div className="field">
          <label htmlFor={`${id}-state`}>State</label>
          <select id={`${id}-state`} className="select" value={state} onChange={(e) => onChange(e.target.value)}>
            <option value="">Choose a state…</option>
            {STATE_OPTIONS.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-metro`}>Metro area <span className="muted small">(optional)</span></label>
          <select id={`${id}-metro`} className="select" value={place?.kind === 'metro' ? place.id : ''} disabled={!metros.length} onChange={(e) => onChange(e.target.value || state)}>
            <option value="">{metros.length ? 'Anywhere in the state' : state ? 'No metro data for this state' : 'Choose a state first'}</option>
            {metros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </fieldset>
  );
}

export default function Places() {
  useDocumentTitle('Places and cost of living');
  const { profile, update } = useStore();
  const home = homePlace(profile);
  const considered = consideredPlaces(profile);
  const unresolved = (profile.location?.considering ?? []).filter((t) => !resolvePlace(t));

  const [homeValue, setHomeValue] = useState(home?.id ?? '');
  const [city, setCity] = useState(profile.location?.city ?? '');
  const [others, setOthers] = useState<string[]>(() => [...considered.map((p) => p.id), '', '', ''].slice(0, 3));
  const [saved, setSaved] = useState(false);
  const [salary, setSalary] = useState(50000);
  const [careerId, setCareerId] = useState(profile.saved[0] ?? 'electrician');
  const career = CAREER_BY_ID[careerId];

  const save = () => {
    const homeP = homeValue ? placeById(homeValue) : undefined;
    update((p) => {
      p.location = {
        ...(p.location ?? { considering: [] }),
        city: city.trim() || undefined,
        state: homeP?.state,
        place: homeP?.id,
        considering: [...others.filter(Boolean), ...unresolved].slice(0, 3),
      };
    });
    setSaved(true);
  };

  const places: { place: Place; role: string }[] = [...(home ? [{ place: home, role: 'Where you live' }] : []), ...considered.map((place) => ({ place, role: 'Considering' }))];
  const base = home;

  return (
    <div className="wrap places">
      <PageHeader
        title="Places and cost of living"
        lead="Where you live shapes what you’ll earn, what you’ll spend and where you’ll train. Many people end up living where they go to college or start their first job, so the place is part of the decision."
      />

      {!hasCostOfLiving && (
        <Callout tone="warn" title="Cost-of-living data is being refreshed">
          Pay by place still works. Cost-of-living comparisons will appear after the next data update.
        </Callout>
      )}

      <section className="card stack" aria-labelledby="where-h">
        <h2 id="where-h" className="h3">
          Your places
        </h2>
        <p className="small muted">Saved only in your Called profile. No GPS, no tracking. Choose a metro area for the most accurate pay and prices.</p>
        <PlacePicker id="home" label="Where you live now" value={homeValue} onChange={(v) => { setHomeValue(v); setSaved(false); }} />
        <div className="field">
          <label htmlFor="home-city">City or town <span className="muted small">(optional, used for finding people near you)</span></label>
          <input id="home-city" className="input" value={city} onChange={(e) => { setCity(e.target.value); setSaved(false); }} maxLength={80} autoComplete="address-level2" />
        </div>
        {others.map((v, i) => (
          <PlacePicker key={i} id={`consider-${i}`} label={`A place you’d consider ${i === 0 ? '(for work or school)' : ''}`.trim()} value={v} onChange={(nv) => { setOthers((o) => o.map((x, j) => (j === i ? nv : x))); setSaved(false); }} />
        ))}
        {unresolved.length > 0 && <p className="small muted">Also saved, but not matched to data: {unresolved.join('; ')}.</p>}
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={save}>
            Save places
          </button>
          {saved && (
            <span className="small" role="status">
              Saved. Career pages now show pay where you’d live.
            </span>
          )}
        </div>
      </section>

      {places.length > 0 && (
        <>
          <section className="section" aria-labelledby="col-h">
            <h2 id="col-h" className="h3">
              What life costs there
            </h2>
            <div className="table-scroll">
              <table className="table places__table">
                <caption className="visually-hidden">Cost of living and public college costs by place</caption>
                <thead>
                  <tr>
                    <th scope="col">Place</th>
                    <th scope="col">Overall prices</th>
                    <th scope="col">Housing</th>
                    <th scope="col">Public university, in state</th>
                    <th scope="col">Out of state</th>
                    <th scope="col">Community college</th>
                    <th scope="col">Room and board</th>
                  </tr>
                </thead>
                <tbody>
                  {places.map(({ place, role }) => {
                    const c = collegeCosts(place.state);
                    const yr = (n?: number | null) => (n ? `${money(n)}/yr` : '–');
                    return (
                      <tr key={place.id}>
                        <th scope="row">
                          {place.label}
                          <span className="small muted">{role}</span>
                        </th>
                        <td>{costWords(place.rpp)}</td>
                        <td>{place.rppHousing ? costWords(place.rppHousing).replace('than average', '') : '–'}</td>
                        <td>{yr(c?.public4InState)}</td>
                        <td>{yr(c?.public4OutOfState)}</td>
                        <td>{yr(c?.public2InState)}</td>
                        <td>{yr(c?.public4RoomBoard)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="small muted">
              College costs are statewide medians of published tuition and fees at public colleges, before financial aid. Living costs while you study follow the place you study, and many graduates stay there, so compare both the school and the place.{' '}
              <Link to="/compare/education">Model a specific path’s cost and payoff</Link>
            </p>
          </section>

          <section className="section" aria-labelledby="salary-h">
            <h2 id="salary-h" className="h3">
              What a salary is worth in each place
            </h2>
            <div className="field" style={{ maxWidth: 260 }}>
              <label htmlFor="salary">Salary{base ? ` in ${base.label}` : ''}</label>
              <input id="salary" className="input" type="number" inputMode="numeric" min={0} step={1000} value={salary} onChange={(e) => setSalary(Number(e.target.value) || 0)} />
            </div>
            <ul className="salary-list">
              {places
                .filter(({ place }) => place.id !== base?.id)
                .map(({ place }) => {
                  const eq = base ? equivalentSalary(salary, base, place) : inUsDollars(salary, place.rpp);
                  return (
                    <li key={place.id}>
                      {base ? (
                        <>
                          To live like {money(salary)} in {base.label}, you’d need about <strong>{eq ? money(eq) : '–'}</strong> in {place.label}.
                        </>
                      ) : (
                        <>
                          {money(salary)} in {place.label} buys about what <strong>{eq ? money(eq) : '–'}</strong> buys in an average U.S. place.
                        </>
                      )}
                    </li>
                  );
                })}
              {places.length === 1 && <li className="muted">Add a place you’d consider to compare.</li>}
            </ul>
          </section>

          <section className="section" aria-labelledby="career-h">
            <h2 id="career-h" className="h3">
              A career in each place
            </h2>
            <div className="field" style={{ maxWidth: 360 }}>
              <label htmlFor="place-career">Career</label>
              <select id="place-career" className="select" value={careerId} onChange={(e) => setCareerId(e.target.value)}>
                {[...profile.saved.map((id) => CAREER_BY_ID[id]).filter(Boolean), ...CAREERS.filter((c) => !profile.saved.includes(c.id))].map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                    {profile.saved.includes(c.id) ? ' (saved)' : ''}
                  </option>
                ))}
              </select>
            </div>
            {career && (
              <div className="table-scroll">
                <table className="table places__table">
                  <caption className="visually-hidden">{career.title} pay by place</caption>
                  <thead>
                    <tr>
                      <th scope="col">Place</th>
                      <th scope="col">Median pay</th>
                      <th scope="col">What it buys (average-U.S. dollars)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {places.map(({ place }) => {
                      const pay = localPay(career, place);
                      return (
                        <tr key={place.id}>
                          <th scope="row">{place.label}</th>
                          <td>
                            {money(pay.pay)}
                            {pay.scope !== place.kind && <span className="small muted">{pay.scope === 'national' ? 'U.S. figure' : 'statewide figure'}</span>}
                          </td>
                          <td>{inUsDollars(pay.pay, place.rpp) ? money(inUsDollars(pay.pay, place.rpp)!) : '–'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {career && (
              <p className="small">
                <Link to={`/careers/${career.id}`}>Open {career.title}</Link> · <Link to={`/compare/education?career=${career.id}`}>Cost and payoff of the training</Link> · <Link to={`/network?career=${career.id}`}>Find people in this field</Link>
              </p>
            )}
          </section>
        </>
      )}

      <Callout title="Where these numbers come from">
        <span className="small">
          Cost of living: {COST_SOURCE} Pay: {WAGE_SOURCE.source}
          {WAGE_SOURCE.asOf ? `, ${WAGE_SOURCE.asOf}` : ''}. College: {COLLEGE_SOURCE} Prices and pay vary within every area; treat these as a starting point and check real listings and job posts.
        </span>
      </Callout>
      <p className="small muted">
        <Icon name="lock" size={14} /> Your places are part of your private profile. <Link to="/data">Privacy and data</Link>
      </p>
    </div>
  );
}
