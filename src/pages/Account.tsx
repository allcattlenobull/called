import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CodeDisplay } from '../components/JourneyCode';
import { Icon } from '../components/Icon';
import { Callout, PageHeader, Progress, Stat } from '../components/ui';
import { INTERESTS, SKILLS } from '../data/vocab';
import { topInterests, topSkills } from '../lib/compass';
import { formatDate } from '../lib/format';
import { suggestions } from '../lib/matching';
import { progressCounts } from '../lib/next';
import { syncAvailable } from '../lib/sync';
import { counselorAccountsAvailable, revokeCounselorShare } from '../lib/counselorAccounts';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { useStore } from '../state/store';

export default function Account() {
  useDocumentTitle('My account');
  const { profile, update, syncState } = useStore();
  const [firstName, setFirstName] = useState(profile.name ?? '');
  const [lastName, setLastName] = useState(profile.lastName ?? '');
  const [editing, setEditing] = useState(!profile.name || !profile.lastName);
  const [saved, setSaved] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const counts = progressCounts(profile);
  const top = useMemo(() => suggestions(profile, 3), [profile]);
  const interests = topInterests(profile, 3).map((id) => INTERESTS[id].label);
  const strengths = topSkills(profile, 4).map((id) => SKILLS[id].label);
  const fullName = [profile.name, profile.lastName].filter(Boolean).join(' ');

  const saveIdentity = () => {
    update((draft) => {
      draft.name = firstName.trim() || undefined;
      draft.lastName = lastName.trim() || undefined;
    });
    setEditing(false);
    setSaved(true);
  };

  return (
    <div className="wrap account">
      <PageHeader title={fullName ? `${fullName}’s account` : 'Your Called account'} lead="Your results, progress, sharing and account access in one place." />

      {!syncAvailable && <Callout tone="warn" title="This account is currently saved on this device">Your journey code signs you back in on this device. Cross-device encrypted accounts will turn on when Called’s secure account service is connected; exporting a backup remains the safest way to move your work today.</Callout>}

      <section className="account-identity card" aria-labelledby="identity-h">
        <div>
          <span className="tag tag--done">Individual account</span>
          <h2 id="identity-h" className="h3">{fullName || 'Add your name'}</h2>
          <p className="account-id"><span>Called member ID</span><strong>{profile.memberId}</strong></p>
          <p className="small muted">This ID is safe to show a counselor. It cannot unlock your private journey.</p>
        </div>
        {!editing && <button type="button" className="btn btn--secondary" onClick={() => { setEditing(true); setSaved(false); }}><Icon name="edit" size={17} /> Edit name</button>}
      </section>

      {editing && (
        <section className="card account-name" aria-labelledby="name-h">
          <h2 id="name-h" className="h3">Account name</h2>
          <p className="small muted">A counselor sees both names only when you deliberately share your counselor report.</p>
          <div className="grid grid--2">
            <label className="field">First or preferred name<input className="input" autoComplete="given-name" maxLength={40} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
            <label className="field">Last name<input className="input" autoComplete="family-name" maxLength={60} value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
          </div>
          <div className="row"><button type="button" className="btn btn--primary" onClick={saveIdentity}>Save name</button>{fullName && <button type="button" className="btn btn--quiet" onClick={() => { setFirstName(profile.name ?? ''); setLastName(profile.lastName ?? ''); setEditing(false); }}>Cancel</button>}</div>
        </section>
      )}
      {saved && <p className="small" role="status">Account name saved.</p>}

      <section className="section account-results" aria-labelledby="results-h">
        <div className="row row--between"><div><h2 id="results-h" className="h3">Your results at a glance</h2><p className="muted">Updated {formatDate(profile.updatedAt)}</p></div><Link to="/path/report" className="btn btn--secondary"><Icon name="print" size={17} /> Full report</Link></div>
        <div className="stats account-stats">
          <Stat value={counts.assessments} label="Assessments" />
          <Stat value={counts.careersExplored} label="Careers explored" />
          <Stat value={counts.simulations} label="Simulations" />
          <Stat value={profile.roadmaps.filter((path) => path.stage !== 'ruledOut').length} label="Active paths" />
        </div>
        <Progress value={counts.assessments} max={6} label="Purpose Compass progress" />
        <div className="grid grid--3 account-signals">
          <article className="card"><h3 className="h4">Interests</h3><p>{interests.join(', ') || 'Complete the interests exercise to see patterns.'}</p><Link to="/discover/interests">Review interests</Link></article>
          <article className="card"><h3 className="h4">Strengths</h3><p>{strengths.join(', ') || 'Add skills evidence to see strengths.'}</p><Link to="/discover/skills">Review strengths</Link></article>
          <article className="card"><h3 className="h4">Career possibilities</h3>{top.length ? <ol>{top.map(({ career }) => <li key={career.id}><Link to={`/careers/${career.id}`}>{career.title}</Link></li>)}</ol> : <p>Complete an assessment to start matching.</p>}<Link to="/careers">Explore careers</Link></article>
        </div>
      </section>

      <div className="grid grid--2 account-tools">
        <section className="card stack" aria-labelledby="access-h">
          <h2 id="access-h" className="h3">Account access</h2>
          <p>Your journey code is your private account key. Anyone with it can open your results, so keep it private.</p>
          <CodeDisplay code={profile.code} />
          <p className="small muted">Backup status: {syncAvailable ? (syncState === 'synced' ? 'Encrypted and up to date' : syncState === 'error' ? 'Needs attention' : 'Encrypted backup enabled') : 'Device only'}.</p>
          <Link to="/data" className="btn btn--secondary">Backup, restore or delete account</Link>
        </section>
        <section className="card stack" aria-labelledby="sharing-h">
          <h2 id="sharing-h" className="h3">Counselor sharing</h2>
          {profile.counselorShares.length ? <ul className="plain account-shares">{profile.counselorShares.map((share) => <li key={share.counselorId}><span><strong>{share.counselorName}</strong><span className="small muted">{share.counselorId} · updated {formatDate(share.updatedAt)}</span></span>{counselorAccountsAvailable && <button type="button" className="btn btn--quiet btn--sm" onClick={async () => { if (!window.confirm(`Stop sharing your current counselor report with ${share.counselorName}?`)) return; setShareMessage('Removing shared report…'); try { await revokeCounselorShare(share.counselorId, profile.memberId, share.shareKey); update((draft) => void (draft.counselorShares = draft.counselorShares.filter((item) => item.counselorId !== share.counselorId))); setShareMessage(`Stopped sharing with ${share.counselorName}.`); } catch { setShareMessage('The shared report could not be removed. Try again.'); } }}>Stop sharing</button>}</li>)}</ul> : <p>No counselor accounts have received your results.</p>}
          {shareMessage && <p className="small" role="status">{shareMessage}</p>}
          <Link to="/path/report#counselor" className="btn btn--primary">Share results with a counselor</Link>
          <Link to="/counselor" className="small">I’m a counselor</Link>
        </section>
      </div>
    </div>
  );
}
