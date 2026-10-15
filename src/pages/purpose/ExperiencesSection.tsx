import { useState, type FormEvent } from 'react';
import { useStore } from '../../state/store';
import { INTERESTS } from '../../data/vocab';
import type { ExperienceEntry, InterestId } from '../../types';
import { Chip, EmptyState, OptionGroup } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { uid } from '../../lib/profile';
import { formatDate } from '../../lib/format';

const KINDS: { value: ExperienceEntry['kind']; label: string }[] = [
  { value: 'job', label: 'Job' },
  { value: 'volunteer', label: 'Volunteering' },
  { value: 'school', label: 'School' },
  { value: 'project', label: 'Project' },
  { value: 'church', label: 'Church' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'other', label: 'Other' },
];

export function ExperiencesSection() {
  const { profile, update } = useStore();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ExperienceEntry['kind']>('project');
  const [enjoyment, setEnjoyment] = useState<number | undefined>();
  const [energy, setEnergy] = useState<ExperienceEntry['energy'] | undefined>();
  const [interests, setInterests] = useState<InterestId[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !enjoyment || energy === undefined) {
      setError('Add a name, how much you enjoyed it, and whether it gave you energy.');
      return;
    }
    update((p) => {
      p.experiences.unshift({ id: uid('exp'), createdAt: new Date().toISOString(), title: title.trim(), kind, enjoyment, energy, interests, notes: notes.trim() || undefined });
    });
    setTitle('');
    setEnjoyment(undefined);
    setEnergy(undefined);
    setInterests([]);
    setNotes('');
    setError('');
  };

  return (
    <div className="split">
      <form className="card stack" onSubmit={submit} noValidate>
        <h2 className="h3">Log an experience</h2>
        <p className="muted small">Jobs, volunteering, projects, classes, church roles, hobbies. Anything you’ve actually done counts as evidence.</p>
        <div className="field">
          <label htmlFor="exp-title">What did you do?</label>
          <input id="exp-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ran the sound board for youth group" />
        </div>
        <div className="field">
          <label htmlFor="exp-kind">What kind of experience?</label>
          <select id="exp-kind" className="select" value={kind} onChange={(e) => setKind(e.target.value as ExperienceEntry['kind'])}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <OptionGroup legend="How much did you enjoy it?" layout="row" value={enjoyment} onChange={setEnjoyment} options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: n === 1 ? '1 Not at all' : n === 5 ? '5 Loved it' : String(n) }))} />
        <OptionGroup
          legend="How did it leave you?"
          layout="row"
          value={energy}
          onChange={setEnergy}
          options={[
            { value: -1 as const, label: 'Drained' },
            { value: 0 as const, label: 'Neutral' },
            { value: 1 as const, label: 'Energized' },
          ]}
        />
        <div className="field">
          <span className="field__label">What kind of activity was it? (optional)</span>
          <div className="chips">
            {(Object.keys(INTERESTS) as InterestId[]).map((id) => (
              <Chip key={id} family="self" selected={interests.includes(id)} onClick={() => setInterests((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))}>
                {INTERESTS[id].label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="exp-notes">What stood out? (optional)</label>
          <textarea id="exp-notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primary">
          Save experience
        </button>
      </form>

      <section aria-labelledby="exp-list-h">
        <h2 id="exp-list-h" className="h3">
          My experiences
        </h2>
        {profile.experiences.length ? (
          <ul className="entry-list">
            {profile.experiences.map((x) => (
              <li key={x.id} className="entry">
                <div className="row row--between">
                  <strong>{x.title}</strong>
                  <button type="button" className="btn btn--icon" aria-label={`Delete ${x.title}`} onClick={() => update((p) => void (p.experiences = p.experiences.filter((e) => e.id !== x.id)))}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
                <div className="row small muted">
                  <span>{KINDS.find((k) => k.value === x.kind)?.label}</span>
                  <span>Enjoyed {x.enjoyment} of 5</span>
                  <span>{x.energy === 1 ? 'Energized' : x.energy === -1 ? 'Drained' : 'Neutral'}</span>
                  <span>{formatDate(x.createdAt)}</span>
                </div>
                {x.notes && <p className="small">{x.notes}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="spark" title="No experiences yet">
            Start with something recent you enjoyed, or one that drained you. Both are useful.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
