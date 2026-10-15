import { useMemo, useRef, useState } from 'react';
import { useStore } from '../../state/store';
import { topAptitudes, topInterests, topSkills, topValues, insights } from '../../lib/compass';
import { suggestions } from '../../lib/matching';
import { progressCounts } from '../../lib/next';
import { APTITUDES, GIFTS, INTERESTS, SKILLS, VALUES } from '../../data/vocab';
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
  const { profile } = useStore();
  const [include, setInclude] = useState<Record<SectionId, boolean>>(() => Object.fromEntries(SECTIONS.map((s) => [s.id, true])) as Record<SectionId, boolean>);
  const [showName, setShowName] = useState(true);
  const [copied, setCopied] = useState(false);
  const reportRef = useRef<HTMLElement>(null);

  const data = useMemo(() => {
    const strengths = [
      ...topSkills(profile, 4).map((s) => SKILLS[s].label),
      ...topAptitudes(profile).slice(0, 2).map((a) => `${APTITUDES[a].label} (puzzles)`),
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
                <h1 className="report__title">{showName && profile.name ? `${profile.name}’s exploration report` : 'My exploration report'}</h1>
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
                Show my first name
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
          </div>
          <Callout>Nothing is uploaded. The report is built in your browser, and you decide who sees it.</Callout>
        </aside>
      </div>
    </div>
  );
}
