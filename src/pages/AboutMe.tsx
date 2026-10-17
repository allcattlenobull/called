import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useStore } from '../state/store';
import { computeCompass, compassCompleteness, insights } from '../lib/compass';
import { suggestions, matchCareer } from '../lib/matching';
import { progressCounts } from '../lib/next';
import { CompassBloom } from '../components/CompassBloom';
import { CompassList } from '../components/CompassList';
import { CareerCard } from '../components/CareerCard';
import { Icon } from '../components/Icon';
import { Stat, EmptyState } from '../components/ui';
import { CAREER_BY_ID } from '../data/careers';
import { SIMULATIONS } from '../data/simulations';
import { formatDate } from '../lib/format';
import { learnedInsights, nextBestAction, pathEvidence } from '../lib/path';
import { LevelCard, Quests } from '../components/Game';
import { Reveal } from '../components/motion';
import { JourneyCodeCard } from '../components/JourneyCode';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { COMPLETED_EDUCATION } from '../lib/readiness';
import { ASSESSMENTS } from '../data/assessments';

export default function AboutMe() {
  useDocumentTitle('About me');
  const { profile } = useStore();
  const dims = useMemo(() => computeCompass(profile), [profile]);
  const completeness = Math.round(compassCompleteness(dims) * 100);
  const sugg = useMemo(() => suggestions(profile, 3), [profile]);
  const counts = progressCounts(profile);
  const learned = useMemo(() => Array.from(new Set([...learnedInsights(profile).map((i) => i.text), ...insights(profile)])), [profile]);
  const exploring = profile.saved.map((id) => CAREER_BY_ID[id]).filter(Boolean).slice(0, 3);
  const newSim = SIMULATIONS.find((s) => !profile.simulations.some((r) => r.simulationId === s.id));
  const roadmap = profile.roadmaps.find((r) => r.stage === 'leading') ?? profile.roadmaps.find((r) => r.stage !== 'ruledOut');
  const pathCareer = roadmap ? CAREER_BY_ID[roadmap.careerId] : undefined;
  const pathEv = pathCareer ? pathEvidence(pathCareer, profile) : undefined;
  const pathNext = pathCareer && roadmap && pathEv ? nextBestAction(pathCareer, profile, roadmap, pathEv) : undefined;
  const testing = profile.roadmaps.filter((r) => r.stage !== 'ruledOut').length;
  const recent = [...profile.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2);

  return (
    <div className="wrap dash">
      <header className="pagehead">
        <h1>About me</h1>
        <p className="lead">Everything Called has learned about you, in one place. It grows as you reflect, try things and hear from others.</p>
      </header>

      <section className="grid grid--2 me__basics" aria-label="Where you are and what you’ve done">
        <div className="card">
          <div className="row row--between">
            <h2 className="h4" style={{ margin: 0 }}>Where you are now</h2>
            <Link to="/now" className="small">{profile.current ? 'Edit' : 'Add'}</Link>
          </div>
          {profile.current ? (
            <ul className="plain small">
              {(profile.current.jobTitle || profile.current.careerId) && <li>Work: {profile.current.jobTitle || CAREER_BY_ID[profile.current.careerId!]?.title}</li>}
              {profile.current.education && <li>Education: {COMPLETED_EDUCATION.find((e) => e.value === profile.current!.education)?.label}{profile.current.field ? `, ${profile.current.field}` : ''}</li>}
              {profile.current.credentials && <li>Licenses: {profile.current.credentials}</li>}
            </ul>
          ) : (
            <p className="small muted">Your job, pay, education and skills. Called credits what you already have.</p>
          )}
        </div>
        <div className="card">
          <div className="row row--between">
            <h2 className="h4" style={{ margin: 0 }}>Assessments</h2>
            <Link to="/discover" className="small">All assessments</Link>
          </div>
          <ul className="plain small me__assess">
            {ASSESSMENTS.map((a) => (
              <li key={a.id}>
                <Icon name={profile.completed[a.id] ? 'check' : 'arrowRight'} size={14} />{' '}
                <Link to={`/discover/${a.id}`}>{a.title}</Link>
                {profile.completed[a.id] ? <span className="muted"> · done</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="dash__game">
        <LevelCard />
        <Quests />
      </section>

      <section className="dash__top" aria-labelledby="compass-h">
        <div className="panel dash__compass">
          <div className="row row--between">
            <h2 id="compass-h" className="h3">
              My Purpose Compass
            </h2>
            <span className="tag tag--done">{completeness}% filled in</span>
          </div>
          <div className="dash__compass-body">
            <CompassBloom dims={dims} size={280} animate />
            <CompassList dims={dims} compact />
          </div>
          <Link to="/purpose" className="btn btn--quiet">
            Open my compass
          </Link>
        </div>

        <div className="dash__next">
          <div className="card learned">
            <h2 className="h3">What I’ve learned</h2>
            {learned.length > 0 ? (
              <ul className="reasons">
                {learned.slice(0, 6).map((l) => (
                  <li key={l}>
                    <Icon name="check" size={16} />
                    {l}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted">Patterns show up here as you take assessments, try simulations and reflect.</p>
            )}
          </div>
        </div>
      </section>

      <Reveal as="section" className="section--tight" aria-labelledby="suggest-h">
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
      </Reveal>

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
          <h3>My path</h3>
          {pathCareer && pathEv && pathNext ? (
            <>
              <p className="muted small">
                {roadmap!.stage === 'leading' ? 'Leading path' : 'Testing'}: <strong>{pathCareer.title}</strong> · Evidence: {pathEv.level}
                {testing > 1 ? ` · ${testing} paths in testing` : ''}
              </p>
              <p className="small">
                <strong>Next best step:</strong> {pathNext.title}
              </p>
              <Link to={`/path?career=${pathCareer.id}`}>Open My Path</Link>
            </>
          ) : (
            <p className="muted">
              No path yet. <Link to="/path">Explore one</Link> when a career feels worth testing.
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

      <Reveal as="section" className="section--tight" aria-labelledby="progress-h">
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
      </Reveal>
      <section className="section--tight">
        <JourneyCodeCard />
      </section>
    </div>
  );
}
