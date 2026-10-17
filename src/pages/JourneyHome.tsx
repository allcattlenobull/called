import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { CAREER_BY_ID } from '../data/careers';
import { Icon } from '../components/Icon';
import { Doors } from '../components/Doors';
import { EvidenceMeter } from '../components/Game';
import { evidenceProfile } from '../lib/evidence';
import { JOURNEYS, journeyFor, journeyProgress, type Goal } from '../lib/journeys';
import { unfinished } from '../lib/resume';
import { dueOutcomeCheckIns } from '../lib/outcomes';

/** Home for returning people: where you were, your journey, your saved things, your progress. */
export default function JourneyHome() {
  const { profile, update } = useStore();
  const [switching, setSwitching] = useState(false);
  const journey = journeyFor(profile);
  const progress = journey ? journeyProgress(journey, profile) : undefined;
  const resume = unfinished(profile);
  const followUps = useMemo(() => dueOutcomeCheckIns(profile), [profile]);
  const cats = useMemo(() => evidenceProfile(profile), [profile]);
  const saved = profile.saved.map((id) => CAREER_BY_ID[id]).filter(Boolean);
  const paths = profile.roadmaps.filter((r) => r.stage !== 'ruledOut');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const setGoal = (goal: Goal) => {
    update((p) => {
      p.goal = goal;
      if (goal === 'change' && !p.stage) p.stage = 'working';
    });
    setSwitching(false);
  };

  return (
    <div className="wrap home-journey">
      <header className="pagehead">
        <h1>
          {greeting}
          {profile.name ? `, ${profile.name}` : ''}.
        </h1>
        <p className="lead">{journey ? journey.question : 'Pick what you’re here for, and Called will guide you one step at a time.'}</p>
      </header>

      {resume.length > 0 && (
        <section className="resume" aria-labelledby="resume-h">
          <h2 id="resume-h" className="h4">
            Pick up where you left off
          </h2>
          <ul className="resume-list">
            {resume.slice(0, 3).map((r) => (
              <li key={r.id}>
                <Link to={r.to} className="resume-item">
                  <span className="resume-item__ring" style={{ ['--p' as string]: r.progress }} aria-hidden="true" />
                  <span>
                    <span className="resume-item__title">{r.title}</span>
                    <span className="resume-item__detail">{r.detail}</span>
                  </span>
                  <Icon name="arrowRight" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {followUps.length > 0 && (
        <section className="callout callout--evidence" aria-labelledby="follow-up-h">
          <Icon name="check" size={20} />
          <div>
            <strong id="follow-up-h" className="callout__title">A follow-up is ready</strong>
            <div>
              Tell us what happened after a simulation. It takes about a minute and never changes your match score. <Link to="/research/check-in">Check in now</Link>
            </div>
          </div>
        </section>
      )}

      {journey && progress && !switching ? (
        <section className="journey-card" aria-labelledby="journey-h">
          <div className="journey-card__head">
            <div>
              <span className="eyebrow">Your journey</span>
              <h2 id="journey-h" className="journey-card__title">
                {journey.goal === 'change' ? 'Change careers without starting over' : journey.door}
              </h2>
            </div>
            <span className="tag tag--done">
              {progress.done} of {progress.total} done
            </span>
          </div>

          {progress.next ? (
            <div className="journey-next">
              <span className="journey-next__label">
                Step {progress.index + 1}: {progress.next.label}
              </span>
              <p className="journey-next__why">{progress.next.why}</p>
              <Link to={progress.next.to} className="btn btn--primary btn--lg">
                {progress.next.cta} <Icon name="arrowRight" size={18} />
              </Link>
            </div>
          ) : (
            <div className="journey-next">
              <span className="journey-next__label">You’ve finished this journey</span>
              <p className="journey-next__why">That’s real evidence about yourself. Keep testing, or take the natural next step.</p>
              <Link
                to={journey.after.to}
                className="btn btn--primary btn--lg"
                onClick={() => journey.after.goal && update((p) => void (p.goal = journey.after.goal))}
              >
                {journey.after.label} <Icon name="arrowRight" size={18} />
              </Link>
            </div>
          )}

          <ol className="journey-steps" aria-label="Steps">
            {journey.steps.map((s, i) => {
              const done = s.done(profile);
              const current = s === progress.next;
              return (
                <li key={s.id} className={`journey-step${done ? ' is-done' : ''}${current ? ' is-current' : ''}`} aria-current={current ? 'step' : undefined}>
                  <span className="journey-step__mark" aria-hidden="true">
                    {done ? <Icon name="check" size={14} /> : i + 1}
                  </span>
                  <Link to={s.to} className="journey-step__label">
                    {s.label}
                    <span className="visually-hidden">{done ? ' (done)' : current ? ' (next)' : ''}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <button type="button" className="linkish small" onClick={() => setSwitching(true)}>
            Here for something else? Change what I’m working on
          </button>
        </section>
      ) : (
        <div className="journey-switch">
          <Doors heading="What would you like to explore today?" current={profile.goal} onChoose={setGoal} />
          {journey && (
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setSwitching(false)}>
              Keep my current journey
            </button>
          )}
        </div>
      )}

      <div className="grid grid--2 home-journey__row">
        <section className="card" aria-labelledby="saved-h">
          <div className="row row--between">
            <h2 id="saved-h" className="h4" style={{ margin: 0 }}>
              Saved careers and paths
            </h2>
            {saved.length > 1 && (
              <Link to="/compare" className="small">
                Compare
              </Link>
            )}
          </div>
          {saved.length || paths.length ? (
            <ul className="saved-list">
              {paths.map((r) => (
                <li key={`p-${r.careerId}`}>
                  <Link to={`/path?career=${r.careerId}`}>
                    <Icon name="path" size={16} /> {r.goal}
                  </Link>
                  <span className="tag">{r.stage === 'leading' ? 'Leading path' : 'Testing'}</span>
                </li>
              ))}
              {saved
                .filter((c) => !paths.some((r) => r.careerId === c.id))
                .slice(0, 6)
                .map((c) => (
                  <li key={c.id}>
                    <Link to={`/careers/${c.id}`}>
                      <Icon name="bookmarkFilled" size={16} /> {c.title}
                    </Link>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="small muted">
              Nothing saved yet. <Link to="/careers">Find careers</Link> and tap the bookmark to keep them here.
            </p>
          )}
        </section>

        <section className="card" aria-labelledby="ev-home-h">
          <div className="row row--between">
            <h2 id="ev-home-h" className="h4" style={{ margin: 0 }}>
              What you’ve gathered
            </h2>
            <Link to="/me" className="small">
              About me
            </Link>
          </div>
          <EvidenceMeter cats={cats} compact />
        </section>
      </div>

      {journey && (
        <p className="small muted home-journey__more">
          Other journeys:{' '}
          {(['purpose', 'fit', 'lookup', 'decide'] as Goal[])
            .filter((g) => g !== journey.goal && !(g === 'fit' && journey.goal === 'change'))
            .map((g, i) => (
              <span key={g}>
                {i > 0 && ' · '}
                <button type="button" className="linkish" onClick={() => setGoal(g)}>
                  {JOURNEYS[g].door}
                </button>
              </span>
            ))}
        </p>
      )}
    </div>
  );
}
