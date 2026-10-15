import { useState, type FormEvent } from 'react';
import { useStore } from '../../state/store';
import { GIFTS } from '../../data/vocab';
import type { GiftId } from '../../types';
import { Callout, Chip, EmptyState } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { uid } from '../../lib/profile';
import { formatDate } from '../../lib/format';
import { giftSignals } from '../../lib/signals';

export function FeedbackSection() {
  const { profile, update } = useStore();
  const [from, setFrom] = useState('');
  const [said, setSaid] = useState('');
  const [gifts, setGifts] = useState<GiftId[]>([]);
  const [error, setError] = useState('');
  const noticed = Object.entries(giftSignals(profile).noticed).sort((a, b) => b[1] - a[1]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!said.trim()) {
      setError('Write down what they said, in their words if you can.');
      return;
    }
    update((p) => {
      p.feedback.unshift({ id: uid('fb'), createdAt: new Date().toISOString(), from: from.trim() || 'Someone', said: said.trim(), gifts });
    });
    setFrom('');
    setSaid('');
    setGifts([]);
    setError('');
  };

  return (
    <div className="split">
      <div className="stack">
        <Callout title="Try this">
          Ask three people who know you well, like a parent, a teacher, a coach, a friend or a pastor: “What do you think I’m naturally good at?” and “When have you seen me at my best?” Write down exactly what they say.
        </Callout>
        <form className="card stack" onSubmit={submit} noValidate>
          <h2 className="h3">Record what someone said</h2>
          <div className="field">
            <label htmlFor="fb-from">Who said it? (optional)</label>
            <input id="fb-from" className="input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="My coach" />
            <span className="field__hint">A role is enough. Don’t include anyone’s full name.</span>
          </div>
          <div className="field">
            <label htmlFor="fb-said">What did they say?</label>
            <textarea id="fb-said" className="textarea" value={said} onChange={(e) => setSaid(e.target.value)} placeholder="You’re the one who notices when someone is left out." />
          </div>
          <div className="field">
            <span className="field__label">Which gifts does this point to?</span>
            <div className="chips">
              {(Object.keys(GIFTS) as GiftId[]).map((g) => (
                <Chip key={g} family="purpose" selected={gifts.includes(g)} onClick={() => setGifts((xs) => (xs.includes(g) ? xs.filter((x) => x !== g) : [...xs, g]))}>
                  {GIFTS[g].label}
                </Chip>
              ))}
            </div>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--primary">
            Save feedback
          </button>
        </form>
      </div>
      <section className="stack" aria-labelledby="fb-h">
        {noticed.length > 0 && (
          <div className="card">
            <h2 className="h3">Patterns others notice</h2>
            <ul className="plain">
              {noticed.map(([g, n]) => (
                <li key={g}>
                  <strong>{GIFTS[g as GiftId]?.label}</strong> <span className="muted small">mentioned {n % 1 ? n.toFixed(1) : n} time{n === 1 ? '' : 's'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <h2 id="fb-h" className="h3">
          What others see in me
        </h2>
        {profile.feedback.length ? (
          <ul className="entry-list">
            {profile.feedback.map((f) => (
              <li key={f.id} className="entry">
                <div className="row row--between">
                  <strong>{f.from}</strong>
                  <button type="button" className="btn btn--icon" aria-label="Delete feedback" onClick={() => update((p) => void (p.feedback = p.feedback.filter((x) => x.id !== f.id)))}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
                <p>“{f.said}”</p>
                <div className="row small muted">
                  {f.gifts.map((g) => (
                    <span key={g} className="tag tag--purpose">
                      {GIFTS[g].label}
                    </span>
                  ))}
                  <span>{formatDate(f.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="spark" title="Nothing recorded yet">
            Other people’s observations are some of the strongest evidence about your gifts.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
