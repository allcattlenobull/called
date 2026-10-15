import { useDraft } from '../../state/useDraft';
import { WORK_STYLE_ITEMS } from '../../data/assessments';
import { WORK_AXES } from '../../data/vocab';
import { useStore } from '../../state/store';
import type { WorkAxis } from '../../types';
import { NextAssessment } from './Assessment';

const SCALE = [-2, -1, 0, 1, 2] as const;
const SCALE_LABEL: Record<number, string> = { [-2]: 'Strongly left', [-1]: 'Lean left', 0: 'Both equally', 1: 'Lean right', 2: 'Strongly right' };

export function WorkStyleAssessment() {
  const { profile, update } = useStore();
  // Saved as a draft so the user can leave halfway and come back.
  const [state, setState, clearState] = useDraft<{ idx: number; answers: Record<string, number> }>('workStyle', () => ({
    idx: profile.completed.workStyle ? WORK_STYLE_ITEMS.length : 0,
    answers: {},
  }));
  const { idx, answers } = state;
  const setIdx = (fn: (i: number) => number) => setState((s) => ({ ...s, idx: fn(s.idx) }));
  const done = idx >= WORK_STYLE_ITEMS.length;

  const choose = (v: number) => {
    const item = WORK_STYLE_ITEMS[idx];
    const next = { ...answers, [item.id]: v };
    setState({ idx: idx + 1, answers: next });
    if (idx === WORK_STYLE_ITEMS.length - 1) {
      clearState();
      update((p) => {
        const sums: Partial<Record<WorkAxis, number[]>> = {};
        for (const it of WORK_STYLE_ITEMS) if (next[it.id] !== undefined) (sums[it.axis] ??= []).push(next[it.id]);
        const ws: Partial<Record<WorkAxis, number>> = {};
        for (const [axis, vals] of Object.entries(sums) as [WorkAxis, number[]][]) ws[axis] = vals.reduce((a, b) => a + b, 0) / vals.length;
        p.workStyle = ws;
        p.completed.workStyle = new Date().toISOString();
      });
    }
  };

  if (done) {
    const ws = profile.workStyle;
    return (
      <section className="runner">
        <h2>How you like to work</h2>
        <p>Neither side is better. Knowing your preferences helps you spot jobs whose daily rhythm fits you.</p>
        <ul className="axis-list">
          {(Object.keys(WORK_AXES) as WorkAxis[]).map((a) => {
            const v = ws[a];
            return (
              <li key={a}>
                <span className="axis-list__label">{WORK_AXES[a].label}</span>
                <div className="axis">
                  <span className="axis__pole">{WORK_AXES[a].left}</span>
                  <span className="axis__track" aria-hidden="true">
                    {v !== undefined && <span className="axis__dot" style={{ left: `${((v + 2) / 4) * 100}%` }} />}
                  </span>
                  <span className="axis__pole axis__pole--right">{WORK_AXES[a].right}</span>
                </div>
                <span className="visually-hidden">{v === undefined ? 'Not answered' : `${v < -0.5 ? WORK_AXES[a].left : v > 0.5 ? WORK_AXES[a].right : 'Balanced'}`}</span>
              </li>
            );
          })}
        </ul>
        <div className="row" style={{ marginTop: 'var(--s-4)' }}>
          <button type="button" className="btn btn--quiet" onClick={() => setState({ idx: 0, answers: {} })}>
            Retake
          </button>
        </div>
        <NextAssessment current="workStyle" />
      </section>
    );
  }

  const item = WORK_STYLE_ITEMS[idx];
  const current = answers[item.id];
  return (
    <section className="runner" aria-live="polite">
      <p className="runner__count">
        Choice {idx + 1} of {WORK_STYLE_ITEMS.length}
      </p>
      <div className="progress__track" aria-hidden="true" style={{ marginBottom: 'var(--s-5)' }}>
        <span style={{ width: `${(idx / WORK_STYLE_ITEMS.length) * 100}%` }} />
      </div>
      <div className="runner__step" key={item.id}>
        <h2 className="question">Which would you rather spend most of a workday doing?</h2>
        <div className="thisorthat">
          <p className="thisorthat__pole">{item.left}</p>
          <div className="thisorthat__scale" role="radiogroup" aria-label={`${item.left} or ${item.right}`}>
            {SCALE.map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={current === v}
                aria-label={SCALE_LABEL[v].replace('left', `toward “${item.left}”`).replace('right', `toward “${item.right}”`)}
                className={`tot-dot tot-dot--${Math.abs(v)}${current === v ? ' is-current' : ''}`}
                onClick={() => choose(v)}
              />
            ))}
          </div>
          <p className="thisorthat__pole thisorthat__pole--right">{item.right}</p>
        </div>
      </div>
      <div className="runner__nav">
        <button type="button" className="btn btn--quiet" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
          Back
        </button>
      </div>
    </section>
  );
}
