import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { SIMULATIONS } from '../../data/simulations';
import { SIMULATION_CATEGORIES, SIMULATION_EVIDENCE, type SimulationCategory } from '../../data/simulations/evidence';
import { EXPERIMENTS } from '../../data/purpose-experiments';
import { CAREER_BY_ID } from '../../data/careers';
import { useStore } from '../../state/store';
import { PageHeader } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { suggestions } from '../../lib/matching';
import { smartSearchScore } from '../../lib/smartSearch';

export default function TryIt() {
  useDocumentTitle('Try It');
  const { profile } = useStore();
  const doneExps = profile.experiments.filter((e) => e.status === 'done').length;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SimulationCategory | ''>('');
  const [status, setStatus] = useState<'all' | 'new' | 'done'>('all');
  const recommendationOrder = useMemo(() => {
    const order = new Map<string, number>();
    suggestions(profile, 30).forEach(({ career }, index) => {
      for (const sim of SIMULATIONS) if (sim.careerIds.includes(career.id) && !order.has(sim.id)) order.set(sim.id, index);
    });
    return order;
  }, [profile]);
  const simulations = useMemo(() => {
    const done = new Set(profile.simulations.map((result) => result.simulationId));
    const q = query.trim();
    return SIMULATIONS.filter((sim) => {
      const evidence = SIMULATION_EVIDENCE[sim.id];
      if (category && evidence.category !== category) return false;
      if (status === 'done' && !done.has(sim.id)) return false;
      if (status === 'new' && done.has(sim.id)) return false;
      if (!q) return true;
      const careers = sim.careerIds.map((id) => CAREER_BY_ID[id]?.title ?? '').join(' ');
      return smartSearchScore(q, [sim.title, sim.role, sim.hook, careers, evidence.category, evidence.constructs.join(' ')]) >= 0;
    }).sort((a, b) => q ? smartSearchScore(q, [b.title, b.role, b.hook, SIMULATION_EVIDENCE[b.id].constructs.join(' ')]) - smartSearchScore(q, [a.title, a.role, a.hook, SIMULATION_EVIDENCE[a.id].constructs.join(' ')]) : (recommendationOrder.get(a.id) ?? 999) - (recommendationOrder.get(b.id) ?? 999));
  }, [category, profile.simulations, query, recommendationOrder, status]);
  return (
    <div className="wrap">
      <PageHeader title="Try the work" lead="Reading about a career only goes so far. These short simulations put you inside a real problem from that kind of work. Afterward, you reflect, and your recommendations adjust to what you actually enjoyed." />

      <div className="sim-explorer" aria-label="Find a simulation">
        <div className="field sim-explorer__search">
          <label htmlFor="sim-search">Search simulations</label>
          <div className="search">
            <Icon name="search" size={18} />
            <input id="sim-search" className="input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “science,” “helping,” or a close spelling" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="sim-category">Type of work</label>
          <select id="sim-category" className="select" value={category} onChange={(event) => setCategory(event.target.value as SimulationCategory | '')}>
            <option value="">All categories</option>
            {SIMULATION_CATEGORIES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sim-status">Progress</label>
          <select id="sim-status" className="select" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="all">All simulations</option>
            <option value="new">Not completed</option>
            <option value="done">Completed</option>
          </select>
        </div>
      </div>

      <section aria-labelledby="sims-h">
        <div className="row row--between section-title">
          <h2 id="sims-h" className="h3">
            Career simulations
          </h2>
          <span className="small muted">
            {simulations.length} shown · {new Set(profile.simulations.map((s) => s.simulationId)).size} of {SIMULATIONS.length} completed
          </span>
        </div>
        <div className="grid grid--3">
          {simulations.map((s) => {
            const result = [...profile.simulations].reverse().find((r) => r.simulationId === s.id);
            const evidence = SIMULATION_EVIDENCE[s.id];
            const recommended = recommendationOrder.has(s.id) && (recommendationOrder.get(s.id) ?? 999) < 8;
            return (
              <article key={s.id} className="card card--link sim-card">
                <div className="row row--between">
                  <span className="row sim-card__tags">
                    <span className="tag tag--primary">{s.role}</span>
                    {recommended && <span className="tag tag--purpose">Recommended</span>}
                  </span>
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
                <p className="small muted sim-card__evidence">{evidence.category} · v{evidence.version} · {evidence.evidenceStatus}</p>
              </article>
            );
          })}
        </div>
        {!simulations.length && (
          <div className="empty">
            <h3 className="empty__title">No simulations match those filters</h3>
            <button type="button" className="btn btn--secondary" onClick={() => { setQuery(''); setCategory(''); setStatus('all'); }}>Clear filters</button>
          </div>
        )}
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
