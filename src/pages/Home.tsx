import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { hasStarted } from '../lib/profile';
import { CompassBloom, SAMPLE_DIMS } from '../components/CompassBloom';
import { Icon } from '../components/Icon';
import JourneyHome from './JourneyHome';
import { Doors } from '../components/Doors';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const HOW = [
  { icon: 'discover' as const, title: 'Know yourself', text: 'Your gifts, interests, values and the life you want, plus what you already bring.' },
  { icon: 'try' as const, title: 'Test real work', text: 'Reality checks, short simulations and conversations with people who do the work.' },
  { icon: 'path' as const, title: 'Decide with evidence', text: 'Compare options, costs and places, then take one small next step.' },
];

export default function Home() {
  const { profile } = useStore();
  useDocumentTitle(hasStarted(profile) ? 'Home' : undefined);
  if (hasStarted(profile)) return <JourneyHome />;

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
            <p className="hero__note">
              <Icon name="lock" size={16} />
              <span>
                Free and private by default. Coming back? <Link to="/welcome">Enter your journey code</Link>.
              </span>
            </p>
          </div>
          <figure className="hero__art">
            <CompassBloom dims={SAMPLE_DIMS} animate size={340} title="An example Purpose Compass" />
            <figcaption>
              An example <strong>Purpose Compass</strong>. Each petal is one part of you. It grows as you collect evidence.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="section section--doors">
        <div className="wrap">
          <Doors />
        </div>
      </section>

      <section className="section section--mist section--tight">
        <div className="wrap">
          <h2 className="h3 how__title">How Called works</h2>
          <ol className="how">
            {HOW.map((h) => (
              <li key={h.title} className="how__step">
                <Icon name={h.icon} size={22} />
                <h3 className="h4">{h.title}</h3>
                <p>{h.text}</p>
              </li>
            ))}
          </ol>
          <p className="small muted how__note">Called won’t tell you what you’re supposed to do with your life. It helps you gather the evidence to choose well, and keep choosing as you grow.</p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="panel panel--ink purpose-panel">
            <div>
              <h2>Your career is not your purpose.</h2>
              <p className="lead">
                A career is one possible way your gifts, responsibilities, interests and service can come together. Called is built on Christian principles of stewardship, service and wisdom, and it treats calling as larger than a job title.
              </p>
            </div>
            <Link to="/gifts" className="btn btn--secondary">
              Learn about gifts
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
