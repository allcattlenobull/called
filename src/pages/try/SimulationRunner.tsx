import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SIM_BY_ID, type SimStep } from '../../data/simulations';
import { CAREER_BY_ID } from '../../data/careers';
import { useStore } from '../../state/store';
import { useDraft } from '../../state/useDraft';
import { matchCareer } from '../../lib/matching';
import { SimBlocks } from '../../components/SimBlocks';
import { Callout, Chip, OptionGroup } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { OverallScore } from '../../components/Match';
import NotFound from '../NotFound';
import type { SimulationResult } from '../../types';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { uid } from '../../lib/profile';
import { SIMULATION_EVIDENCE } from '../../data/simulations/evidence';
import { recordResearchEvent } from '../../lib/researchParticipation';

type Answer = { picked: string[]; text?: string; submitted: boolean };

export default function SimulationRunner() {
  const { id = '' } = useParams();
  const sim = SIM_BY_ID[id];
  useDocumentTitle(sim ? `${sim.role} simulation` : undefined);
  const { profile, update, settings } = useStore();
  // The run is saved as a draft, so someone can close the tab mid-simulation and finish later.
  type Run = { phase: 'intro' | 'steps' | 'reflect' | 'done'; stepIdx: number; answers: Record<string, Answer>; before: Record<string, number | null>; startedAt?: string };
  const [run, setRun, clearRun, resumed] = useDraft<Run>(`sim:${id}`, { phase: 'intro', stepIdx: 0, answers: {}, before: {} });
  const { phase, stepIdx, answers, before } = run;
  const setPhase = (ph: Run['phase']) => setRun((r) => ({ ...r, phase: ph }));
  const setStepIdx = (fn: (i: number) => number) => setRun((r) => ({ ...r, stepIdx: fn(r.stepIdx) }));
  const setAnswers = (fn: (prev: Record<string, Answer>) => Record<string, Answer>) => setRun((r) => ({ ...r, answers: fn(r.answers) }));
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Reflection
  const [enjoyment, setEnjoyment] = useState<number | undefined>();
  const [enjoyed, setEnjoyed] = useState<string[]>([]);
  const [frustrated, setFrustrated] = useState<string[]>([]);
  const [regularly, setRegularly] = useState<SimulationResult['regularly'] | undefined>();
  const [natural, setNatural] = useState('');
  const [understanding, setUnderstanding] = useState<number | undefined>();
  const [clarity, setClarity] = useState<number | undefined>();
  const [nextStep, setNextStep] = useState<NonNullable<SimulationResult['outcome']>['nextStep'] | undefined>();
  const [outcomeSaved, setOutcomeSaved] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, [phase, stepIdx]);

  const quality = useMemo(() => {
    if (!sim) return 0;
    const scored = sim.steps.filter((s) => s.type !== 'text');
    if (!scored.length) return 0;
    const total = scored.reduce((sum, s) => {
      const a = answers[s.id];
      if (!a) return sum;
      const scores: number[] = a.picked.map((p) => s.options?.find((o) => o.id === p)?.score ?? 0);
      return sum + (scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length / 2 : 0);
    }, 0);
    return total / scored.length;
  }, [answers, sim]);

  if (!sim) return <NotFound />;
  const step = sim.steps[stepIdx];
  const answer = step ? answers[step.id] : undefined;

  const start = () => {
    setRun({ phase: 'steps', stepIdx: 0, answers: {}, before: Object.fromEntries(sim.careerIds.map((c) => [c, CAREER_BY_ID[c] ? matchCareer(CAREER_BY_ID[c], profile).overall : null])), startedAt: new Date().toISOString() });
  };

  const pick = (s: SimStep, optionId: string) => {
    setAnswers((prev) => {
      const cur = prev[s.id] ?? { picked: [], submitted: false };
      if (cur.submitted) return prev;
      if (s.type === 'choice') return { ...prev, [s.id]: { picked: [optionId], submitted: true } };
      const has = cur.picked.includes(optionId);
      const max = s.pick ?? 2;
      const picked = has ? cur.picked.filter((x) => x !== optionId) : cur.picked.length >= max ? cur.picked : [...cur.picked, optionId];
      return { ...prev, [s.id]: { ...cur, picked } };
    });
  };

  const submit = () => {
    setAnswers((prev) => ({ ...prev, [step.id]: { ...(prev[step.id] ?? { picked: [] }), submitted: true } }));
  };

  const finish = () => {
    if (!enjoyment || !regularly) return;
    const completedAt = new Date().toISOString();
    const runId = uid('simrun');
    const evidence = SIMULATION_EVIDENCE[sim.id];
    update((p) => {
      p.simulations.push({
        runId,
        simulationId: sim.id,
        completedAt,
        enjoyment,
        enjoyed,
        frustrated,
        regularly,
        natural: natural.trim(),
        instrumentVersion: evidence.version,
      });
    });
    void recordResearchEvent(settings, 'simulation_completion', {
      simulationId: sim.id,
      runId,
      instrumentVersion: evidence.version,
      startedAt: run.startedAt,
      completedAt,
      responses: Object.fromEntries(Object.entries(answers).map(([stepId, value]) => [stepId, value.picked])),
      shadowScore: Math.round(quality * 100) / 100,
      enjoyment,
      enjoyed,
      frustrated,
      regularly,
    });
    setPhase('done');
    clearRun();
  };

  if (phase === 'intro') {
    return (
      <div className="wrap wrap--narrow sim">
        <Link to="/try" className="backlink">
          <Icon name="arrowLeft" size={18} />
          All simulations
        </Link>
        <span className="tag tag--primary">{sim.role} simulation</span>
        <h1 ref={headingRef} tabIndex={-1}>
          {sim.title}
        </h1>
        <p className="lead">{sim.setup}</p>
        <SimBlocks blocks={sim.context} />
        <div className="row small muted" style={{ marginTop: 'var(--s-4)' }}>
          <span>
            <Icon name="clock" size={14} /> About {sim.minutes} minutes
          </span>
          <span>{sim.steps.length} decisions</span>
        </div>
        <Callout title="There’s no grade">
          You’ll see how professionals might think about each choice. What matters most is noticing what you enjoyed and what felt like a grind.
        </Callout>
        <Callout tone="evidence" title={`${SIMULATION_EVIDENCE[sim.id].evidenceStatus} · version ${SIMULATION_EVIDENCE[sim.id].version}`}>
          This experience is designed for career exploration, not hiring or diagnosis. Its content is mapped to named work constructs; occupation-expert review and outcome validation are still pending.{' '}
          <Link to="/research#simulations">See the evidence standard</Link>.
        </Callout>
        <div className="runner__nav">
          <span />
          <button type="button" className="btn btn--primary btn--lg" onClick={start}>
            Start simulation
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'steps') {
    const canSubmitMulti = step.type === 'multi' && (answer?.picked.length ?? 0) === (step.pick ?? 2);
    const canSubmitText = step.type === 'text' && (answer?.text?.trim().length ?? 0) > 10;
    return (
      <div className="wrap sim sim--running">
        <div className="sim__layout">
          <details className="sim__case" open>
            <summary>Case file</summary>
            <p className="small">{sim.setup}</p>
            <SimBlocks blocks={sim.context} />
          </details>
          <section className="runner" aria-live="polite">
            {resumed && stepIdx > 0 && (
              <div className="resume-note">
                <Icon name="check" size={16} /> Picked up where you left off.
                <button type="button" className="btn btn--quiet btn--sm" onClick={() => setRun({ phase: 'intro', stepIdx: 0, answers: {}, before: {} })}>
                  Start over
                </button>
              </div>
            )}
            <p className="runner__count">
              Decision {stepIdx + 1} of {sim.steps.length}: {step.title}
            </p>
            <div className="progress__track" aria-hidden="true" style={{ marginBottom: 'var(--s-5)' }}>
              <span style={{ width: `${(stepIdx / sim.steps.length) * 100}%` }} />
            </div>
            <div className="runner__step" key={step.id}>
              <h1 className="question" ref={headingRef} tabIndex={-1}>
                {step.prompt}
              </h1>
              {step.blocks && <SimBlocks blocks={step.blocks} />}
              {step.type !== 'text' && step.options && (
                <>
                  {step.type === 'multi' && (
                    <p className="small muted">
                      Choose {step.pick ?? 2}. {answer?.submitted ? '' : `${answer?.picked.length ?? 0} selected.`}
                    </p>
                  )}
                  <ul className="sim-options">
                    {step.options.map((o) => {
                      const picked = answer?.picked.includes(o.id);
                      const show = answer?.submitted;
                      return (
                        <li key={o.id}>
                          <button
                            type="button"
                            className={`sim-option${picked ? ' is-picked' : ''}${show ? (o.score === 2 ? ' is-strong' : picked ? ' is-weak' : ' is-dim') : ''}`}
                            aria-pressed={step.type === 'multi' ? picked : undefined}
                            onClick={() => pick(step, o.id)}
                            aria-disabled={show}
                          >
                            <span className="sim-option__mark" aria-hidden="true">
                              {picked && <Icon name="check" size={16} />}
                            </span>
                            <span>{o.label}</span>
                          </button>
                          {show && (picked || o.score === 2) && (
                            <div className={`feedback${o.score === 2 ? '' : ' feedback--weak'}`}>
                              {o.score === 2 && <strong>{picked ? 'A strong approach. ' : 'Professionals often choose this. '}</strong>}
                              {o.feedback}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {step.type === 'multi' && !answer?.submitted && (
                    <button type="button" className="btn btn--primary" disabled={!canSubmitMulti} onClick={submit}>
                      Lock in my choices
                    </button>
                  )}
                </>
              )}
              {step.type === 'text' && (
                <div className="stack">
                  <label htmlFor="sim-text" className="visually-hidden">
                    Your response
                  </label>
                  <textarea
                    id="sim-text"
                    className="textarea"
                    placeholder={step.placeholder}
                    value={answer?.text ?? ''}
                    readOnly={answer?.submitted}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [step.id]: { picked: [], text: e.target.value, submitted: false } }))}
                  />
                  {!answer?.submitted ? (
                    <button type="button" className="btn btn--primary" disabled={!canSubmitText} onClick={submit}>
                      Compare with how a professional might approach it
                    </button>
                  ) : (
                    <div className="feedback">
                      <strong>A professional would likely include:</strong>
                      <ul style={{ margin: 'var(--s-2) 0 0' }}>
                        {step.guidance?.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="runner__nav">
              <span />
              <button
                type="button"
                className="btn btn--primary"
                disabled={!answer?.submitted}
                onClick={() => {
                  if (stepIdx < sim.steps.length - 1) setStepIdx((i) => i + 1);
                  else setPhase('reflect');
                }}
              >
                {stepIdx < sim.steps.length - 1 ? 'Next decision' : 'Reflect on this'}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (phase === 'reflect') {
    const toggle = (set: Dispatch<SetStateAction<string[]>>, v: string) => set((xs) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]));
    return (
      <div className="wrap wrap--narrow sim">
        <span className="tag tag--purpose">Reflection</span>
        <h1 ref={headingRef} tabIndex={-1}>
          How did that feel?
        </h1>
        <p className="lead">Your honest answers matter more than how you did. They update your Purpose Compass and your recommendations.</p>
        <Callout>{sim.realityNote}</Callout>
        <div className="stack-lg" style={{ marginTop: 'var(--s-5)' }}>
          <OptionGroup
            legend="Did you enjoy this?"
            layout="row"
            value={enjoyment}
            onChange={setEnjoyment}
            options={[
              { value: 1, label: 'Not at all' },
              { value: 2, label: 'A little' },
              { value: 3, label: 'It was okay' },
              { value: 4, label: 'Yes' },
              { value: 5, label: 'Loved it' },
            ]}
          />
          <div className="field">
            <span className="field__label">What did you enjoy?</span>
            <div className="chips">
              {sim.aspects.map((a) => (
                <Chip key={a.id} family="life" selected={enjoyed.includes(a.id)} onClick={() => toggle(setEnjoyed, a.id)}>
                  {a.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field__label">What frustrated you?</span>
            <div className="chips">
              {sim.aspects.map((a) => (
                <Chip key={a.id} selected={frustrated.includes(a.id)} onClick={() => toggle(setFrustrated, a.id)}>
                  {a.label}
                </Chip>
              ))}
            </div>
          </div>
          <OptionGroup
            legend="Would you want to do this kind of work regularly?"
            layout="row"
            value={regularly}
            onChange={setRegularly}
            options={[
              { value: 'yes' as const, label: 'Yes' },
              { value: 'maybe' as const, label: 'Maybe' },
              { value: 'no' as const, label: 'No' },
            ]}
          />
          <div className="field">
            <label htmlFor="natural">What part felt natural?</label>
            <textarea id="natural" className="textarea" value={natural} onChange={(e) => setNatural(e.target.value)} placeholder="Optional, but these notes help you notice patterns later." />
          </div>
        </div>
        <div className="runner__nav">
          <span />
          <button type="button" className="btn btn--primary btn--lg" disabled={!enjoyment || !regularly} onClick={finish}>
            Save my reflection
          </button>
        </div>
      </div>
    );
  }

  // done
  const after = sim.careerIds.map((c) => ({ career: CAREER_BY_ID[c], now: CAREER_BY_ID[c] ? matchCareer(CAREER_BY_ID[c], profile) : null })).filter((x) => x.career && x.now);
  const pendingOutcome = [...profile.simulations].reverse().find((item) => item.simulationId === sim.id && !item.outcome);
  const saveOutcome = () => {
    if (!understanding || !clarity || !nextStep) return;
    const completedAt = new Date().toISOString();
    update((p) => {
      const result = p.simulations.find((item) => item.runId === pendingOutcome?.runId) ?? [...p.simulations].reverse().find((item) => item.simulationId === sim.id && !item.outcome);
      if (result) result.outcome = { understanding, clarity, nextStep, completedAt };
    });
    void recordResearchEvent(settings, 'simulation_outcome', { simulationId: sim.id, runId: pendingOutcome?.runId, instrumentVersion: SIMULATION_EVIDENCE[sim.id].version, understanding, clarity, nextStep });
    setOutcomeSaved(true);
  };
  return (
    <div className="wrap wrap--narrow sim">
      <span className="tag tag--done">
        <Icon name="check" size={14} /> Saved
      </span>
      <h1 ref={headingRef} tabIndex={-1}>
        Here’s what changed
      </h1>
      <p className="lead">
        {enjoyment && enjoyment >= 4
          ? 'You enjoyed this. Careers built on this kind of work moved up in your recommendations.'
          : enjoyment && enjoyment <= 2
            ? 'This didn’t feel like you, and that’s useful evidence. Related careers moved down a bit.'
            : 'A mixed reaction is common. Related careers shifted slightly.'}
      </p>
      <div className="table-wrap">
        <table className="table">
          <caption className="visually-hidden">Fit before and after this simulation</caption>
          <thead>
            <tr>
              <th scope="col">Career</th>
              <th scope="col" className="num">
                Before
              </th>
              <th scope="col" className="num">
                Now
              </th>
            </tr>
          </thead>
          <tbody>
            {after.map(({ career, now }) => (
              <tr key={career!.id}>
                <th scope="row">
                  <Link to={`/careers/${career!.id}`}>{career!.title}</Link>
                </th>
                <td className="num">{before[career!.id] ?? '–'}</td>
                <td className="num">{now && <OverallScore match={now} size="sm" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: 'var(--s-3)' }}>
        The scenario feedback is for learning, not scoring. Your reflection and reactions are the evidence saved to your path.
      </p>
      <section className="card stack" aria-labelledby="outcome-h" style={{ marginTop: 'var(--s-5)' }}>
        <h2 id="outcome-h" className="h3">Did this simulation help?</h2>
        {outcomeSaved ? (
          <Callout tone="evidence">Thanks. This outcome is saved separately and does not change your career score.</Callout>
        ) : (
          <>
            <OptionGroup legend="I understand this kind of work better" layout="row" value={understanding} onChange={setUnderstanding} options={[1, 2, 3, 4, 5].map((value) => ({ value, label: String(value), hint: value === 1 ? 'Not yet' : value === 5 ? 'Much better' : undefined }))} />
            <OptionGroup legend="I feel clearer about whether to explore it" layout="row" value={clarity} onChange={setClarity} options={[1, 2, 3, 4, 5].map((value) => ({ value, label: String(value), hint: value === 1 ? 'Not clear' : value === 5 ? 'Very clear' : undefined }))} />
            <OptionGroup legend="What will you do next?" value={nextStep} onChange={setNextStep} options={[
              { value: 'explore' as const, label: 'Explore this career more' },
              { value: 'compare' as const, label: 'Compare it with another path' },
              { value: 'talk' as const, label: 'Talk with someone in the field' },
              { value: 'pause' as const, label: 'Pause this path for now' },
            ]} />
            <button type="button" className="btn btn--secondary" disabled={!understanding || !clarity || !nextStep} onClick={saveOutcome}>Save this check-in</button>
          </>
        )}
      </section>
      <div className="row" style={{ marginTop: 'var(--s-5)' }}>
        <Link to="/try" className="btn btn--primary">
          Try another simulation
        </Link>
        <Link to="/purpose" className="btn btn--secondary">
          See my compass
        </Link>
      </div>
    </div>
  );
}
