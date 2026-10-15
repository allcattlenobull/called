import { Link } from 'react-router-dom';
import { COST_SOURCE, WAGE_SOURCE, consideredPlaces, costWords, homePlace, inUsDollars, localPay, type Place } from '../lib/places';
import { money } from '../lib/format';
import type { Career, Profile } from '../types';

/** Pay for a career in each place the person lives or might move, adjusted for cost of living. */
export function PlacePay({ career, profile }: { career: Career; profile: Profile }) {
  const home = homePlace(profile);
  const others = consideredPlaces(profile);
  const rows: { place?: Place; role: string }[] = [...(home ? [{ place: home, role: 'Where you live' }] : []), ...others.map((place) => ({ place, role: 'Considering' })), { place: undefined, role: 'U.S. overall' }];

  if (!home && !others.length) {
    return (
      <div className="card place-pay place-pay--empty">
        <h3 className="h4">Pay and cost of living where you’d live</h3>
        <p className="small">The same job can pay very differently from one city to the next, and a paycheck goes further in some places than others. Add where you live and places you’d consider to compare them here.</p>
        <Link to="/places" className="btn btn--secondary">
          Add places
        </Link>
      </div>
    );
  }

  return (
    <div className="card place-pay">
      <div className="row row--between">
        <h3 className="h4" style={{ margin: 0 }}>
          Pay and cost of living where you’d live
        </h3>
        <Link to="/places" className="small">
          Edit places
        </Link>
      </div>
      <div className="table-scroll">
        <table className="table place-pay__table">
          <caption className="visually-hidden">Median pay for {career.title.toLowerCase()} by place, with cost of living</caption>
          <thead>
            <tr>
              <th scope="col">Place</th>
              <th scope="col">Median pay</th>
              <th scope="col">Cost of living</th>
              <th scope="col">What it buys</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ place, role }) => {
              const pay = localPay(career, place);
              const worth = place ? inUsDollars(pay.pay, place.rpp) : pay.pay;
              return (
                <tr key={place?.id ?? 'us'}>
                  <th scope="row">
                    {place?.label ?? 'United States'}
                    <span className="small muted">{role}</span>
                  </th>
                  <td>
                    {money(pay.pay)}
                    {place && pay.scope !== place.kind && <span className="small muted">{pay.scope === 'national' ? 'U.S. figure (no local estimate)' : 'statewide figure'}</span>}
                  </td>
                  <td>{place ? costWords(place.rpp) : 'Average (100)'}</td>
                  <td>{worth ? money(worth) : '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        “What it buys” is the median pay in average-U.S. dollars, so places can be compared fairly. Pay: {WAGE_SOURCE.source}
        {WAGE_SOURCE.asOf ? `, ${WAGE_SOURCE.asOf}` : ''}. Cost of living: {COST_SOURCE}
      </p>
    </div>
  );
}
