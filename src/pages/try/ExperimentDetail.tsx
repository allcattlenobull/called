import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EXPERIMENT_BY_ID, EXPERIMENT_SCALE } from '../../data/purpose-experiments';
import { CAREERS } from '../../data/careers';
import { useStore } from '../../state/store';
import { Callout, OptionGroup, PageHeader } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { formatDate } from '../../lib/format';
import NotFound from '../NotFound';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export default function ExperimentDetail() {
  const { id = '' } = useParams();
  const exp = EXPERIMENT_BY_ID[id];
  useDocumentTitle(exp?.title);
  const { profile, update } = useStore();
  const log = profile.experiments.find((x) => x.experimentId === id);
  const [answers, setAnswers] = useState<Record<string, number>>(log?.answers ?? {});
  const [notes, setNotes] = useState(log?.notes ?? '');
  const [editing, setEditing] = useState(false);
  if (!exp) return <NotFound />;

  const related = CAREERS.filter((c) => c.experimentIds?.includes(id)).slice(0, 6);
  const complete = exp.questions.every((q) => answers[q.id]);

  const startExperiment = () =>
    update((p) => {
      p.experiments = p.experiments.filter((x) => x.experimentId !== id);
      p.experiments.push({ experimentId: id, status: 'planned', startedAt: new Date().toISOString() });
    });

  const saveResults = () =>
    update((p) => {
      const existing = p.experiments.find((x) => x.experimentId === id);
      const entry = { experimentId: id, status: 'done' as const, startedAt: existing?.startedAt ?? new Date().toISOString(), completedAt: new Date().toISOString(), answers, notes: notes.trim() || undefined };
      p.experiments = [...p.experiments.filter((x) => x.experimentId !== id), entry];
    });

  const showForm = log && (log.status === 'planned' || editing);

  return (
    <div className="wrap wrap--narrow">
      <PageHeader title={exp.title} lead={exp.hypothesis} back={{ to: '/try/experiments', label: 'Purpose experiments' }} />
      <section className="card stack">
        <h2 className="h3">The experiment</h2>
        <ol className="exp-steps">
          {exp.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="small muted">
          <Icon name="clock" size={14} /> {exp.time}
        </p>
        {exp.safety && (
          <Callout tone="warn" title="Stay safe">
            {exp.safety}
          </Callout>
        )}
        {!log && (
          <button type="button" className="btn btn--primary" onClick={startExperiment}>
            I’ll try this
          </button>
        )}
      </section>

      {log?.status === 'planned' && (
        <p className="small muted" style={{ marginTop: 'var(--s-4)' }}>
          You committed to this on {formatDate(log.startedAt)}. Come back after you’ve done it.
        </p>
      )}

      {showForm && (
        <section className="panel panel--purpose stack" style={{ marginTop: 'var(--s-5)' }} aria-labelledby="return-h">
          <h2 id="return-h" className="h3">
            After you’ve done it
          </h2>
          {exp.questions.map((q) => (
            <OptionGroup key={q.id} legend={q.text} layout="row" value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} options={EXPERIMENT_SCALE} />
          ))}
          <div className="field">
            <label htmlFor="exp-notes">What did you learn about yourself?</label>
            <textarea id="exp-notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!complete}
            onClick={() => {
              saveResults();
              setEditing(false);
            }}
          >
            Save what I learned
          </button>
        </section>
      )}

      {log?.status === 'done' && !editing && (
        <section className="card stack" style={{ marginTop: 'var(--s-5)' }} aria-labelledby="result-h">
          <div className="row row--between">
            <h2 id="result-h" className="h3" style={{ margin: 0 }}>
              What you found
            </h2>
            <span className="tag tag--done">Completed {log.completedAt && formatDate(log.completedAt)}</span>
          </div>
          <ul className="plain">
            {exp.questions.map((q) => (
              <li key={q.id} className="row row--between">
                <span>{q.text}</span>
                <strong>{EXPERIMENT_SCALE.find((s) => s.value === log.answers?.[q.id])?.label}</strong>
              </li>
            ))}
          </ul>
          {log.notes && <p>{log.notes}</p>}
          <button type="button" className="btn btn--quiet" onClick={() => setEditing(true)}>
            Update my answers
          </button>
        </section>
      )}

      {related.length > 0 && (
        <section style={{ marginTop: 'var(--s-6)' }} aria-labelledby="rel-h">
          <h2 id="rel-h" className="h3">
            Careers this can help you test
          </h2>
          <ul className="plain related">
            {related.map((c) => (
              <li key={c.id}>
                <Link to={`/careers/${c.id}`}>{c.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
