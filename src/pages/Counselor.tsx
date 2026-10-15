import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Callout, EmptyState, PageHeader, Stat } from '../components/ui';
import { Icon } from '../components/Icon';
import { formatDate } from '../lib/format';
import { parseCounselorPacket, type CounselorPacket } from '../lib/counselorReports';
import { smartSearchScore } from '../lib/smartSearch';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface RosterEntry {
  packet: CounselorPacket;
  status: 'new' | 'meeting' | 'followUp' | 'complete';
  note: string;
}

const STORAGE_KEY = 'called.counselor.workspace.v1';

function loadRoster(): RosterEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveRoster(entries: RosterEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

const STATUS_LABEL = { new: 'New', meeting: 'Meeting planned', followUp: 'Follow up', complete: 'Complete' } as const;

export default function Counselor() {
  useDocumentTitle('Counselor workspace');
  const [roster, setRosterState] = useState<RosterEntry[]>(loadRoster);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [removeId, setRemoveId] = useState<string>();
  const [confirmClear, setConfirmClear] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setRoster = (next: RosterEntry[] | ((current: RosterEntry[]) => RosterEntry[])) => {
    setRosterState((current) => {
      const value = typeof next === 'function' ? next(current) : next;
      saveRoster(value);
      return value;
    });
  };

  const shown = useMemo(() => roster
    .filter(({ packet }) => smartSearchScore(query, [packet.displayName, packet.interests.join(' '), packet.strengths.join(' '), packet.topCareers.map((career) => career.title).join(' '), packet.paths.map((path) => path.title).join(' ')]) >= 0)
    .sort((a, b) => b.packet.generatedAt.localeCompare(a.packet.generatedAt)), [query, roster]);
  const totalSimulations = roster.reduce((sum, entry) => sum + entry.packet.summary.simulations, 0);
  const followUps = roster.filter((entry) => entry.status === 'followUp').length;

  const importFiles = async (files: FileList) => {
    let imported = 0;
    let failed = 0;
    const incoming: RosterEntry[] = [];
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as { app?: string; kind?: string; roster?: RosterEntry[] };
        if (parsed.app === 'called' && parsed.kind === 'counselor-workspace' && Array.isArray(parsed.roster)) {
          for (const entry of parsed.roster) {
            const packet = parseCounselorPacket(JSON.stringify(entry.packet));
            incoming.push({ packet, status: entry.status in STATUS_LABEL ? entry.status : 'new', note: typeof entry.note === 'string' ? entry.note.slice(0, 1000) : '' });
            imported += 1;
          }
        } else {
          incoming.push({ packet: parseCounselorPacket(text), status: 'new', note: '' });
          imported += 1;
        }
      } catch {
        failed += 1;
      }
    }
    setRoster((current) => {
      const next = [...current];
      for (const entry of incoming) {
        const index = next.findIndex((item) => item.packet.studentId === entry.packet.studentId);
        if (index >= 0) next[index] = { ...next[index], packet: entry.packet, ...(entry.note || entry.status !== 'new' ? { note: entry.note, status: entry.status } : {}) };
        else next.push(entry);
      }
      return next;
    });
    setMessage(`${imported} student packet${imported === 1 ? '' : 's'} added or updated${failed ? `; ${failed} could not be read` : ''}.`);
  };

  const updateEntry = (studentId: string, change: Partial<Pick<RosterEntry, 'status' | 'note'>>) => setRoster((current) => current.map((entry) => entry.packet.studentId === studentId ? { ...entry, ...change } : entry));

  const exportWorkspace = () => {
    const file = new Blob([JSON.stringify({ app: 'called', kind: 'counselor-workspace', version: 1, exportedAt: new Date().toISOString(), roster }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `called-counselor-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="wrap counselor">
      <PageHeader title="Counselor workspace" lead="Review student-approved Called summaries in one place. The workspace stays in this browser—there is no counselor account or hidden access to student journeys." />
      <Callout tone="evidence" title="Students decide what is shared">Ask each student to open My Called report and export a counselor packet. Packets exclude journey codes, journals, and private assessment responses. Importing a newer packet updates that student’s row.</Callout>

      <div className="counselor__toolbar">
        <button type="button" className="btn btn--primary" onClick={() => inputRef.current?.click()}><Icon name="upload" size={18} /> Import student packets</button>
        <input ref={inputRef} type="file" accept="application/json,.json" multiple hidden onChange={(event) => { if (event.target.files) void importFiles(event.target.files); event.target.value = ''; }} />
        {roster.length > 0 && <button type="button" className="btn btn--secondary" onClick={exportWorkspace}><Icon name="download" size={18} /> Back up workspace</button>}
        {roster.length > 0 && !confirmClear && <button type="button" className="btn btn--quiet" onClick={() => setConfirmClear(true)}>Clear workspace</button>}
        <Link className="btn btn--quiet" to="/path/report">How students create a packet</Link>
      </div>
      {message && <p className="small" role="status">{message}</p>}
      {confirmClear && <Callout tone="warn" title="Remove every student and counselor note from this browser?"><div className="row"><button type="button" className="btn btn--danger btn--sm" onClick={() => { setRoster([]); setConfirmClear(false); setMessage('Counselor workspace cleared.'); }}>Yes, clear workspace</button><button type="button" className="btn btn--secondary btn--sm" onClick={() => setConfirmClear(false)}>Cancel</button></div></Callout>}

      {roster.length > 0 && (
        <>
          <div className="stats counselor__stats">
            <Stat value={roster.length} label="Students" />
            <Stat value={totalSimulations} label="Simulations completed" />
            <Stat value={followUps} label="Need follow-up" />
          </div>
          <p className="small muted">Career scores are Called-specific decision support, not validated predictions. Use them to guide questions and real-world exploration.</p>
          <label className="field counselor__search">Search students, interests, or careers<input className="input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Close spellings and related career terms work" /></label>
        </>
      )}

      {!roster.length ? (
        <EmptyState icon="upload" title="No student packets yet" action={<button type="button" className="btn btn--primary" onClick={() => inputRef.current?.click()}>Import packets</button>}>Students remain in control: nothing appears here until they deliberately share a counselor packet.</EmptyState>
      ) : !shown.length ? (
        <EmptyState icon="search" title="No students match that search" action={<button type="button" className="btn btn--secondary" onClick={() => setQuery('')}>Clear search</button>} />
      ) : (
        <div className="counselor-list">
          {shown.map((entry, index) => {
            const packet = entry.packet;
            const name = packet.displayName || `Student ${index + 1}`;
            return (
              <details className="card counselor-card" key={packet.studentId}>
                <summary>
                  <span><strong>{name}</strong><span className="small muted">Updated {formatDate(packet.generatedAt)}</span></span>
                  <span className="counselor-card__summary"><span className="tag tag--primary">{packet.summary.assessments}/6 assessments</span><span className="tag">{packet.summary.simulations} simulations</span>{packet.topCareers[0] && <span className="small">Top: {packet.topCareers[0].title}</span>}</span>
                </summary>
                <div className="counselor-card__body">
                  <div className="grid grid--3 counselor-card__signals">
                    <div><h3 className="h4">Interests</h3><p>{packet.interests.join(', ') || 'Not explored yet'}</p></div>
                    <div><h3 className="h4">Strengths</h3><p>{packet.strengths.join(', ') || 'Not enough evidence yet'}</p></div>
                    <div><h3 className="h4">Values</h3><p>{packet.values.join(', ') || 'Not sorted yet'}</p></div>
                  </div>
                  <div className="grid grid--2">
                    <section><h3 className="h4">Career possibilities</h3>{packet.topCareers.length ? <ol>{packet.topCareers.map((career) => <li key={career.id}><strong>{career.title}</strong> · {career.score}/100 · {career.confidence}{career.watch && <span className="small muted counselor-card__watch">Watch: {career.watch}</span>}</li>)}</ol> : <p className="muted">No suggestions yet.</p>}</section>
                    <section><h3 className="h4">Paths and next steps</h3>{packet.paths.length ? <ul>{packet.paths.map((path) => <li key={path.id}><strong>{path.title}</strong> · {path.evidence}{path.nextStep && <span className="small muted counselor-card__watch">Next: {path.nextStep}</span>}</li>)}</ul> : <p className="muted">No paths started yet.</p>}</section>
                  </div>
                  <div className="counselor-card__manage">
                    <label className="field">Counselor status<select className="select" value={entry.status} onChange={(event) => updateEntry(packet.studentId, { status: event.target.value as RosterEntry['status'] })}>{Object.entries(STATUS_LABEL).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                    <label className="field">Private counselor note<textarea className="textarea" value={entry.note} maxLength={1000} onChange={(event) => updateEntry(packet.studentId, { note: event.target.value })} placeholder="Stored only in this browser" /></label>
                  </div>
                  {removeId === packet.studentId ? <div className="row"><button type="button" className="btn btn--danger btn--sm" onClick={() => { setRoster((current) => current.filter((item) => item.packet.studentId !== packet.studentId)); setRemoveId(undefined); }}>Yes, remove this student</button><button type="button" className="btn btn--secondary btn--sm" onClick={() => setRemoveId(undefined)}>Keep</button></div> : <button type="button" className="btn btn--quiet btn--sm" onClick={() => setRemoveId(packet.studentId)}>Remove from this workspace</button>}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
