import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { hasStarted } from '../lib/profile';
import { CompassBloom, SAMPLE_DIMS } from '../components/CompassBloom';
import { Icon } from '../components/Icon';
import { CAREER_BY_ID } from '../data/careers';
import { matchCareer } from '../lib/matching';
import { emptyProfile } from '../lib/profile';
import type { Profile } from '../types';
import { Conflicts, EvidenceBadge, FitStrip, MatchBars, OverallScore } from '../components/Match';
import { SIMULATIONS } from '../data/simulations';
import Dashboard from './Dashboard';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { Reveal } from '../components/motion';

const JOURNEY = [
  { title: 'Discover yourself', text: 'Interests, skills, aptitudes, values and the life you want.' },
  { title: 'Explore your purpose', text: 'Your gifts, who you want to serve, and the problems you can’t ignore.' },
  { title: 'Find possibilities', text: 'Careers matched on eight visible dimensions, with the reasons shown.' },
  { title: 'Try the work', text: 'Short simulations and real-world experiments that produce evidence.' },
  { title: 'Reflect', text: 'What did you enjoy? What drained you? Your compass updates.' },
  { title: 'Build your path', text: 'A roadmap of small, real next steps you can actually take.' },
];

/** A sample profile so the home page can show a real, explainable match. */
function sampleProfile(): Profile {
  const p = emptyProfile();
  Object.assign(p.interests, { i4: 1, i10: 1, i16: 1, i22: 1, i28: 1, i2: 1, i8: 1, i6: 0, i12: 1 });
  p.values = { helping: 'essential', stability: 'essential', meaningful: 'important', familyTime: 'important', income: 'somewhat' };
  p.lifestyle = { trainingYears: 'four', debt: 'small', income: 'comfortable', schedule: 'regular' };
  p.serves = ['patients', 'families'];
  p.gifts = ['mercy', 'encouraging'];
  p.problems = ['health'];
  p.skills = { empathy: 3, communication: 2, organization: 2 };
  return p;
}

export default function Home() {
  const { profile } = useStore();
  useDocumentTitle(hasStarted(profile) ? 'Home' : undefined);
  if (hasStarted(profile)) return <Dashboard />;

  const sample = sampleProfile();
  const career = CAREER_BY_ID['registered-nurse'];
  const match = matchCareer(career, sample);

  return (
    <>
      <section className="hero">
        <div className="wrap hero__inner">
          <div className="hero__copy">
            <h1 className="hero__title" aria-label="You don’t need your whole life figured out.">
              {'You don’t need your whole life figured out.'.split(' ').map((w, i) => (
                <span key={i} aria-hidden="true">
                  <span className="hero__word" style={{ ['--i' as string]: i }}>
                    {w}
                  </span>{' '}
                </span>
              ))}
            </h1>
            <p className="hero__lead"><strong>AI gives everyone answers. Called helps you gather the evidence to trust your own.</strong> Try real work, test assumptions, and build a path that fits who you’re becoming.</p>
            <div className="row">
              <Link to="/welcome" className="btn btn--primary btn--lg">
                Start your journey
              </Link>
              <Link to="/careers" className="btn btn--secondary btn--lg">
                Explore careers
              </Link>
            </div>
            <p className="hero__note">
              <Icon name="lock" size={16} /> Private by default. <Link to="/welcome">Your journey code is your account key.</Link>
            </p>
          </div>
          <figure className="hero__art">
            <CompassBloom dims={SAMPLE_DIMS} animate size={460} title="An example Purpose Compass" />
            <figcaption>
              An example <strong>Purpose Compass</strong>. Each petal is one part of you. It grows as you collect evidence.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="section section--mist">
        <div className="wrap">
          <div className="intro-split"><h2>Information is easy. Evidence is earned.</h2><p className="lead">A chatbot can describe a career. Called is built for the parts you have to do: try the work, talk to people, notice what fits, rule paths out, and keep a record that becomes more useful over time.</p></div>
          <div className="grid grid--4 moat-grid">
            <article className="card"><Icon name="try" size={22} /><h3>Do the work</h3><p>Simulations, experiments, interviews, observations, and job shadows turn curiosity into evidence.</p></article>
            <article className="card"><Icon name="path" size={22} /><h3>Keep the record</h3><p>Your reactions, conflicts, decisions, and changing interest stay structured instead of disappearing into a chat.</p></article>
            <article className="card"><Icon name="alert" size={22} /><h3>Invite pushback</h3><p>Reality checks and visible conflicts help slow down a flattering or premature answer.</p></article>
            <article className="card"><Icon name="user" size={22} /><h3>Bring in people</h3><p>Counselors, parents, mentors, employers, unions, and associations add context a general assistant cannot supply.</p></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="intro-split">
            <h2>Not a quiz that hands you an answer.</h2>
            <p className="lead">
              Called won’t tell you what you’re supposed to do with your life. It helps you collect evidence about who you are, what you value, what you’re good at, and what work is actually like, so you can choose well and keep choosing as you grow.
            </p>
          </div>
          <ol className="journey" aria-label="How Called works">
            {JOURNEY.map((j, i) => (
              <Reveal as="li" key={j.title} className="journey__step" delay={i * 90}>
                <h3>{j.title}</h3>
                <p>{j.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--mist">
        <div className="wrap">
          <div className="example-head">
            <h2>Every recommendation shows its reasoning.</h2>
            <p className="lead">No black-box number. Eight dimensions you can see, the reasons behind them, and the tensions worth thinking through.</p>
          </div>
          <Reveal className="example">
            <div className="example__card">
              <div className="row row--between">
                <div>
                  <p className="muted small" style={{ margin: 0 }}>
                    Example for someone who values helping and stability
                  </p>
                  <h3 style={{ margin: '4px 0 0' }}>{career.title}</h3>
                </div>
                <OverallScore match={match} />
              </div>
              <div className="row" style={{ margin: 'var(--s-3) 0 var(--s-4)' }}>
                <FitStrip match={match} />
                <EvidenceBadge confidence={match.confidence} />
              </div>
              {match.explanation && <p>{match.explanation}</p>}
              <MatchBars match={match} />
            </div>
            <div className="example__notes">
              <div className="card">
                <h3>Why it appeared</h3>
                <ul className="reasons">
                  {Object.values(match.dimensions)
                    .flatMap((d) => d.reasons)
                    .slice(0, 4)
                    .map((r) => (
                      <li key={r}>
                        <Icon name="check" size={16} />
                        {r}
                      </li>
                    ))}
                </ul>
              </div>
              <div className="card">
                <h3>Potential conflicts</h3>
                <Conflicts match={match} />
              </div>
              <div className="card">
                <h3>Then, a reality check</h3>
                <p className="muted">What people imagine versus what the work actually looks like, followed by one honest question: does this still sound interesting?</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="example-head">
            <h2>Try the work before you choose it.</h2>
            <p className="lead">Short simulations put you inside a real problem. Afterward you reflect, and your recommendations adjust to what you actually enjoyed.</p>
          </div>
          <div className="sim-strip">
            {SIMULATIONS.slice(0, 6).map((s, i) => (
              <Link key={s.id} to={`/try/${s.id}`} className="sim-chip reveal-child" style={{ ['--i' as string]: i }}>
                <span className="sim-chip__role">{s.role}</span>
                <span className="sim-chip__title">{s.title}</span>
                <span className="sim-chip__time">
                  <Icon name="clock" size={14} /> {s.minutes} min
                </span>
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 'var(--s-4)' }}>
            <Link to="/try">See all {SIMULATIONS.length} simulations and purpose experiments</Link>
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="panel panel--ink purpose-panel">
            <div>
              <h2>Your career is not your purpose.</h2>
              <p className="lead">
                A career is one possible way your gifts, responsibilities, interests and service can come together. Called is built on Christian principles of stewardship, service and wisdom, and it treats calling as larger than a job title.
              </p>
            </div>
            <ul className="principle-pills" aria-label="Principles behind Called">
              {['Stewardship', 'Service', 'Wisdom', 'Diligence', 'Gifts', 'Good work', 'Calling', 'Purpose'].map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <Link to="/purpose/principles" className="btn btn--secondary">
              Read the principles
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap closing">
          <h2>Start with what you already know about yourself.</h2>
          <p className="lead">Five minutes is enough to begin. Come back anytime; Called gets more useful the longer you use it.</p>
          <div className="row">
            <Link to="/welcome" className="btn btn--primary btn--lg">
              Start your journey
            </Link>
            <Link to="/about" className="btn btn--quiet btn--lg">
              How Called works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
