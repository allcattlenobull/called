import { Link } from 'react-router-dom';
import { SIMULATIONS } from '../../data/simulations';
import { EXPERIMENTS } from '../../data/purpose-experiments';
import { CAREER_BY_ID } from '../../data/careers';
import { useStore } from '../../state/store';
import { PageHeader } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export default function TryIt() {
  useDocumentTitle('Try It');
  const { profile } = useStore();
  const doneExps = profile.experiments.filter((e) => e.status === 'done').length;
  return (
    <div className="wrap">
      <PageHeader title="Try the work" lead="Reading about a career only goes so far. These short simulations put you inside a real problem from that kind of work. Afterward, you reflect, and your recommendations adjust to what you actually enjoyed." />

      <section aria-labelledby="sims-h">
        <div className="row row--between section-title">
          <h2 id="sims-h" className="h3">
            Career simulations
          </h2>
          <span className="small muted">
            {new Set(profile.simulations.map((s) => s.simulationId)).size} of {SIMULATIONS.length} completed
          </span>
        </div>
        <div className="grid grid--3">
          {SIMULATIONS.map((s) => {
            const result = [...profile.simulations].reverse().find((r) => r.simulationId === s.id);
            return (
              <article key={s.id} className="card card--link sim-card">
                <div className="row row--between">
                  <span className="tag tag--primary">{s.role}</span>
                  {result ? (
                    <span className="tag tag--done">
                      <Icon name="check" size={14} /> Enjoyed {result.enjoyment}/5
                    </span>
                  ) : (
                    <span className="tag">
                      <Icon name="clock" size={14} /> {s.minutes} min
                    </span>
                  )}
                </div>
                <h3>
                  <Link to={`/try/${s.id}`} className="stretched">
                    {s.title}
                  </Link>
                </h3>
                <p className="muted small">{s.hook}</p>
                <p className="small sim-card__careers">
                  Related: {s.careerIds.slice(0, 3).map((c) => CAREER_BY_ID[c]?.title).filter(Boolean).join(', ')}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section" aria-labelledby="exp-h">
        <div className="panel panel--purpose">
          <div className="row row--between">
            <h2 id="exp-h" className="h3" style={{ margin: 0 }}>
              Purpose experiments
            </h2>
            <span className="small muted">{doneExps} completed</span>
          </div>
          <p style={{ marginTop: 'var(--s-3)' }}>Some evidence can only come from real life. Purpose experiments are small, safe things to try this week, followed by honest questions when you return.</p>
          <div className="exp-strip">
            {EXPERIMENTS.slice(0, 4).map((e) => (
              <Link key={e.id} to={`/try/experiments/${e.id}`} className="exp-chip">
                <strong>{e.title}</strong>
                <span className="small muted">{e.hypothesis}</span>
              </Link>
            ))}
          </div>
          <Link to="/try/experiments" className="btn btn--secondary">
            See all {EXPERIMENTS.length} experiments
          </Link>
        </div>
      </section>
    </div>
  );
}
