import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useStore } from '../state/store';
import { computeCompass, compassCompleteness, insights } from '../lib/compass';
import { suggestions, matchCareer } from '../lib/matching';
import { nextActions, progressCounts } from '../lib/next';
import { CompassBloom } from '../components/CompassBloom';
import { CompassList } from '../components/CompassList';
import { CareerCard } from '../components/CareerCard';
import { Icon } from '../components/Icon';
import { Stat, EmptyState } from '../components/ui';
import { CAREER_BY_ID } from '../data/careers';
import { SIMULATIONS } from '../data/simulations';
import { formatDate } from '../lib/format';
import { HORIZONS } from '../lib/roadmap';

export default function Dashboard() {
  const { profile } = useStore();
  const dims = useMemo(() => computeCompass(profile), [profile]);
  const completeness = Math.round(compassCompleteness(dims) * 100);
  const sugg = useMemo(() => suggestions(profile, 3), [profile]);
  const actions = nextActions(profile, 3);
  const counts = progressCounts(profile);
  const learned = insights(profile);
  const exploring = profile.saved.map((id) => CAREER_BY_ID[id]).filter(Boolean).slice(0, 3);
  const newSim = SIMULATIONS.find((s) => !profile.simulations.some((r) => r.simulationId === s.id));
  const roadmap = profile.roadmaps[0];
  const openSteps = roadmap?.items.filter((i) => !i.done).slice(0, 3) ?? [];
  const recent = [...profile.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="wrap dash">
      <header className="pagehead">
        <h1>
          {greeting}
          {profile.name ? `, ${profile.name}` : ''}.
        </h1>
        <p className="lead">Here’s what you’ve learned so far, and what’s worth exploring next.</p>
      </header>

      <section className="dash__top" aria-labelledby="compass-h">
        <div className="panel dash__compass">
          <div className="row row--between">
            <h2 id="compass-h" className="h3">
              My Purpose Compass
            </h2>
            <span className="tag tag--done">{completeness}% filled in</span>
          </div>
          <div className="dash__compass-body">
            <CompassBloom dims={dims} size={280} />
            <CompassList dims={dims} compact />
          </div>
          <Link to="/purpose" className="btn btn--quiet">
            Open my compass
          </Link>
        </div>

        <div className="dash__next">
          <h2 className="h3">Continue my journey</h2>
          <ol className="next-list">
            {actions.map((a) => (
              <li key={a.id}>
                <Link to={a.to} className="next-item">
                  <span className={`next-item__kind kind-${a.kind}`} aria-hidden="true">
                    <Icon name={a.kind === 'path' ? 'path' : a.kind === 'careers' ? 'careers' : a.kind} size={18} />
                  </span>
                  <span>
                    <span className="next-item__title">{a.title}</span>
                    <span className="next-item__why">{a.why}</span>
                  </span>
                  <Icon name="arrowRight" size={18} />
                </Link>
              </li>
            ))}
          </ol>

          {learned.length > 0 && (
            <div className="card learned">
              <h3>What I’ve learned</h3>
              <ul className="reasons">
                {learned.slice(0, 4).map((l) => (
                  <li key={l}>
                    <Icon name="check" size={16} />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="section--tight" aria-labelledby="suggest-h">
        <div className="row row--between section-title">
          <h2 id="suggest-h" className="h3">
            Career suggestions
          </h2>
          <Link to="/careers?sort=match">See all matches</Link>
        </div>
        {sugg.length ? (
          <div className="grid grid--3">
            {sugg.map(({ career, match }) => (
              <CareerCard key={career.id} career={career} match={match} />
            ))}
          </div>
        ) : (
          <EmptyState title="Suggestions appear as you add evidence" action={<Link to="/discover/interests" className="btn btn--primary">Start with interests</Link>}>
            Complete one assessment and Called can start organizing careers around you.
          </EmptyState>
        )}
      </section>

      {exploring.length > 0 && (
        <section className="section--tight" aria-labelledby="exploring-h">
          <div className="row row--between section-title">
            <h2 id="exploring-h" className="h3">
              Careers I’m exploring
            </h2>
            <Link to="/compare">Compare them</Link>
          </div>
          <div className="grid grid--3">
            {exploring.map((c) => (
              <CareerCard key={c.id} career={c} match={matchCareer(c, profile)} />
            ))}
          </div>
        </section>
      )}

      <section className="section--tight dash__row">
        {newSim && (
          <Link to={`/try/${newSim.id}`} className="card card--link try-card">
            <span className="tag tag--primary">Try something new</span>
            <h3>{newSim.title}</h3>
            <p className="muted">
              {newSim.role}. {newSim.hook}
            </p>
            <span className="try-card__go">
              Start simulation <Icon name="arrowRight" size={16} />
            </span>
          </Link>
        )}
        <div className="card">
          <h3>My next steps</h3>
          {openSteps.length ? (
            <>
              <p className="muted small">Toward {roadmap.goal}</p>
              <ul className="checklist">
                {openSteps.map((s) => (
                  <li key={s.id}>
                    <Icon name="path" size={16} />
                    <span>
                      {s.text} <span className="muted small">({HORIZONS.find((h) => h.id === s.horizon)?.label})</span>
                    </span>
                  </li>
                ))}
              </ul>
              <Link to="/path">Open My Path</Link>
            </>
          ) : (
            <p className="muted">
              No roadmap yet. <Link to="/path">Build one</Link> when a career feels worth testing.
            </p>
          )}
        </div>
        <div className="card">
          <h3>Recent reflections</h3>
          {recent.length ? (
            <ul className="journal-mini">
              {recent.map((j) => (
                <li key={j.id}>
                  <span className="muted small">{formatDate(j.createdAt)}</span>
                  <p>{j.body.length > 140 ? `${j.body.slice(0, 140)}…` : j.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              Your journal is private to this device. <Link to="/purpose/journal">Write a first reflection</Link>.
            </p>
          )}
        </div>
      </section>

      <section className="section--tight" aria-labelledby="progress-h">
        <h2 id="progress-h" className="h3 section-title">
          Progress
        </h2>
        <div className="stats">
          <Stat value={`${counts.assessments}/6`} label="Assessments completed" />
          <Stat value={counts.careersExplored} label="Careers explored" />
          <Stat value={counts.simulations} label="Simulations completed" />
          <Stat value={counts.experiments} label="Purpose experiments" />
          <Stat value={counts.interviews} label="Career interviews" />
          <Stat value={counts.saved} label="Careers saved" />
          <Stat value={counts.comparisons} label="Paths compared" />
        </div>
      </section>
    </div>
  );
}
