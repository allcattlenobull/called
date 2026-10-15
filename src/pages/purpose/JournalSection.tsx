import { useState } from 'react';
import { JOURNAL_PROMPTS } from '../../data/purpose/prompts';
import { useStore } from '../../state/store';
import { EmptyState } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { uid } from '../../lib/profile';
import { formatDate } from '../../lib/format';

export function JournalSection() {
  const { profile, update, settings } = useStore();
  const prompts = JOURNAL_PROMPTS.filter((p) => settings.faithLens || !p.faith);
  const [promptId, setPromptId] = useState(prompts[0].id);
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);
  const prompt = prompts.find((p) => p.id === promptId);
  const entries = [...profile.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const save = () => {
    if (!body.trim()) return;
    update((p) => {
      p.journal.push({ id: uid('j'), createdAt: new Date().toISOString(), prompt: prompt?.text, body: body.trim(), faith: prompt?.faith });
    });
    setBody('');
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="split">
      <div className="panel panel--purpose stack">
        <div className="row">
          <Icon name="lock" size={18} />
          <span className="small">Private. Your journal never leaves this device unless you export it.</span>
        </div>
        <div className="field">
          <label htmlFor="prompt">Choose a prompt</label>
          <select id="prompt" className="select" value={promptId} onChange={(e) => setPromptId(e.target.value)}>
            <optgroup label="Reflection">
              {prompts
                .filter((p) => !p.faith)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.text}
                  </option>
                ))}
            </optgroup>
            {settings.faithLens && (
              <optgroup label="Faith reflection">
                {prompts
                  .filter((p) => p.faith)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.text}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>
        <h2 className="journal-prompt">{prompt?.text}</h2>
        <label htmlFor="journal-body" className="visually-hidden">
          Your reflection
        </label>
        <textarea id="journal-body" className="textarea journal-text" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write as much or as little as you want." />
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={save} disabled={!body.trim()}>
            Save reflection
          </button>
          <span role="status" className="small muted">
            {saved ? 'Saved to your journal.' : ''}
          </span>
        </div>
      </div>
      <section aria-labelledby="journal-h">
        <h2 id="journal-h" className="h3">
          Past entries
        </h2>
        {entries.length ? (
          <ul className="entry-list">
            {entries.map((j) => (
              <li key={j.id} className="entry">
                <div className="row row--between">
                  <span className="small muted">{formatDate(j.createdAt)}</span>
                  <button type="button" className="btn btn--icon" aria-label="Delete entry" onClick={() => update((p) => void (p.journal = p.journal.filter((x) => x.id !== j.id)))}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
                {j.prompt && <strong className="entry__prompt">{j.prompt}</strong>}
                <p className="entry__body">{j.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="journal" title="Your journal is empty">
            Pick a prompt and write for five minutes. Patterns appear over weeks, not in one entry.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
