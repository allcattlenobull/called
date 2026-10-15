import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../../state/store';
import { CAREER_BY_ID, CAREERS } from '../../data/careers';
import { PRINCIPLE_BY_ID } from '../../data/scripture/principles';
import {
  GATE_ANSWERS,
  HORIZONS,
  canLead,
  concerns,
  doneCount,
  gateDue,
  generateRoadmap,
  isDone,
  learnedInsights,
  nextBestAction,
  openQuestions,
  pathEvidence,
  retailorRoadmap,
  whyItFits,
  type NextAction,
  type PathEvidence,
} from '../../lib/path';
import { insights } from '../../lib/compass';
import { suggestions } from '../../lib/matching';
import { progressCounts } from '../../lib/next';
import { uid } from '../../lib/profile';
import { formatDate } from '../../lib/format';
import { EmptyState, PageHeader } from '../../components/ui';
import { Icon } from '../../components/Icon';
import type { Career, GateAnswer, Profile, Roadmap, RoadmapItem } from '../../types';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

const STAGES: { value: NonNullable<Profile['stage']>; label: string }[] = [
  { value: 'highSchool', label: 'In high school' },
  { value: 'graduated', label: 'Finished high school' },
  { value: 'college', label: 'In college or training' },
  { value: 'working', label: 'Working' },
  { value: 'other', label: 'Something else' },
];

const STAGE_LABEL = { exploring: 'Exploring', leading: 'Leading path', ruledOut: 'Ruled out' } as const;

const GATE_REPLY: Record<GateAnswer, string> = {
  stronger: 'Noted: your interest grew. That’s real evidence, and it’s now part of your path.',
  same: 'Noted. Steady interest is useful too. Keep gathering evidence.',
  less: 'Noted. Cooling interest is worth listening to. Your next steps will help you see whether it lasts.',
  ruleOut: 'Path ruled out. Knowing what doesn’t fit is progress, and you can reopen it anytime.',
};

function ActionLink({ action, onGate }: { action: NextAction; onGate: () => void }) {
  if (action.to === '#gate') {
    return (
      <button type="button" className="btn btn--primary" onClick={onGate}>
        {action.cta} <Icon name="arrowRight" size={18} />
      </button>
    );
  }
  if (action.to.startsWith('#')) {
    return (
      <a href={action.to} className="btn btn--primary">
        {action.cta} <Icon name="arrowRight" size={18} />
      </a>
    );
  }
  return (
    <Link to={action.to} className="btn btn--primary">
      {action.cta} <Icon name="arrowRight" size={18} />
    </Link>
  );
}

function EvidenceMeter({ ev }: { ev: PathEvidence }) {
  const pct = Math.round(ev.score * 100);
  return (
    <div className={`evidence-meter evidence-meter--${ev.level.toLowerCase()}`}>
      <div className="evidence-meter__head">
        <span className="small muted">Evidence for this path</span>
        <strong className="evidence-meter__level">{ev.level}</strong>
      </div>
      <div className="evidence-meter__track" role="img" aria-label={`Evidence: ${ev.level}, ${pct}% of the possible evidence gathered`}>
        <span style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
      <ul className="ev-checks" aria-label="Evidence checklist">
        {ev.checks.map((x) => (
          <li key={x.id} className={x.met ? 'is-met' : ''}>
            <span className="ev-checks__mark" aria-hidden="true">
              {x.met ? <Icon name="check" size={14} /> : null}
            </span>
            <span>
              <span className="visually-hidden">{x.met ? 'Done: ' : 'Not yet: '}</span>
              {x.met ? x.label : x.missing}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PathHero({ c, r, ev, p, onGate, onLead }: { c: Career; r: Roadmap; ev: PathEvidence; p: Profile; onGate: () => void; onLead: (lead: boolean) => void }) {
  const why = whyItFits(c, p, ev);
  const worries = concerns(ev);
  const questions = openQuestions(c, p, ev);
  const next = nextBestAction(c, p, r, ev);
  const lead = canLead(r, ev);
  const match = ev.match.overall;

  return (
    <section className="path-hero" aria-labelledby="path-title">
      <div className="path-hero__top">
        <div>
          <span className={`tag ${r.stage === 'leading' ? 'tag--primary' : 'tag--done'}`}>{STAGE_LABEL[r.stage ?? 'exploring']}</span>
          <h2 id="path-title" className="path-hero__title">
            <Link to={`/careers/${c.id}`}>{c.title}</Link>
          </h2>
          <p className="muted path-hero__snap">
            {match !== null ? (
              <>
                <strong className="path-hero__match">{match}% match</strong> · {ev.match.confidence} confidence in the match
              </>
            ) : (
              'Finish a few assessments to see how well this matches you.'
            )}
          </p>
        </div>
        <EvidenceMeter ev={ev} />
      </div>

      <div className="path-hero__grid">
        <div className="path-block">
          <h3 className="h4">Why this path fits</h3>
          {why.length ? (
            <ul className="reasons">
              {why.map((w) => (
                <li key={w}>
                  <Icon name="check" size={16} />
                  {w}
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted">Not much evidence yet. That’s fine; the steps below will show you.</p>
          )}
          {worries.length > 0 && (
            <>
              <h3 className="h4 path-block__sub">Still weighing</h3>
              <ul className="reasons reasons--warn">
                {worries.map((w) => (
                  <li key={w}>
                    <Icon name="alert" size={16} />
                    {w}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="path-block">
          <h3 className="h4">Questions still unanswered</h3>
          {questions.length ? (
            <>
              <p className="path-question">
                <span className="small muted">Biggest unanswered question</span>
                {questions[0].question}
              </p>
              {questions.length > 1 && (
                <ul className="plain small path-questions">
                  {questions.slice(1).map((q) => (
                    <li key={q.id}>{q.question}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="small muted">You’ve answered the big questions for this path. Compare it with another or make your next real step.</p>
          )}
        </div>
      </div>

      <div className="next-best" aria-labelledby="next-best-h">
        <div>
          <span className="next-best__eyebrow" id="next-best-h">
            Your next best step
          </span>
          <p className="next-best__title">{next.title}</p>
          <p className="next-best__why">
            <strong>Why:</strong> {next.why}
          </p>
        </div>
        <ActionLink action={next} onGate={onGate} />
      </div>

      <div className="path-hero__lead">
        {r.stage === 'leading' ? (
          <>
            <p className="small">
              <Icon name="check" size={16} /> You’ve made this a leading path. That means it has earned more of your time, not that it’s decided forever.
            </p>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => onLead(false)}>
              Step back to exploring
            </button>
          </>
        ) : lead.ok ? (
          <>
            <p className="small">{lead.reason}</p>
            <button type="button" className="btn btn--secondary" onClick={() => onLead(true)}>
              Make this a leading path
            </button>
          </>
        ) : (
          <p className="small muted">
            <Icon name="lock" size={16} /> <strong>Leading path:</strong> {lead.reason}
          </p>
        )}
      </div>
    </section>
  );
}

function Gate({ r, onAnswer, onClose, due }: { r: Roadmap; onAnswer: (a: GateAnswer) => void; onClose: () => void; due: boolean }) {
  return (
    <section id="gate" className="gate" aria-labelledby="gate-h" tabIndex={-1}>
      <h2 id="gate-h" className="h3">
        After what you’ve learned, how interested are you now?
      </h2>
      <p className="small muted">
        {due ? `You’ve taken several steps on ${r.goal.toLowerCase()} since you last checked in.` : 'Check in anytime.'} Your answer shapes your next steps. There’s no wrong answer.
      </p>
      <div className="gate__options" role="group" aria-label="How interested are you now?">
        {GATE_ANSWERS.map((g) => (
          <button key={g.id} type="button" className={`btn ${g.id === 'ruleOut' ? 'btn--quiet' : 'btn--secondary'} gate__opt gate__opt--${g.id}`} onClick={() => onAnswer(g.id)}>
            {g.label}
          </button>
        ))}
      </div>
      {!due && (
        <button type="button" className="btn btn--quiet btn--sm" onClick={onClose}>
          Not now
        </button>
      )}
    </section>
  );
}

function Roadmap_({ c, r, p, update }: { c: Career; r: Roadmap; p: Profile; update: ReturnType<typeof useStore>['update'] }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const total = r.items.length;
  const done = r.items.filter((i) => isDone(i, c, p)).length;

  const editItem = (itemId: string, fn: (i: RoadmapItem) => void) =>
    update((pp) => {
      const item = pp.roadmaps.find((x) => x.careerId === r.careerId)?.items.find((i) => i.id === itemId);
      if (item) fn(item);
    });

  return (
    <section id="roadmap" className="roadmap" aria-labelledby="roadmap-h">
      <div className="roadmap__head">
        <div>
          <h2 id="roadmap-h" className="h3" style={{ margin: 0 }}>
            Your roadmap
          </h2>
          <p className="small muted" style={{ margin: 0 }}>
            Shaped by your stage of life, money and location priorities, and what you’ve already done. Steps marked “auto” check themselves off.
          </p>
        </div>
        <div className="roadmap__meter">
          <span className="small muted">
            {done} of {total} steps done
          </span>
          <div className="progress__track" aria-hidden="true">
            <span style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>
      <div className="roadmap__cols">
        {HORIZONS.map((h) => (
          <div key={h.id} className="roadmap__col">
            <h3 className="h4" style={{ marginBottom: 0 }}>
              {h.label}
            </h3>
            <p className="small muted roadmap__blurb">{h.blurb}</p>
            <ul className="steps">
              {r.items
                .filter((i) => i.horizon === h.id)
                .map((item) => {
                  const auto = !!item.auto && isDone(item, c, p) && !item.done;
                  const checked = isDone(item, c, p);
                  return (
                    <li key={item.id} className={`step${checked ? ' is-done' : ''}`}>
                      <label className="step__check">
                        <input type="checkbox" checked={checked} disabled={auto} onChange={(e) => editItem(item.id, (i) => void (i.done = e.target.checked))} />
                        <span className="visually-hidden">
                          {auto ? `“${item.text}” was done automatically` : `Mark “${item.text}” ${checked ? 'not done' : 'done'}`}
                        </span>
                      </label>
                      {editing === item.id ? (
                        <input
                          className="input input--inline"
                          defaultValue={item.text}
                          autoFocus
                          aria-label="Edit step"
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v) editItem(item.id, (i) => void (i.text = v));
                            setEditing(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') setEditing(null);
                          }}
                        />
                      ) : (
                        <span className="step__text">
                          {item.to && !checked ? <Link to={item.to}>{item.text}</Link> : item.text}
                          {item.auto && <span className="step__auto">{auto ? 'auto · done' : 'auto'}</span>}
                        </span>
                      )}
                      <span className="step__actions">
                        <button type="button" className="btn btn--icon btn--sm" aria-label={`Edit “${item.text}”`} onClick={() => setEditing(item.id)}>
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn--icon btn--sm"
                          aria-label={`Delete “${item.text}”`}
                          onClick={() =>
                            update((pp) => {
                              const rr = pp.roadmaps.find((x) => x.careerId === r.careerId);
                              if (rr) rr.items = rr.items.filter((i) => i.id !== item.id);
                            })
                          }
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </span>
                    </li>
                  );
                })}
            </ul>
            <form
              className="step-add"
              onSubmit={(e) => {
                e.preventDefault();
                const text = drafts[h.id]?.trim();
                if (!text) return;
                update((pp) => {
                  pp.roadmaps.find((x) => x.careerId === r.careerId)?.items.push({ id: uid('step'), text, horizon: h.id, done: false, mine: true });
                });
                setDrafts((d) => ({ ...d, [h.id]: '' }));
              }}
            >
              <label htmlFor={`add-${h.id}`} className="visually-hidden">
                Add a step for {h.label.toLowerCase()}
              </label>
              <input id={`add-${h.id}`} className="input" placeholder="Add a step" value={drafts[h.id] ?? ''} onChange={(e) => setDrafts((d) => ({ ...d, [h.id]: e.target.value }))} />
              <button type="submit" className="btn btn--icon" aria-label={`Add step to ${h.label.toLowerCase()}`}>
                <Icon name="plus" />
              </button>
            </form>
          </div>
        ))}
      </div>
      <div className="row roadmap__foot">
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          onClick={() =>
            update((pp) => {
              const i = pp.roadmaps.findIndex((x) => x.careerId === r.careerId);
              if (i >= 0) pp.roadmaps[i] = retailorRoadmap(pp.roadmaps[i], c, pp);
            })
          }
        >
          <Icon name="spark" size={16} /> Re-tailor steps to me
        </button>
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          onClick={() => {
            if (!window.confirm(`Remove ${r.goal} from the paths you’re testing? Your steps will be deleted.`)) return;
            update((pp) => void (pp.roadmaps = pp.roadmaps.filter((x) => x.careerId !== r.careerId)));
          }}
        >
          <Icon name="trash" size={16} /> Remove this path
        </button>
      </div>
    </section>
  );
}

export default function MyPath() {
  useDocumentTitle('My Path');
  const { profile, update, settings } = useStore();
  const [params, setParams] = useSearchParams();
  const [newCareer, setNewCareer] = useState('');
  const [gateOpen, setGateOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [reflection, setReflection] = useState('');
  const [savedReflection, setSavedReflection] = useState(false);

  const active = profile.roadmaps.filter((r) => r.stage !== 'ruledOut');
  const ruledOut = profile.roadmaps.filter((r) => r.stage === 'ruledOut');
  const ordered = [...active].sort((a, b) => Number(b.stage === 'leading') - Number(a.stage === 'leading'));
  const wanted = params.get('career');
  const roadmap = active.find((r) => r.careerId === wanted) ?? ordered[0];
  const career = roadmap ? CAREER_BY_ID[roadmap.careerId] : undefined;

  const evidence = useMemo(() => Object.fromEntries(active.map((r) => [r.careerId, CAREER_BY_ID[r.careerId] ? pathEvidence(CAREER_BY_ID[r.careerId], profile) : undefined])), [active, profile]);
  const ev = roadmap ? evidence[roadmap.careerId] : undefined;
  const due = !!roadmap && gateDue(roadmap, profile);
  const learned = useMemo(() => learnedInsights(profile), [profile]);
  const fallback = useMemo(() => (learned.length < 3 ? insights(profile).filter((t) => !learned.some((l) => l.text === t)) : []), [learned, profile]);
  const counts = progressCounts(profile);
  const ideas = useMemo(() => (profile.roadmaps.length ? [] : suggestions(profile, 3).map((s) => s.career)), [profile]);
  const stewardship = PRINCIPLE_BY_ID.stewardship;

  const candidates = [...profile.saved.map((id) => CAREER_BY_ID[id]).filter(Boolean), ...CAREERS.filter((c) => !profile.saved.includes(c.id))].filter((c) => !profile.roadmaps.some((r) => r.careerId === c.id));

  const select = (id: string) => setParams({ career: id }, { replace: true });

  const explore = (id: string) => {
    const c = CAREER_BY_ID[id];
    if (!c) return;
    update((p) => {
      p.roadmaps.unshift(generateRoadmap(c, p));
      if (!p.saved.includes(id)) p.saved.push(id);
      if (!p.careerStatus[id] || p.careerStatus[id] === 'curious') p.careerStatus[id] = 'exploring';
    });
    setNewCareer('');
    select(id);
    setNotice(`Now exploring ${c.title}. Exploring isn’t committing; it’s gathering evidence.`);
  };

  const answerGate = (a: GateAnswer) => {
    if (!roadmap || !ev) return;
    const id = roadmap.careerId;
    update((p) => {
      const r = p.roadmaps.find((x) => x.careerId === id);
      if (!r) return;
      r.gates = [...(r.gates ?? []), { at: new Date().toISOString(), answer: a, evidence: Math.round(ev.score * 100) / 100, doneCount: doneCount(r, p) }];
      if (a === 'stronger') p.careerStatus[id] = 'strong';
      if (a === 'same' && !p.careerStatus[id]) p.careerStatus[id] = 'exploring';
      if (a === 'less') p.careerStatus[id] = 'exploring';
      if (a === 'ruleOut') {
        p.careerStatus[id] = 'notForMe';
        r.stage = 'ruledOut';
        r.stageChangedAt = new Date().toISOString();
      }
    });
    setGateOpen(false);
    setNotice(GATE_REPLY[a]);
    if (a === 'ruleOut') setParams({}, { replace: true });
  };

  const setLead = (lead: boolean) => {
    if (!roadmap) return;
    update((p) => {
      const r = p.roadmaps.find((x) => x.careerId === roadmap.careerId);
      if (!r) return;
      r.stage = lead ? 'leading' : 'exploring';
      r.stageChangedAt = new Date().toISOString();
      if (lead) p.careerStatus[r.careerId] = 'strong';
    });
    setNotice(lead ? `${roadmap.goal} is now a leading path. You can keep testing others alongside it.` : `${roadmap.goal} is back to exploring.`);
  };

  const openGate = () => {
    setGateOpen(true);
    requestAnimationFrame(() => document.getElementById('gate')?.focus());
  };

  const reopen = (id: string) =>
    update((p) => {
      const r = p.roadmaps.find((x) => x.careerId === id);
      if (r) {
        r.stage = 'exploring';
        r.stageChangedAt = new Date().toISOString();
      }
      p.careerStatus[id] = 'exploring';
    });

  const saveReflection = () => {
    const body = reflection.trim();
    if (!body) return;
    update((p) => {
      p.journal.push({ id: uid('j'), createdAt: new Date().toISOString(), prompt: 'What have you learned that changed the way you think about your future?', body });
    });
    setReflection('');
    setSavedReflection(true);
  };

  return (
    <div className="wrap mypath">
      <PageHeader title="My Path" lead="You’re not choosing forever. You’re gathering enough evidence to make your next wise decision.">
        <Link to="/path/report" className="btn btn--secondary">
          <Icon name="print" size={18} /> Create my Called report
        </Link>
      </PageHeader>

      <p className="visually-hidden" aria-live="polite">
        {notice}
      </p>
      {notice && (
        <div className="path-notice" role="status">
          <Icon name="check" size={18} />
          <span>{notice}</span>
          <button type="button" className="btn btn--icon btn--sm" aria-label="Dismiss" onClick={() => setNotice('')}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {!profile.stage && (
        <section className="card stage-ask" aria-labelledby="stage-h">
          <h2 id="stage-h" className="h4">
            Where are you right now?
          </h2>
          <p className="small muted">A 15-year-old and a 23-year-old shouldn’t get the same plan. This tailors your steps.</p>
          <div className="row">
            {STAGES.map((s) => (
              <button
                key={s.value}
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() =>
                  update((p) => {
                    p.stage = s.value;
                    p.roadmaps = p.roadmaps.map((r) => (CAREER_BY_ID[r.careerId] && r.stage !== 'ruledOut' ? retailorRoadmap(r, CAREER_BY_ID[r.careerId], p) : r));
                  })
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section className="paths-testing" aria-labelledby="testing-h">
          <div className="section-head">
            <h2 id="testing-h" className="h4">
              Paths I’m testing
            </h2>
            <a href="#new-path" className="small">
              <Icon name="plus" size={16} /> Explore another
            </a>
          </div>
          <ul className="path-tabs">
            {ordered.map((r) => {
              const e = evidence[r.careerId];
              const sel = r.careerId === roadmap?.careerId;
              return (
                <li key={r.careerId}>
                  <button type="button" className={`path-tab${sel ? ' is-selected' : ''}`} aria-pressed={sel} onClick={() => select(r.careerId)}>
                    <span className="path-tab__title">{r.goal}</span>
                    <span className="path-tab__meta">
                      {r.stage === 'leading' ? 'Leading · ' : ''}Evidence: {e?.level ?? 'Early'}
                    </span>
                    <span className="path-tab__bar" aria-hidden="true">
                      <span style={{ width: `${Math.round((e?.score ?? 0) * 100)}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {roadmap && career && ev ? (
        <>
          <PathHero key={career.id} c={career} r={roadmap} ev={ev} p={profile} onGate={openGate} onLead={setLead} />

          {(due || gateOpen) && <Gate r={roadmap} due={due} onAnswer={answerGate} onClose={() => setGateOpen(false)} />}

          {(roadmap.gates?.length ?? 0) > 0 && (
            <section className="gate-history" aria-labelledby="history-h">
              <h2 id="history-h" className="h4">
                How your interest has changed
              </h2>
              <ol className="gate-history__list">
                {roadmap.gates!.map((g) => (
                  <li key={g.at} className={`gate-chip gate-chip--${g.answer}`}>
                    <span className="small muted">{formatDate(g.at)}</span>
                    <strong>{GATE_ANSWERS.find((x) => x.id === g.answer)?.short}</strong>
                  </li>
                ))}
              </ol>
              {!due && !gateOpen && (
                <button type="button" className="btn btn--quiet btn--sm" onClick={openGate}>
                  Check in again
                </button>
              )}
            </section>
          )}
          {!due && !gateOpen && !(roadmap.gates?.length ?? 0) && (
            <p className="small muted gate-hint">
              After a few steps, Called will ask how your interest has changed. <button type="button" className="linkish" onClick={openGate}>Check in now</button>
            </p>
          )}

          <Roadmap_ c={career} r={roadmap} p={profile} update={update} />
        </>
      ) : (
        <EmptyState
          icon="path"
          title={ruledOut.length ? 'No paths in testing right now' : 'No path yet'}
          as="h2"
          action={
            ideas.length > 0 ? (
              <div className="path-ideas">
                <span className="small muted">Good places to start, based on what you’ve shared:</span>
                <div className="row">
                  {ideas.map((c) => (
                    <button key={c.id} type="button" className="btn btn--secondary btn--sm" onClick={() => explore(c.id)}>
                      Explore {c.title}
                    </button>
                  ))}
                </div>
              </div>
            ) : undefined
          }
        >
          Pick a career that seems worth testing. Exploring isn’t committing: Called drafts a few small steps to gather real evidence, and you can change all of them.
        </EmptyState>
      )}

      <section className="section" aria-labelledby="learned-h">
        <h2 id="learned-h" className="h3 section-title">
          What you’ve learned about yourself
        </h2>
        {learned.length + fallback.length > 0 ? (
          <ul className="learned-list">
            {learned.map((l) => (
              <li key={l.id}>
                <strong>{l.text}</strong>
                <span className="small muted">{l.basis}</span>
              </li>
            ))}
            {fallback.slice(0, 4 - Math.min(learned.length, 4)).map((t) => (
              <li key={t}>
                <strong>{t}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Patterns will show up here as you take assessments, try simulations and check in on your paths.</p>
        )}
        <p className="small muted">
          Built from {counts.assessments} assessment{counts.assessments === 1 ? '' : 's'}, {counts.simulations} simulation{counts.simulations === 1 ? '' : 's'}, {counts.experiments} real-world experiment
          {counts.experiments === 1 ? '' : 's'} and {counts.reflections} reflection{counts.reflections === 1 ? '' : 's'}. <Link to="/achievements">See your achievements</Link>
        </p>
      </section>

      {ruledOut.length > 0 && (
        <section className="section" aria-labelledby="ruled-h">
          <h2 id="ruled-h" className="h4">
            Paths you’ve ruled out
          </h2>
          <p className="small muted">Each one taught you something. You can reopen any of them.</p>
          <ul className="ruled-list">
            {ruledOut.map((r) => (
              <li key={r.careerId}>
                <Link to={`/careers/${r.careerId}`}>{r.goal}</Link>
                {r.stageChangedAt && <span className="small muted"> · {formatDate(r.stageChangedAt)}</span>}
                <button type="button" className="btn btn--quiet btn--sm" onClick={() => reopen(r.careerId)}>
                  Reopen
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="new-path" className="card new-roadmap" aria-labelledby="new-h">
        <h2 id="new-h" className="h4">
          {active.length ? 'Test another path alongside' : 'Explore a path'}
        </h2>
        <p className="small muted">You don’t have to narrow to one career yet. Most people test two or three.</p>
        <div className="row">
          <label htmlFor="new-career" className="visually-hidden">
            Career to explore
          </label>
          <select id="new-career" className="select" value={newCareer} onChange={(e) => setNewCareer(e.target.value)} style={{ maxWidth: 360 }}>
            <option value="">Choose a career…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
                {profile.saved.includes(c.id) ? ' (saved)' : ''}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn--primary" disabled={!newCareer} onClick={() => explore(newCareer)}>
            Explore this path
          </button>
        </div>
      </section>

      <section className="path-reflect" aria-labelledby="reflect-h">
        <span className="path-reflect__eyebrow">A question worth reflecting on</span>
        <h2 id="reflect-h" className="path-reflect__q">
          What would faithful stewardship of your abilities look like in the next six months?
        </h2>
        {settings.faithLens && stewardship && (
          <details className="path-reflect__more">
            <summary>Biblical reflection</summary>
            <div className="small">
              <p>{stewardship.idea}</p>
              {stewardship.passages.map((ps) => (
                <p key={ps.ref}>
                  <strong>{ps.ref}.</strong> {ps.kjv ? <em>“{ps.kjv}” </em> : null}
                  {ps.summary}
                </p>
              ))}
              <p className="muted">This is a lens for reflection, not a verdict about which career you should choose.</p>
            </div>
          </details>
        )}
        <div className="field path-reflect__field">
          <label htmlFor="reflect-input">What have you learned that changed the way you think about your future?</label>
          <textarea
            id="reflect-input"
            className="textarea"
            rows={3}
            value={reflection}
            onChange={(e) => {
              setReflection(e.target.value);
              setSavedReflection(false);
            }}
          />
          <div className="row">
            <button type="button" className="btn btn--secondary" disabled={!reflection.trim()} onClick={saveReflection}>
              Save to my journal
            </button>
            {savedReflection && (
              <span className="small" role="status">
                Saved. <Link to="/purpose/journal">Open your journal</Link>
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
