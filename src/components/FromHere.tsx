import { Link } from 'react-router-dom';
import { CAREER_BY_ID } from '../data/careers';
import { money } from '../lib/format';
import { homePlace, localPay } from '../lib/places';
import { readiness, readinessLabel, skillLabels, transferableSkills } from '../lib/readiness';
import type { Career, Profile } from '../types';

/** “From where you are now”: school still needed, skills that carry over and the pay change. */
export function FromHere({ career, profile }: { career: Career; profile: Profile }) {
  const cur = profile.current;
  if (!cur) {
    return (
      <section className="card from-here from-here--empty" aria-labelledby="from-here-h">
        <h2 id="from-here-h" className="h4">
          Already have a job, degree or license?
        </h2>
        <p className="small">Tell Called where you are now and this page will show how much more school this would take from there, which of your skills carry over, and how the pay compares with what you earn.</p>
        <Link to="/now" className="btn btn--secondary btn--sm">
          Add where you are now
        </Link>
      </section>
    );
  }
  const r = readiness(career, profile);
  const skills = transferableSkills(career, profile);
  const pay = localPay(career, homePlace(profile));
  const change = cur.pay ? pay.pay - cur.pay : undefined;
  const from = cur.jobTitle || (cur.careerId ? CAREER_BY_ID[cur.careerId]?.title : undefined);
  return (
    <section className="card from-here" aria-labelledby="from-here-h">
      <div className="row row--between">
        <h2 id="from-here-h" className="h4" style={{ margin: 0 }}>
          From where you are now{from ? ` (${cur.jobTitle ? from : from.toLowerCase()})` : ''}
        </h2>
        {r && <span className={`tag ${r.kind === 'ready' ? 'tag--done' : 'tag--primary'}`}>{readinessLabel(r)}</span>}
      </div>
      <dl className="move__facts">
        <div>
          <dt>School or training</dt>
          <dd>{r ? r.summary : 'Add your education to see what counts.'}</dd>
        </div>
        <div>
          <dt>Skills you bring</dt>
          <dd>{skills.length ? `${skillLabels(skills).join(', ')} (${skills.length} of ${career.skills.length} this work uses)` : 'Few of your rated skills overlap yet.'}</dd>
        </div>
        {change !== undefined && (
          <div>
            <dt>Pay compared with now</dt>
            <dd>
              {money(pay.pay)} ({pay.label}), {change >= 0 ? `about ${money(change)} more` : `about ${money(-change)} less`} than you earn. Starting pay after a switch is often lower than the median.
            </dd>
          </div>
        )}
      </dl>
      {r?.note && <p className="small muted" style={{ margin: 0 }}>{r.note}</p>}
      <div className="row">
        {r && r.years > 0 && (
          <Link to={`/compare/education?career=${career.id}`} className="btn btn--secondary btn--sm">
            Cost and payoff from here
          </Link>
        )}
        <Link to="/now" className="btn btn--quiet btn--sm">
          Edit where you are now
        </Link>
      </div>
    </section>
  );
}
