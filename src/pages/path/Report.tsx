import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../state/store';
import { topInterests, topSkills, topValues, insights } from '../../lib/compass';
import { suggestions } from '../../lib/matching';
import { progressCounts } from '../../lib/next';
import { GIFTS, INTERESTS, SKILLS, VALUES } from '../../data/vocab';
import { LIFESTYLE_QUESTIONS } from '../../data/assessments';
import { CAREER_BY_ID } from '../../data/careers';
import { SIM_BY_ID } from '../../data/simulations';
import { EXPERIMENT_BY_ID } from '../../data/purpose-experiments';
import { giftSignals } from '../../lib/signals';
import { formatDate } from '../../lib/format';
import { Callout, PageHeader } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { Logo } from '../../components/ui';
import { isDone, learnedInsights, nextBestAction, pathEvidence } from '../../lib/path';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { createSharedReport, revokeSharedReport, sharedReportsAvailable, type SharedReportLink } from '../../lib/sharedReport';
import { counselorPacketFile, createCounselorPacket } from '../../lib/counselorReports';
import { openEmailDraft, shareFile } from '../../lib/email';
import { counselorAccountsAvailable, findCounselor, shareWithCounselor, type CounselorPublicAccount } from '../../lib/counselorAccounts';

const SECTIONS = [
  { id: 'interests', label: 'Current interests' },
  { id: 'strengths', label: 'Strengths' },
  { id: 'values', label: 'Values' },
  { id: 'lifestyle', label: 'Lifestyle priorities' },
  { id: 'statement', label: 'Current purpose statement' },
  { id: 'top', label: 'Top career possibilities' },
  { id: 'explored', label: 'Careers explored' },
  { id: 'sims', label: 'Simulations completed' },
  { id: 'lessons', label: 'Lessons learned' },
  { id: 'next', label: 'Paths and next steps' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

export default function Report() {
  useDocumentTitle('My Called report');
  const { profile, update } = useStore();
  const [include, setInclude] = useState<Record<SectionId, boolean>>(() => Object.fromEntries(SECTIONS.map((s) => [s.id, true])) as Record<SectionId, boolean>);
  const [showName, setShowName] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState<SharedReportLink | null>(null);
  const [shareMessage, setShareMessage] = useState('');
  const [counselorId, setCounselorId] = useState('');
  const [counselor, setCounselor] = useState<CounselorPublicAccount | null>(null);
  const [sharingWithCounselor, setSharingWithCounselor] = useState(false);
  const reportRef = useRef<HTMLElement>(null);

  const data = useMemo(() => {
    const strengths = [
      ...topSkills(profile, 4).map((s) => SKILLS[s].label),
      ...giftSignals(profile).all.slice(0, 4).map((g) => `${GIFTS[g].label} (gift)`),
    ];
    const lifestyle = LIFESTYLE_QUESTIONS.filter((q) => profile.lifestyle[q.key]).map((q) => ({ q: q.question, a: q.options.find((o) => o.value === profile.lifestyle[q.key])?.label ?? '' }));
    const lessons = [
      ...learnedInsights(profile).map((l) => l.text),
      ...insights(profile),
      ...profile.simulations.filter((s) => s.natural).map((s) => `In the ${SIM_BY_ID[s.simulationId]?.role.toLowerCase()} simulation: “${s.natural}”`),
      ...profile.experiments.filter((e) => e.notes).map((e) => `From “${EXPERIMENT_BY_ID[e.experimentId]?.title.toLowerCase()}”: “${e.notes}”`),
    ];
    const paths = profile.roadmaps
      .filter((r) => CAREER_BY_ID[r.careerId])
      .map((r) => {
        const c = CAREER_BY_ID[r.careerId];
        const ev = pathEvidence(c, profile);
        const stage = r.stage === 'leading' ? 'Leading path' : r.stage === 'ruledOut' ? 'Ruled out' : 'Exploring';
        return `${r.goal}: ${stage}. Evidence: ${ev.level}.${r.stage !== 'ruledOut' ? ` Next best step: ${nextBestAction(c, profile, r, ev).title}.` : ''}`;
      });
    const next = [
      ...paths,
      ...profile.roadmaps.filter((r) => r.stage !== 'ruledOut' && CAREER_BY_ID[r.careerId]).flatMap((r) => r.items.filter((i) => !isDone(i, CAREER_BY_ID[r.careerId], profile)).slice(0, 3).map((i) => `${i.text} (toward ${r.goal})`)),
    ];
    return {
      interests: topInterests(profile, 3).map((i) => INTERESTS[i].label),
      strengths,
      values: topValues(profile, 5).map((v) => VALUES[v].label),
      lifestyle,
      statement: profile.statements[profile.statements.length - 1]?.text,
      top: suggestions(profile, 5),
      explored: Array.from(new Set(profile.careerViews)).slice(0, 12).map((id) => CAREER_BY_ID[id]?.title).filter(Boolean) as string[],
      sims: profile.simulations.map((s) => ({ role: SIM_BY_ID[s.simulationId]?.role, enjoyment: s.enjoyment, regularly: s.regularly })),
      lessons: Array.from(new Set(lessons)),
      next,
      counts: progressCounts(profile),
    };
  }, [profile]);

  const asText = () => reportRef.current?.innerText ?? '';

  const download = () => {
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>My Called report</title><style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;color:#121a3d;line-height:1.55}h1,h2{line-height:1.2}h2{margin-top:1.6rem;font-size:1.15rem;border-bottom:1px solid #d6dcec;padding-bottom:.3rem}</style></head><body>${reportRef.current?.innerHTML ?? ''}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `called-report-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counselorPacket = () => counselorPacketFile(createCounselorPacket(profile, showName));

  const downloadCounselorPacket = () => {
    const file = counselorPacket();
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
    setShareMessage('Counselor packet downloaded.');
  };

  const empty = (s: string) => <p className="muted">{s}</p>;

  return (
    <div className="wrap">
      <PageHeader title="My Called report" lead="A clean summary to share with a parent, counselor, mentor or pastor. You choose what’s included. Your journal is never included." back={{ to: '/path', label: 'My Path' }} />
      <div className="split report-layout">
        <section className="report-sheet" aria-label="Report preview">
          <article ref={reportRef} className="report">
            <header className="report__head">
              <Logo size={26} />
              <div>
                <h1 className="report__title">{showName && profile.name ? `${[profile.name, profile.lastName].filter(Boolean).join(' ')}’s exploration report` : 'My exploration report'}</h1>
                <p className="small muted">Created {formatDate(new Date().toISOString())}. A snapshot of an ongoing process, not a final answer.</p>
              </div>
            </header>
            {include.interests && (
              <section>
                <h2>Current interests</h2>
                {data.interests.length ? <p>{data.interests.join(', ')}</p> : empty('Interests assessment not completed yet.')}
              </section>
            )}
            {include.strengths && (
              <section>
                <h2>Strengths</h2>
                {data.strengths.length ? <p>{data.strengths.join(', ')}</p> : empty('Not enough evidence yet.')}
              </section>
            )}
            {include.values && (
              <section>
                <h2>Values</h2>
                {data.values.length ? <p>{data.values.join(', ')}</p> : empty('Values not sorted yet.')}
              </section>
            )}
            {include.lifestyle && (
              <section>
                <h2>Lifestyle priorities</h2>
                {data.lifestyle.length ? (
                  <ul>
                    {data.lifestyle.map((l) => (
                      <li key={l.q}>
                        {l.q} <strong>{l.a}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  empty('Lifestyle questions not answered yet.')
                )}
              </section>
            )}
            {include.statement && data.statement && (
              <section>
                <h2>Current purpose statement</h2>
                <p>
                  <em>{data.statement}</em>
                </p>
              </section>
            )}
            {include.top && (
              <section>
                <h2>Top career possibilities</h2>
                {data.top.length ? (
                  <ol>
                    {data.top.map(({ career, match }) => (
                      <li key={career.id}>
                        <strong>{career.title}</strong>: {match.overall}/100 overall fit.{match.explanation ? ` ${match.explanation}` : ''}
                        {match.conflicts[0] ? ` Watch for: ${match.conflicts[0].text}` : ''}
                      </li>
                    ))}
                  </ol>
                ) : (
                  empty('Suggestions appear after an assessment.')
                )}
              </section>
            )}
            {include.explored && (
              <section>
                <h2>Careers explored</h2>
                {data.explored.length ? <p>{data.explored.join(', ')}</p> : empty('None yet.')}
              </section>
            )}
            {include.sims && (
              <section>
                <h2>Simulations completed</h2>
                {data.sims.length ? (
                  <ul>
                    {data.sims.map((s, i) => (
                      <li key={i}>
                        {s.role}: enjoyed {s.enjoyment} of 5; would do it regularly: {s.regularly}
                      </li>
                    ))}
                  </ul>
                ) : (
                  empty('None yet.')
                )}
              </section>
            )}
            {include.lessons && (
              <section>
                <h2>Lessons learned</h2>
                {data.lessons.length ? (
                  <ul>
                    {data.lessons.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                ) : (
                  empty('Lessons appear as you reflect on simulations and experiments.')
                )}
              </section>
            )}
            {include.next && (
              <section>
                <h2>Paths being tested and next steps</h2>
                {data.next.length ? (
                  <ul>
                    {data.next.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                ) : (
                  empty('No paths being tested yet.')
                )}
              </section>
            )}
            <footer className="report__foot small muted">
              {data.counts.assessments} assessments, {data.counts.careersExplored} careers explored, {data.counts.simulations} simulations, {data.counts.experiments} purpose experiments. Generated by Called. Scores organize evidence; they don’t predict anyone’s future.
            </footer>
          </article>
        </section>

        <aside className="stack sticky no-print">
          <section className="card stack" aria-labelledby="include-h">
            <h2 id="include-h" className="h3">
              Include
            </h2>
            {SECTIONS.map((s) => (
              <label key={s.id} className="check">
                <input type="checkbox" checked={include[s.id]} onChange={(e) => setInclude((x) => ({ ...x, [s.id]: e.target.checked }))} />
                {s.label}
              </label>
            ))}
            {profile.name && (
              <label className="check">
                <input type="checkbox" checked={showName} onChange={(e) => setShowName(e.target.checked)} />
                Show my full name
              </label>
            )}
          </section>
          <div className="stack">
            <button type="button" className="btn btn--primary btn--block" onClick={() => window.print()}>
              <Icon name="print" size={18} /> Print or save as PDF
            </button>
            <button type="button" className="btn btn--secondary btn--block" onClick={download}>
              <Icon name="download" size={18} /> Download report
            </button>
            <button type="button" className="btn btn--secondary btn--block" onClick={() => openEmailDraft(`${profile.name ? `${profile.name}’s` : 'My'} Called exploration report`, `${asText()}\n\nOpen Called: ${window.location.origin}${import.meta.env.BASE_URL}`)}>
              <Icon name="mail" size={18} /> Email this report
            </button>
            <button
              type="button"
              className="btn btn--quiet btn--block"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(asText());
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? 'Copied' : 'Copy as text'}
            </button>
            {sharedReportsAvailable && (
              shared ? (
                <div className="card stack share-link">
                  <label className="field">Private link<input className="input" readOnly value={shared.url} onFocus={(event) => event.currentTarget.select()} /></label>
                  <p className="small muted">Expires {formatDate(shared.expiresAt)}. Anyone with the complete link can read this snapshot.</p>
                  <div className="row">
                    <button type="button" className="btn btn--secondary btn--sm" onClick={async () => { await navigator.clipboard.writeText(shared.url); setShareMessage('Link copied.'); }}>Copy link</button>
                    <button type="button" className="btn btn--quiet btn--sm" onClick={async () => { await revokeSharedReport(shared.id); setShared(null); setShareMessage('Link revoked.'); }}>Revoke</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn btn--secondary btn--block" onClick={async () => {
                  try {
                    setShareMessage('Creating private link…');
                    setShared(await createSharedReport(asText()));
                    setShareMessage('Private link created.');
                  } catch (reason) {
                    setShareMessage(reason instanceof Error ? reason.message : 'The private link could not be created.');
                  }
                }}>
                  <Icon name="lock" size={18} /> Create 7-day private link
                </button>
              )
            )}
            {shareMessage && <p className="small" role="status">{shareMessage}</p>}
          </div>
          <section className="card stack" id="counselor" aria-labelledby="counselor-share-h">
            <h2 id="counselor-share-h" className="h3">Share with a counselor</h2>
            <p className="small">A counselor report includes your first and last name, Called member ID and structured results. It excludes your journey code, journal and item-level assessment answers.</p>
            {counselorAccountsAvailable && (
              <>
                {!profile.name || !profile.lastName ? (
                  <Callout tone="warn">Add your first and last name in <Link to="/account">your account</Link> before sharing with a counselor account.</Callout>
                ) : (
                  <>
                    <label className="field">Counselor ID<input className="input" value={counselorId} onChange={(event) => { setCounselorId(event.target.value); setCounselor(null); }} placeholder="COUN-ABCD-2345-EFGH" autoCapitalize="characters" /></label>
                    {!counselor ? (
                      <button type="button" className="btn btn--primary btn--block" disabled={!counselorId.trim()} onClick={async () => {
                        try { setShareMessage('Finding counselor…'); setCounselor(await findCounselor(counselorId)); setShareMessage(''); }
                        catch (reason) { setShareMessage(reason instanceof Error ? reason.message : 'Counselor account not found.'); }
                      }}><Icon name="search" size={18} /> Find counselor</button>
                    ) : (
                      <div className="share-confirm">
                        <p><strong>{counselor.firstName} {counselor.lastName}</strong>{counselor.organization ? <span className="small muted">{counselor.organization}</span> : null}</p>
                        <button type="button" className="btn btn--primary btn--block" disabled={sharingWithCounselor} onClick={async () => {
                          setSharingWithCounselor(true);
                          try {
                            const prior = profile.counselorShares.find((share) => share.counselorId === counselor.id);
                            const result = await shareWithCounselor(createCounselorPacket(profile, true), counselor.id, prior?.shareKey);
                            const now = new Date().toISOString();
                            update((draft) => {
                              const existing = draft.counselorShares.find((share) => share.counselorId === result.counselor.id);
                              if (existing) { existing.counselorName = `${result.counselor.firstName} ${result.counselor.lastName}`; existing.updatedAt = now; existing.shareKey = result.shareKey; }
                              else draft.counselorShares.push({ counselorId: result.counselor.id, counselorName: `${result.counselor.firstName} ${result.counselor.lastName}`, sharedAt: now, updatedAt: now, shareKey: result.shareKey });
                            });
                            setShareMessage(`Results shared with ${result.counselor.firstName} ${result.counselor.lastName}.`);
                          } catch (reason) { setShareMessage(reason instanceof Error ? reason.message : 'Your counselor report could not be shared.'); }
                          finally { setSharingWithCounselor(false); }
                        }}>{sharingWithCounselor ? 'Sharing…' : 'Confirm and share results'}</button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {!counselorAccountsAvailable && <p className="small muted">Counselor accounts are not connected in this deployment yet. You can still send a counselor packet directly.</p>}
            <button type="button" className="btn btn--secondary btn--block" onClick={downloadCounselorPacket}><Icon name="download" size={18} /> Download counselor packet</button>
            <button type="button" className="btn btn--quiet btn--block" onClick={async () => {
              try {
                const result = await shareFile(counselorPacket(), 'Called counselor packet', 'A student-approved Called exploration summary.');
                setShareMessage(result === 'shared' ? 'Counselor packet shared.' : 'Packet downloaded. Attach it to an email for your counselor.');
              } catch (reason) {
                if (!(reason instanceof DOMException && reason.name === 'AbortError')) setShareMessage('The packet could not be shared. You can download it instead.');
              }
            }}><Icon name="mail" size={18} /> Email or share counselor packet</button>
          </section>
          <Callout>The report is built in your browser. Downloads stay on your device. Email creates a draft in your mail app, where the report is readable to you and the recipient. Private links upload only encrypted text and expire after seven days.</Callout>
        </aside>
      </div>
    </div>
  );
}
