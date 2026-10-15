import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../state/store';
import { CAREER_BY_ID, CAREERS } from '../../data/careers';
import { generateRoadmap, HORIZONS } from '../../lib/roadmap';
import { progressCounts } from '../../lib/next';
import { uid } from '../../lib/profile';
import { EmptyState, PageHeader, Stat } from '../../components/ui';
import { Icon } from '../../components/Icon';
import type { RoadmapItem } from '../../types';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export default function MyPath() {
  useDocumentTitle('My Path');
  const { profile, update } = useStore();
  const [activeIdx, setActiveIdx] = useState(0);
  const [newCareer, setNewCareer] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const counts = progressCounts(profile);
  const roadmap = profile.roadmaps[Math.min(activeIdx, profile.roadmaps.length - 1)];
  const candidates = [...profile.saved.map((id) => CAREER_BY_ID[id]).filter(Boolean), ...CAREERS.filter((c) => !profile.saved.includes(c.id))].filter((c) => !profile.roadmaps.some((r) => r.careerId === c.id));

  const create = () => {
    const c = CAREER_BY_ID[newCareer];
    if (!c) return;
    update((p) => {
      p.roadmaps.unshift(generateRoadmap(c));
    });
    setActiveIdx(0);
    setNewCareer('');
  };

  const editItem = (itemId: string, fn: (i: RoadmapItem) => void) =>
    update((p) => {
      const r = p.roadmaps.find((x) => x.careerId === roadmap.careerId);
      const item = r?.items.find((i) => i.id === itemId);
      if (item) fn(item);
    });

  const total = roadmap?.items.length ?? 0;
  const done = roadmap?.items.filter((i) => i.done).length ?? 0;

  return (
    <div className="wrap">
      <PageHeader title="My Path" lead="A roadmap turns one possibility into small, real steps. It’s not a commitment for life; it’s the next experiment. Edit anything.">
        <Link to="/path/report" className="btn btn--secondary">
          <Icon name="print" size={18} /> Create my Called report
        </Link>
      </PageHeader>

      {profile.roadmaps.length > 1 && (
        <div className="segmented roadmap-tabs" role="group" aria-label="Choose a roadmap">
          {profile.roadmaps.map((r, i) => (
            <button key={r.careerId} type="button" aria-pressed={r.careerId === roadmap.careerId} onClick={() => setActiveIdx(i)}>
              {r.goal}
            </button>
          ))}
        </div>
      )}

      {roadmap ? (
        <section className="roadmap" aria-labelledby="goal-h">
          <div className="roadmap__head">
            <div>
              <span className="small muted">Goal</span>
              <h2 id="goal-h" style={{ margin: 0 }}>
                <Link to={`/careers/${roadmap.careerId}`} className="goal-link">
                  {roadmap.goal}
                </Link>
              </h2>
            </div>
            <div className="roadmap__meter">
              <span className="small muted">
                {done} of {total} steps done
              </span>
              <div className="progress__track" aria-hidden="true">
                <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
          <div className="roadmap__cols">
            {HORIZONS.map((h) => (
              <div key={h.id} className="roadmap__col">
                <h3 className="h4">{h.label}</h3>
                <ul className="steps">
                  {roadmap.items
                    .filter((i) => i.horizon === h.id)
                    .map((item) => (
                      <li key={item.id} className={`step${item.done ? ' is-done' : ''}`}>
                        <label className="step__check">
                          <input type="checkbox" checked={item.done} onChange={(e) => editItem(item.id, (i) => void (i.done = e.target.checked))} />
                          <span className="visually-hidden">Mark “{item.text}” {item.done ? 'not done' : 'done'}</span>
                        </label>
                        {editing === item.id ? (
                          <input
                            className="input input--inline"
                            defaultValue={item.text}
                            autoFocus
                            aria-label="Edit step"
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              if (v) editItem(item.id, (i) => void (i.text = v));
                              setEditing(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              if (e.key === 'Escape') setEditing(null);
                            }}
                          />
                        ) : (
                          <span className="step__text">{item.text}</span>
                        )}
                        <span className="step__actions">
                          <button type="button" className="btn btn--icon btn--sm" aria-label={`Edit “${item.text}”`} onClick={() => setEditing(item.id)}>
                            <Icon name="edit" size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn btn--icon btn--sm"
                            aria-label={`Delete “${item.text}”`}
                            onClick={() =>
                              update((p) => {
                                const r = p.roadmaps.find((x) => x.careerId === roadmap.careerId);
                                if (r) r.items = r.items.filter((i) => i.id !== item.id);
                              })
                            }
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </span>
                      </li>
                    ))}
                </ul>
                <form
                  className="step-add"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = drafts[h.id]?.trim();
                    if (!text) return;
                    update((p) => {
                      const r = p.roadmaps.find((x) => x.careerId === roadmap.careerId);
                      r?.items.push({ id: uid('step'), text, horizon: h.id, done: false });
                    });
                    setDrafts((d) => ({ ...d, [h.id]: '' }));
                  }}
                >
                  <label htmlFor={`add-${h.id}`} className="visually-hidden">
                    Add a step for {h.label.toLowerCase()}
                  </label>
                  <input id={`add-${h.id}`} className="input" placeholder="Add a step" value={drafts[h.id] ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [h.id]: e.target.value }))} />
                  <button type="submit" className="btn btn--icon" aria-label={`Add step to ${h.label.toLowerCase()}`}>
                    <Icon name="plus" />
                  </button>
                </form>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 'var(--s-4)' }}>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => {
                if (!window.confirm(`Delete the ${roadmap.goal} roadmap?`)) return;
                update((p) => void (p.roadmaps = p.roadmaps.filter((r) => r.careerId !== roadmap.careerId)));
                setActiveIdx(0);
              }}
            >
              <Icon name="trash" size={16} /> Delete this roadmap
            </button>
          </div>
        </section>
      ) : (
        <EmptyState icon="path" title="No roadmap yet">
          Pick a career you want to test. Called will draft steps for now, the next six months and the next year, and you can change all of them.
        </EmptyState>
      )}

      <section className="card new-roadmap" aria-labelledby="new-h">
        <h2 id="new-h" className="h3">
          {profile.roadmaps.length ? 'Start another roadmap' : 'Start a roadmap'}
        </h2>
        <div className="row">
          <label htmlFor="new-career" className="visually-hidden">
            Career goal
          </label>
          <select id="new-career" className="select" value={newCareer} onChange={(e) => setNewCareer(e.target.value)} style={{ maxWidth: 360 }}>
            <option value="">Choose a career…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
                {profile.saved.includes(c.id) ? ' (saved)' : ''}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn--primary" disabled={!newCareer} onClick={create}>
            Create roadmap
          </button>
        </div>
      </section>

      <section className="section" aria-labelledby="prog-h">
        <h2 id="prog-h" className="h3 section-title">
          Your progress
        </h2>
        <p className="muted">Evidence you’ve gathered so far. There’s no finish line, only a clearer picture.</p>
        <div className="stats">
          <Stat value={counts.assessments} label="Assessments completed" />
          <Stat value={counts.careersExplored} label="Careers explored" />
          <Stat value={counts.simulations} label="Career simulations completed" />
          <Stat value={counts.interviews} label="Career interviews completed" />
          <Stat value={counts.experiments} label="Purpose experiments completed" />
          <Stat value={counts.saved} label="Careers saved" />
          <Stat value={counts.comparisons} label="Paths compared" />
          <Stat value={counts.reflections} label="Journal reflections" />
        </div>
      </section>
    </div>
  );
}
