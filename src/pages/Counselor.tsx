import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Callout, EmptyState, PageHeader, Stat } from '../components/ui';
import { Icon } from '../components/Icon';
import { formatDate } from '../lib/format';
import { parseCounselorPacket, type CounselorPacket } from '../lib/counselorReports';
import { smartSearchScore } from '../lib/smartSearch';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { counselorAccountsAvailable, createCounselorAccount, loadCounselorCredentials, removeCounselorRecord, saveCounselorCredentials, signInCounselor, type CounselorCredentials, type CounselorPublicAccount } from '../lib/counselorAccounts';

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
  const [session, setSession] = useState<{ account: CounselorPublicAccount; credentials: CounselorCredentials } | null>(null);
  const [authMode, setAuthMode] = useState<'signIn' | 'create'>('signIn');
  const [counselorId, setCounselorId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [remember, setRemember] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [newCredentials, setNewCredentials] = useState<CounselorCredentials | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const applySession = (result: Awaited<ReturnType<typeof signInCounselor>>) => {
    setSession({ account: result.account, credentials: result.credentials });
    setRoster((current) => result.packets.map((packet) => {
      const existing = current.find((entry) => entry.packet.studentId === packet.studentId);
      return { packet, status: existing?.status ?? 'new', note: existing?.note ?? '' };
    }));
  };

  const signIn = async (credentials: CounselorCredentials) => {
    setAuthBusy(true);
    setMessage('Signing in…');
    try {
      const result = await signInCounselor(credentials);
      applySession(result);
      if (remember) saveCounselorCredentials(result.credentials);
      else saveCounselorCredentials(null);
      setMessage(`${result.packets.length} shared student report${result.packets.length === 1 ? '' : 's'} loaded.`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Counselor account could not be opened.');
    } finally {
      setAuthBusy(false);
    }
  };

  useEffect(() => {
    if (!counselorAccountsAvailable) return;
    const saved = loadCounselorCredentials();
    if (saved) { setCounselorId(saved.id); setAccessKey(saved.accessKey); void signIn(saved); }
    // Saved credentials are intentionally checked only once on page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRoster = (next: RosterEntry[] | ((current: RosterEntry[]) => RosterEntry[])) => {
    setRosterState((current) => {
      const value = typeof next === 'function' ? next(current) : next;
      saveRoster(value);
      return value;
    });
  };

  const shown = useMemo(() => roster
    .filter(({ packet }) => smartSearchScore(query, [packet.displayName, packet.memberId, packet.interests.join(' '), packet.strengths.join(' '), packet.topCareers.map((career) => career.title).join(' '), packet.paths.map((path) => path.title).join(' ')]) >= 0)
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

  const refreshAccount = async () => {
    if (!session) return;
    await signIn(session.credentials);
  };

  if (counselorAccountsAvailable && !session) {
    return (
      <div className="wrap wrap--narrow counselor-auth">
        <PageHeader title="Counselor account" lead="A private roster of people who deliberately shared their Called results with you." />
        <Callout tone="evidence" title="Student-controlled and encrypted">You receive a person’s first name, last name, Called member ID and limited result summary only after they confirm sharing. Their journey code, journal and item-level answers are never included.</Callout>
        {newCredentials && (
          <Callout tone="warn" title="Save your private access key now">
            <p>Called cannot recover this key. Store it in a password manager before continuing.</p>
            <p className="code-display__code">{newCredentials.id}</p>
            <p className="code-display__code">{newCredentials.accessKey}</p>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => navigator.clipboard.writeText(`Called counselor ID: ${newCredentials.id}\nPrivate access key: ${newCredentials.accessKey}`)}>Copy both</button>
          </Callout>
        )}
        <div className="account-switch" role="group" aria-label="Counselor account action">
          <button type="button" className={`btn ${authMode === 'signIn' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setAuthMode('signIn')}>Sign in</button>
          <button type="button" className={`btn ${authMode === 'create' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setAuthMode('create')}>Create counselor account</button>
        </div>
        {authMode === 'signIn' ? (
          <form className="card stack" onSubmit={(event) => { event.preventDefault(); void signIn({ id: counselorId, accessKey }); }}>
            <h2 className="h3">Sign in to your roster</h2>
            <label className="field">Counselor ID<input className="input" value={counselorId} onChange={(event) => setCounselorId(event.target.value)} placeholder="COUN-ABCD-2345-EFGH" autoCapitalize="characters" /></label>
            <label className="field">Private access key<input className="input" type="password" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} autoComplete="current-password" /></label>
            <label className="check"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Remember this counselor account on this device</label>
            <button className="btn btn--primary" disabled={authBusy || !counselorId.trim() || !accessKey.trim()}>{authBusy ? 'Signing in…' : 'Sign in'}</button>
          </form>
        ) : (
          <form className="card stack" onSubmit={async (event) => {
            event.preventDefault(); setAuthBusy(true); setMessage('Creating encrypted counselor account…');
            try { const credentials = await createCounselorAccount(firstName, lastName, organization); setNewCredentials(credentials); setCounselorId(credentials.id); setAccessKey(credentials.accessKey); await signIn(credentials); }
            catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Counselor account could not be created.'); }
            finally { setAuthBusy(false); }
          }}>
            <h2 className="h3">Create a counselor account</h2>
            <div className="grid grid--2">
              <label className="field">First name<input className="input" autoComplete="given-name" maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
              <label className="field">Last name<input className="input" autoComplete="family-name" maxLength={100} value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
            </div>
            <label className="field">School or organization <span className="small muted">(optional)</span><input className="input" maxLength={160} value={organization} onChange={(event) => setOrganization(event.target.value)} /></label>
            <label className="check"><input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />I agree to the <Link to="/terms#counselor">Counselor Account Terms</Link>, including the student-data and high-stakes decision rules.</label>
            <label className="check"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />Remember this counselor account on this device</label>
            <button className="btn btn--primary" disabled={authBusy || !firstName.trim() || !lastName.trim() || !acceptedTerms}>{authBusy ? 'Creating account…' : 'Create secure account'}</button>
          </form>
        )}
        {message && <p className="small" role="status">{message}</p>}
        <p className="small muted">Counselor accounts use a high-entropy access key instead of a recoverable password. Called never receives the key needed to decrypt student reports.</p>
      </div>
    );
  }

  return (
    <div className="wrap counselor">
      <PageHeader title={session ? `${session.account.firstName} ${session.account.lastName}’s counselor account` : 'Counselor workspace'} lead={session ? `Counselor ID ${session.account.id}${session.account.organization ? ` · ${session.account.organization}` : ''}` : 'Review student-approved Called summaries in one private workspace.'} />
      <Callout tone="evidence" title="Students decide what is shared">Each person must deliberately share a counselor report. You see their first and last name, Called member ID and limited results—not their journey code, journal or item-level assessment answers.</Callout>
      {session && newCredentials && <Callout tone="warn" title="Save your private access key now"><p>Called cannot recover this key. Store it in a password manager.</p><p className="code-display__code">{newCredentials.id}</p><p className="code-display__code">{newCredentials.accessKey}</p><button type="button" className="btn btn--secondary btn--sm" onClick={() => navigator.clipboard.writeText(`Called counselor ID: ${newCredentials.id}\nPrivate access key: ${newCredentials.accessKey}`)}>Copy both</button></Callout>}

      <div className="counselor__toolbar">
        {session ? <button type="button" className="btn btn--primary" onClick={() => void refreshAccount()} disabled={authBusy}><Icon name="down" size={18} /> Refresh shared results</button> : <button type="button" className="btn btn--primary" onClick={() => inputRef.current?.click()}><Icon name="upload" size={18} /> Import student packets</button>}
        <input ref={inputRef} type="file" accept="application/json,.json" multiple hidden onChange={(event) => { if (event.target.files) void importFiles(event.target.files); event.target.value = ''; }} />
        {roster.length > 0 && <button type="button" className="btn btn--secondary" onClick={exportWorkspace}><Icon name="download" size={18} /> Back up workspace</button>}
        {!session && roster.length > 0 && !confirmClear && <button type="button" className="btn btn--quiet" onClick={() => setConfirmClear(true)}>Clear workspace</button>}
        {session && <button type="button" className="btn btn--quiet" onClick={() => { saveCounselorCredentials(null); setSession(null); setRoster([]); setAccessKey(''); setMessage('Signed out.'); }}>Sign out</button>}
        <Link className="btn btn--quiet" to="/path/report#counselor">How people share</Link>
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
          <label className="field counselor__search">Search names, member IDs, interests, or careers<input className="input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Close spellings and related career terms work" /></label>
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
                  <span><strong>{name}</strong><span className="small muted">{packet.memberId} · Updated {formatDate(packet.generatedAt)}</span></span>
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
                  {removeId === packet.studentId ? <div className="row"><button type="button" className="btn btn--danger btn--sm" onClick={async () => { if (session) await removeCounselorRecord(session.credentials, packet.memberId); setRoster((current) => current.filter((item) => item.packet.studentId !== packet.studentId)); setRemoveId(undefined); }}>Yes, remove this student</button><button type="button" className="btn btn--secondary btn--sm" onClick={() => setRemoveId(undefined)}>Keep</button></div> : <button type="button" className="btn btn--quiet btn--sm" onClick={() => setRemoveId(packet.studentId)}>Remove from this workspace</button>}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
