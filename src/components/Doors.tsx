import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { JOURNEYS, type Goal } from '../lib/journeys';
import { TERMS_VERSION } from '../lib/terms';
import { Icon } from './Icon';

/**
 * “What brings you here?” Four doors in people’s own words, plus a link for helpers.
 * Choosing a door saves the goal (changeable anytime). By default, journeys start after the
 * guest terms are accepted; looking up a career needs no setup at all.
 */
export function Doors({
  onChoose,
  onSearch,
  current,
  heading = 'What brings you here?',
  headingLevel = 2,
}: {
  onChoose?: (goal: Goal) => void;
  /** Overrides what the career search does (Welcome uses it to finish setup first). */
  onSearch?: (q: string) => void;
  current?: Goal;
  heading?: string;
  headingLevel?: 2 | 3;
}) {
  const { profile, update } = useStore();
  const navigate = useNavigate();
  const [fitOpen, setFitOpen] = useState(false);
  const [q, setQ] = useState('');
  const H = headingLevel === 2 ? 'h2' : 'h3';

  const choose = (goal: Goal) => {
    if (onChoose) return onChoose(goal);
    update((p) => {
      p.goal = goal;
      if (goal === 'change' && !p.stage) p.stage = 'working';
    });
    navigate(profile.guestTermsAcceptedVersion === TERMS_VERSION || profile.onboarded ? '/' : `/welcome?goal=${goal}`);
  };

  const search = (e: FormEvent) => {
    e.preventDefault();
    if (onSearch) return onSearch(q.trim());
    if (onChoose) onChoose('lookup');
    else
      update((p) => {
        if (!p.goal) p.goal = 'lookup';
      });
    navigate(q.trim() ? `/careers?q=${encodeURIComponent(q.trim())}` : '/careers');
  };

  const door = (goal: Goal, body?: React.ReactNode) => {
    const j = JOURNEYS[goal];
    return (
      <li className={`door door--${goal}${current === goal || (goal === 'fit' && current === 'change') ? ' is-current' : ''}`}>
        <span className="door__icon" aria-hidden="true">
          <Icon name={j.icon} size={24} />
        </span>
        <H className="door__title">{j.door}</H>
        <p className="door__text">{j.blurb}</p>
        {body}
      </li>
    );
  };

  return (
    <section className="doors" aria-labelledby="doors-h">
      <H id="doors-h" className="doors__heading">
        {heading}
      </H>
      <ul className="doors__grid">
        {door(
          'purpose',
          <button type="button" className="btn btn--primary door__go" onClick={() => choose('purpose')}>
            Start with my gifts <Icon name="arrowRight" size={18} />
          </button>,
        )}
        {door(
          'fit',
          fitOpen ? (
            <div className="door__branch" role="group" aria-label="Are you working now?">
              <span className="small">Are you working now?</span>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => choose('fit')}>
                No, I’m in school or starting out
              </button>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => choose('change')}>
                Yes, and I want a change
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn--primary door__go" aria-expanded={false} onClick={() => setFitOpen(true)}>
              Find my fit <Icon name="arrowRight" size={18} />
            </button>
          ),
        )}
        {door(
          'lookup',
          <form className="door__search" role="search" onSubmit={search}>
            <label htmlFor="door-search" className="visually-hidden">
              Search careers
            </label>
            <input id="door-search" className="input" type="search" placeholder="e.g. accountant" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
            <button type="submit" className="btn btn--primary" aria-label="Search careers">
              <Icon name="search" size={18} />
            </button>
          </form>,
        )}
        {door(
          'decide',
          <button type="button" className="btn btn--primary door__go" onClick={() => choose('decide')}>
            Compare my options <Icon name="arrowRight" size={18} />
          </button>,
        )}
      </ul>
      <p className="doors__helper">
        <Icon name="user" size={16} />
        <span>
          Helping someone else, as a parent, counselor, pastor or mentor? <Link to="/helping">Start here</Link>
        </span>
      </p>
    </section>
  );
}
