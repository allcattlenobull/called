import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CodeDisplay, RestoreForm } from '../components/JourneyCode';
import { deleteRemoteJourney, syncAvailable } from '../lib/sync';
import { useStore } from '../state/store';
import { exportJourney, parseJourney } from '../lib/storage';
import { Callout, OptionGroup, PageHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { formatDate } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { queuedResearchEvents, researchServiceAvailable, withdrawResearchParticipation } from '../lib/researchParticipation';
import { openEmailDraft, shareFile } from '../lib/email';

export default function YourData() {
  useDocumentTitle('Your data');
  const { profile, replace, reset, settings, setSettings, otherJourneys, switchJourney, startNewJourney, forgetJourney } = useStore();
  const navigate = useNavigate();
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'evidence' | 'warn'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmResearchDelete, setConfirmResearchDelete] = useState(false);

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
      <PageHeader title="Your data" lead="Your personal Called profile stays on this device unless you choose encrypted backup or voluntary research sharing. You’re in control." />

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
          Everything you enter, including assessments, reflections, journal entries, simulations and roadmaps, is saved in this browser’s storage on this device. If you clear browser data or switch devices, use an export{syncAvailable ? ' or your optional encrypted backup' : ''} to restore it.
        </p>
        <p className="small muted">
          Profile started {formatDate(profile.createdAt)}. Last saved {formatDate(profile.updatedAt)}.
        </p>
      </section>

      <section className="card stack" id="code" aria-labelledby="code-h" style={{ marginTop: 'var(--s-4)' }}>
        <h2 id="code-h" className="h3">
          Your journey code
        </h2>
        <p>
          Every journey has its own code. Keep it somewhere safe, like a note on your phone.{' '}
          {syncAvailable
            ? 'Type it on any device to get all your results back. Your journey is encrypted with this code before it leaves your browser, so no one else, including Called, can read it.'
            : 'Type it on this device to come back to your journey, even if a sibling or classmate uses Called here too.'}
        </p>
        <CodeDisplay code={profile.code} />
        <div>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => openEmailDraft('My Called journey code', `Keep this private. My Called journey code is ${profile.code}.\n\n${syncAvailable ? `Restore it at ${window.location.origin}${import.meta.env.BASE_URL}data#code` : 'This code returns to the journey on the same device. I also need the exported backup file to restore elsewhere.'}`)}><Icon name="mail" size={16} /> Email code to myself</button>
        </div>
        <p className="small muted">Treat this code like a password. Email providers and anyone with access to the message may be able to read it.</p>
        {syncAvailable && (
          <label className="check">
            <input type="checkbox" checked={settings.cloudBackup} onChange={(e) => setSettings({ cloudBackup: e.target.checked })} />
            Keep an encrypted backup I can restore with my code
          </label>
        )}
        <hr style={{ margin: 'var(--s-3) 0' }} />
        <RestoreForm />
      </section>

      <section className="card stack" aria-labelledby="journeys-h" style={{ marginTop: 'var(--s-4)' }}>
        <h2 id="journeys-h" className="h3">
          Journeys on this device
        </h2>
        <p className="small muted">Sharing a computer? Each person can have their own journey. Switch with your code or from this list.</p>
        <ul className="journey-list">
          <li className="is-current">
            <span>
              <strong>{profile.name || 'This journey'}</strong> <span className="tag tag--done">In use</span>
              <span className="small muted journey-list__code">{profile.code}</span>
            </span>
          </li>
          {otherJourneys.map((j) => (
            <li key={j.code}>
              <span>
                <strong>{j.name || 'Unnamed journey'}</strong>
                <span className="small muted journey-list__code">
                  {j.code.slice(0, 9)}… last used {formatDate(j.updatedAt)}
                </span>
              </span>
              <span className="row">
                <button type="button" className="btn btn--secondary btn--sm" onClick={async () => { await switchJourney(j.code); navigate('/'); }}>
                  Switch to this
                </button>
                <button type="button" className="btn btn--quiet btn--sm" onClick={() => forgetJourney(j.code)}>
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
        <div>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={async () => {
              await startNewJourney();
              navigate('/welcome');
            }}
          >
            <Icon name="plus" size={18} /> Start a new journey on this device
          </button>
        </div>
        <p className="small muted">Your current journey stays saved here under its code.</p>
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
          <button type="button" className="btn btn--secondary" onClick={async () => {
            const file = new File([exportJourney(profile)], `called-journey-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });
            try {
              const result = await shareFile(file, 'My Called journey backup', 'Private Called journey backup. Keep this file safe.');
              setMessage({ tone: 'evidence', text: result === 'shared' ? 'Your backup was shared through the app you chose.' : 'Your backup was downloaded. Attach that file to an email to keep it there.' });
            } catch (reason) {
              if (!(reason instanceof DOMException && reason.name === 'AbortError')) setMessage({ tone: 'warn', text: 'The backup could not be shared. Use Export my journey instead.' });
            }
          }}><Icon name="mail" size={18} /> Email or share backup file</button>
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
            { value: 'system' as const, label: 'Auto (match my device)' },
            { value: 'light' as const, label: 'Light' },
            { value: 'dark' as const, label: 'Dark' },
          ]}
        />
        <OptionGroup
          legend="Reading style"
          layout="row"
          value={settings.readingMode}
          onChange={(v) => setSettings({ readingMode: v })}
          options={[
            { value: 'standard' as const, label: 'Standard' },
            { value: 'plain' as const, label: 'Roomier and simpler' },
          ]}
        />
        <OptionGroup
          legend="Text size"
          layout="row"
          value={settings.textSize}
          onChange={(v) => setSettings({ textSize: v })}
          options={[
            { value: 'standard' as const, label: 'Standard' },
            { value: 'large' as const, label: 'Large' },
            { value: 'xlarge' as const, label: 'Extra large' },
          ]}
        />
      </section>

      <section className="card stack" id="research" aria-labelledby="research-h" style={{ marginTop: 'var(--s-4)' }}>
        <h2 id="research-h" className="h3">Voluntary research and analytics</h2>
        <p>Called works fully with both choices off. If you opt in, a random research ID—not your journey code—is used. Names, journal entries, and free-text simulation responses are excluded from simulation validation data.</p>
        {!researchServiceAvailable && <Callout tone="warn">The research service is not configured in this deployment. Opted-in events will remain queued on this device until it is available.</Callout>}
        <label className="check">
          <input type="checkbox" checked={settings.researchParticipation} onChange={(event) => setSettings({ researchParticipation: event.target.checked })} />
          Share de-identified simulator outcomes and usability feedback for validation research
        </label>
        <label className="check">
          <input type="checkbox" checked={settings.productAnalytics} onChange={(event) => setSettings({ productAnalytics: event.target.checked })} />
          Share minimal page visits to help improve navigation
        </label>
        <p className="small muted">{queuedResearchEvents()} research event{queuedResearchEvents() === 1 ? '' : 's'} waiting on this device. Consent version: October 15, 2026.</p>
        {confirmResearchDelete ? (
          <div className="row">
            <button type="button" className="btn btn--danger" onClick={async () => {
              const removed = await withdrawResearchParticipation();
              setSettings({ researchParticipation: false, productAnalytics: false });
              setConfirmResearchDelete(false);
              setMessage({ tone: removed ? 'evidence' : 'warn', text: removed ? 'Research participation stopped and stored research events were deleted.' : 'Sharing is now off and the local queue was cleared. The service could not confirm deletion of previously sent events.' });
            }}>Yes, withdraw and delete</button>
            <button type="button" className="btn btn--secondary" onClick={() => setConfirmResearchDelete(false)}>Keep participating</button>
          </div>
        ) : (
          <div><button type="button" className="btn btn--secondary" onClick={() => setConfirmResearchDelete(true)}>Withdraw and delete research data</button></div>
        )}
        <p className="small"><a href={`${import.meta.env.BASE_URL}research#validation-h`}>Read the participant and validation information</a> · <a href={`${import.meta.env.BASE_URL}feedback`}>Give usability feedback</a></p>
      </section>

      <section className="card stack danger-zone" aria-labelledby="delete-h" style={{ marginTop: 'var(--s-4)' }}>
        <h2 id="delete-h" className="h3">
          Delete my data
        </h2>
        <p>This permanently removes this journey, its journal and your settings from this device{syncAvailable ? ', and deletes its encrypted backup' : ''}. It can’t be undone. Export first if you might want it later.</p>
        {confirmDelete ? (
          <div className="row">
            <button
              type="button"
              className="btn btn--danger"
              onClick={async () => {
                await deleteRemoteJourney(profile.code);
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
