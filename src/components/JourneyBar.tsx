import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../state/store';
import { journeyFor, journeyProgress } from '../lib/journeys';
import { Icon } from './Icon';

/** A slim reminder of where someone is in their journey, on every page but home. */
export function JourneyBar() {
  const { profile } = useStore();
  const { pathname } = useLocation();
  const journey = journeyFor(profile);
  if (!journey || pathname === '/' || pathname === '/welcome') return null;
  const p = journeyProgress(journey, profile);
  const onNext = p.next && pathname === p.next.to.split('#')[0];
  return (
    <nav className="journey-bar" aria-label="Your journey">
      <div className="journey-bar__inner">
        <Link to="/" className="journey-bar__back">
          <Icon name="arrowLeft" size={16} />
          <span>Your journey</span>
        </Link>
        <span className="journey-bar__progress" aria-hidden="true">
          {journey.steps.map((s) => (
            <i key={s.id} className={s.done(profile) ? 'is-done' : s === p.next ? 'is-current' : ''} />
          ))}
        </span>
        <span className="journey-bar__text">
          {p.next ? (
            onNext ? (
              <>
                <strong>Step {p.index + 1} of {p.total}:</strong> {p.next.label}
              </>
            ) : (
              <>
                <strong>Next:</strong> <Link to={p.next.to}>{p.next.label}</Link>
              </>
            )
          ) : (
            <>
              <strong>Journey complete.</strong> <Link to={journey.after.to}>{journey.after.label}</Link>
            </>
          )}
        </span>
      </div>
    </nav>
  );
}
