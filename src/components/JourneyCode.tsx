import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { normalizeCode } from '../lib/profile';
import { pullJourney, syncAvailable } from '../lib/sync';
import { Icon } from './Icon';

export function CodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-display">
      <code className="code-display__code" aria-label={`Journey code ${code.split('').join(' ')}`}>
        {code}
      </code>
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard blocked: the code is still visible to copy by hand */
          }
        }}
      >
        <Icon name={copied ? 'check' : 'download'} size={16} />
        {copied ? 'Copied' : 'Copy code'}
      </button>
    </div>
  );
}

/** Dashboard card: the user’s code, and what it does. */
export function JourneyCodeCard() {
  const { profile, syncState } = useStore();
  return (
    <section className="card code-card" aria-labelledby="code-h">
      <div>
        <h2 id="code-h" className="h3">
          Your journey code
        </h2>
        <p className="muted small">
          {syncAvailable
            ? 'Write this down. Enter it on any device to get all of your results back. It’s the only key to your encrypted backup, so keep it private.'
            : 'Write this down. Enter it on this device to come back to your journey, even if someone else uses Called here too.'}
        </p>
      </div>
      <CodeDisplay code={profile.code} />
      {syncAvailable && (
        <p className="small muted" style={{ margin: 0 }}>
          Backup: {syncState === 'synced' ? 'up to date' : syncState === 'syncing' ? 'saving…' : syncState === 'error' ? 'couldn’t reach the backup service; your data is still safe on this device' : 'on'}.
        </p>
      )}
      <Link to="/data#code" className="small">
        Manage codes and journeys
      </Link>
    </section>
  );
}

/** Enter a code to restore a journey from this device or, when enabled, from the encrypted backup. */
export function RestoreForm({ onDone }: { onDone?: () => void }) {
  const { profile, otherJourneys, switchJourney, replace } = useStore();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const code = normalizeCode(input);
    if (!code) {
      setStatus({ tone: 'error', text: 'That doesn’t look like a journey code. Codes look like CALL-7KQ2-M9XD-4HPA-R2TW.' });
      return;
    }
    if (code === profile.code) {
      setStatus({ tone: 'ok', text: 'That’s the journey you’re using right now.' });
      return;
    }
    setBusy(true);
    try {
      if (otherJourneys.some((j) => j.code === code)) {
        await switchJourney(code);
        setStatus({ tone: 'ok', text: 'Welcome back. Your journey is restored.' });
        onDone?.();
        navigate('/');
        return;
      }
      const res = await pullJourney(code);
      if (res.ok) {
        replace(res.profile);
        setStatus({ tone: 'ok', text: 'Welcome back. Your journey is restored.' });
        onDone?.();
        navigate('/');
        return;
      }
      const why: Record<typeof res.reason, string> = {
        invalid: 'That doesn’t look like a journey code.',
        notFound: 'No journey was found for that code. Check each character and try again.',
        unavailable: 'That journey isn’t saved on this device. To move a journey between devices right now, use Export my journey on the old device and Import my journey here.',
        error: 'Couldn’t reach the backup service. Check your connection and try again.',
      };
      setStatus({ tone: 'error', text: why[res.reason] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="restore-form" onSubmit={submit} noValidate>
      <label htmlFor="restore-code" className="field__label">
        Enter a journey code
      </label>
      <div className="restore-form__row">
        <input
          id="restore-code"
          className="input code-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="CALL-XXXX-XXXX-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <button type="submit" className="btn btn--primary" disabled={busy || !input.trim()}>
          {busy ? 'Restoring…' : 'Restore'}
        </button>
      </div>
      {status && (
        <p role="status" className={status.tone === 'error' ? 'form-error' : 'form-ok'}>
          {status.text}
        </p>
      )}
    </form>
  );
}
