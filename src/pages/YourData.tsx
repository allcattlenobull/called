import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { exportJourney, parseJourney } from '../lib/storage';
import { Callout, OptionGroup, PageHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { formatDate } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function YourData() {
  useDocumentTitle('Your data');
  const { profile, replace, reset, settings, setSettings } = useStore();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'evidence' | 'warn'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const doExport = () => {
    const blob = new Blob([exportJourney(profile)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `called-journey-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ tone: 'evidence', text: 'Your journey was exported. Keep the file somewhere safe; it contains your journal.' });
  };

  const doImport = async (file: File) => {
    try {
      const p = parseJourney(await file.text());
      replace(p);
      setMessage({ tone: 'evidence', text: `Imported your journey from ${formatDate(p.updatedAt)}.` });
    } catch (e) {
      setMessage({ tone: 'warn', text: e instanceof Error && e.message.includes('Called') ? e.message : 'That file couldn’t be read. Choose a .json file exported from Called.' });
    }
  };

  return (
    <div className="wrap wrap--narrow">
      <PageHeader title="Your data" lead="Your personal Called profile is stored on this device. It isn’t sent anywhere. You’re in control of it." />

      {message && (
        <div role="status" style={{ marginBottom: 'var(--s-5)' }}>
          <Callout tone={message.tone}>{message.text}</Callout>
        </div>
      )}

      <section className="card stack" aria-labelledby="where-h">
        <h2 id="where-h" className="h3">
          Where your data lives
        </h2>
        <p>
          Everything you enter, including assessments, reflections, journal entries, simulations and roadmaps, is saved in this browser’s storage on this device. If you clear your browser data or switch devices, it won’t follow you unless you export it.
        </p>
        <p className="small muted">
          Profile started {formatDate(profile.createdAt)}. Last saved {formatDate(profile.updatedAt)}.
        </p>
      </section>

      <section className="card stack" aria-labelledby="move-h" style={{ marginTop: 'var(--s-4)' }}>
        <h2 id="move-h" className="h3">
          Move your journey
        </h2>
        <p>Export a file to back up your journey or move it to another device, then import it there.</p>
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={doExport}>
            <Icon name="download" size={18} /> Export my journey
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={18} /> Import my journey
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = '';
            }}
          />
        </div>
        <p className="small muted">Importing replaces what’s on this device.</p>
      </section>

      <section className="card stack" aria-labelledby="settings-h" style={{ marginTop: 'var(--s-4)' }}>
        <h2 id="settings-h" className="h3">
          Settings
        </h2>
        <label className="check">
          <input type="checkbox" checked={settings.faithLens} onChange={(e) => setSettings({ faithLens: e.target.checked })} />
          Show faith reflections and biblical principles
        </label>
        <OptionGroup
          legend="Theme"
          layout="row"
          value={settings.theme}
          onChange={(v) => setSettings({ theme: v })}
          options={[
            { value: 'system' as const, label: 'Match my device' },
            { value: 'light' as const, label: 'Light' },
            { value: 'dark' as const, label: 'Dark' },
          ]}
        />
      </section>

      <section className="card stack danger-zone" aria-labelledby="delete-h" style={{ marginTop: 'var(--s-4)' }}>
        <h2 id="delete-h" className="h3">
          Delete my data
        </h2>
        <p>This permanently removes your Called profile, journal and settings from this device. It can’t be undone. Export first if you might want it later.</p>
        {confirmDelete ? (
          <div className="row">
            <button
              type="button"
              className="btn btn--danger"
              onClick={async () => {
                await reset();
                setConfirmDelete(false);
                navigate('/');
              }}
            >
              <Icon name="trash" size={18} /> Yes, delete everything
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => setConfirmDelete(false)}>
              Keep my data
            </button>
          </div>
        ) : (
          <div>
            <button type="button" className="btn btn--secondary" onClick={() => setConfirmDelete(true)}>
              Delete my data
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
