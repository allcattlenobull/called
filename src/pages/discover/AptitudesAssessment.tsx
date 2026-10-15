import { useMemo } from 'react';
import { useDraft } from '../../state/useDraft';
import { APTITUDE_ITEMS, type Grid } from '../../data/assessments';
import { APTITUDES } from '../../data/vocab';
import { useStore } from '../../state/store';
import type { AptitudeId } from '../../types';
import { Callout } from '../../components/ui';
import { NextAssessment } from './Assessment';

const rotateCW = (g: Grid): Grid => g[0].map((_, c) => g.map((row) => row[c]).reverse());
const mirror = (g: Grid): Grid => g.map((row) => [...row].reverse());

function Shape({ grid, label }: { grid: Grid; label: string }) {
  return (
    <span className="shape" role="img" aria-label={label}>
      {grid.flat().map((v, i) => (
        <span key={i} className={v ? 'on' : ''} />
      ))}
    </span>
  );
}

const describe = (g: Grid) =>
  'Filled cells: ' +
  g
    .flatMap((row, r) => row.map((v, c) => (v ? `row ${r + 1} column ${c + 1}` : '')))
    .filter(Boolean)
    .join(', ');

/** Spatial options are generated: correct rotation, counter-rotation, mirror, half turn, in a stable shuffled order. */
function spatialOptions(g: Grid, seed: number) {
  const cw = rotateCW(g);
  const ccw = rotateCW(rotateCW(cw));
  const half = rotateCW(cw);
  const opts = [
    { grid: cw, correct: true },
    { grid: mirror(cw), correct: false },
    { grid: ccw, correct: false },
    { grid: half, correct: false },
  ];
  const order = [[2, 0, 3, 1], [1, 3, 0, 2], [3, 1, 0, 2]][seed % 3];
  return order.map((i) => opts[i]);
}

export function AptitudesAssessment() {
  const { profile, update } = useStore();
  // Progress is saved as a draft so a half-finished set of puzzles survives closing the tab.
  const [state, setState, clearState, resumed] = useDraft<{ idx: number; picked: number | null; session: Record<string, boolean> }>('aptitudes', () => ({
    idx: profile.completed.aptitudes ? APTITUDE_ITEMS.length : 0,
    picked: null,
    session: {},
  }));
  const { idx, picked, session } = state;
  const done = idx >= APTITUDE_ITEMS.length;
  const item = APTITUDE_ITEMS[idx];
  const spatial = useMemo(() => (item?.grid ? spatialOptions(item.grid, idx) : null), [item, idx]);

  const choose = (i: number) => {
    if (picked !== null) return;
    const correct = spatial ? spatial[i].correct : i === item.answer;
    const next = { ...session, [item.id]: correct };
    setState((s) => ({ ...s, picked: i, session: next }));
    if (idx === APTITUDE_ITEMS.length - 1) {
      update((p) => {
        const totals: Partial<Record<AptitudeId, { correct: number; total: number }>> = {};
        for (const it of APTITUDE_ITEMS) {
          if (next[it.id] === undefined) continue;
          const t = (totals[it.aptitude] ??= { correct: 0, total: 0 });
          t.total += 1;
          if (next[it.id]) t.correct += 1;
        }
        p.aptitudes = totals;
        p.completed.aptitudes = new Date().toISOString();
        delete p.drafts.aptitudes;
      });
    }
  };

  if (done) {
    const results = profile.aptitudes;
    return (
      <section className="runner">
        <h2>Your early signals</h2>
        <p>Fifteen puzzles are a small sample. Treat these as hints worth testing, not verdicts. Aptitudes also grow with practice.</p>
        <ul className="matchbars" style={{ maxWidth: 560 }}>
          {(Object.keys(APTITUDES) as AptitudeId[]).map((a) => {
            const r = results[a];
            return (
              <li key={a} className="matchbar fam-self">
                <div className="matchbar__top">
                  <span className="matchbar__label">{APTITUDES[a].label}</span>
                  <span className="matchbar__value">{r ? `${r.correct} of ${r.total}` : 'Not tried'}</span>
                </div>
                <div className={`matchbar__track${r ? '' : ' is-empty'}`} aria-hidden="true">
                  {r && <span style={{ width: `${(r.correct / r.total) * 100}%` }} />}
                </div>
                <span className="small muted">{APTITUDES[a].blurb}</span>
              </li>
            );
          })}
        </ul>
        <div className="row" style={{ marginTop: 'var(--s-4)' }}>
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => setState({ idx: 0, picked: null, session: {} })}
          >
            Retake the puzzles
          </button>
        </div>
        <NextAssessment current="aptitudes" />
      </section>
    );
  }

  const answeredCorrect = picked !== null && (spatial ? spatial[picked].correct : picked === item.answer);

  return (
    <section className="runner">
      {resumed && idx > 0 && idx < APTITUDE_ITEMS.length && (
        <Callout tone="evidence" title="Welcome back">
          Your answers were saved. You’re on puzzle {idx + 1}.
        </Callout>
      )}
      {idx === 0 && picked === null && (
        <Callout title="No timer, no pressure">These puzzles check five kinds of thinking. You’ll see the reasoning after each one.</Callout>
      )}
      <p className="runner__count" style={{ marginTop: 'var(--s-4)' }}>
        Puzzle {idx + 1} of {APTITUDE_ITEMS.length}: {APTITUDES[item.aptitude].label.toLowerCase()}
      </p>
      <div className="progress__track" aria-hidden="true" style={{ marginBottom: 'var(--s-5)' }}>
        <span style={{ width: `${(idx / APTITUDE_ITEMS.length) * 100}%` }} />
      </div>
      <div className="runner__step" key={item.id}>
        <h2 className="question">{item.prompt}</h2>
        {item.compare && (
          <div className="compare-strings" aria-label="Two items to compare">
            <span>A: {item.compare[0]}</span>
            <span>B: {item.compare[1]}</span>
          </div>
        )}
        {item.grid && (
          <div className="puzzle-shape">
            <Shape grid={item.grid} label={`Original shape. ${describe(item.grid)}`} />
          </div>
        )}
        <div className={`puzzle-options${spatial ? ' puzzle-options--shapes' : ''}`} role="group" aria-label="Choose an answer">
          {(spatial ?? item.options.map((o) => ({ label: o }))).map((o, i) => {
            const isCorrect = spatial ? spatial[i].correct : i === item.answer;
            const state = picked === null ? '' : isCorrect ? ' is-correct' : picked === i ? ' is-wrong' : '';
            return (
              <button key={i} type="button" className={`answer${state}`} onClick={() => choose(i)} aria-disabled={picked !== null}>
                {'grid' in o ? <Shape grid={o.grid as Grid} label={`Option ${i + 1}. ${describe(o.grid as Grid)}`} /> : (o as { label: string }).label}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className={`feedback${answeredCorrect ? '' : ' feedback--weak'}`} role="status">
            <strong>{answeredCorrect ? 'Correct. ' : 'Not quite. '}</strong>
            {item.explain}
          </div>
        )}
      </div>
      <div className="runner__nav">
        <span />
        <button
          type="button"
          className="btn btn--primary"
          disabled={picked === null}
          onClick={() => {
            const last = idx === APTITUDE_ITEMS.length - 1;
            setState((s) => ({ ...s, idx: s.idx + 1, picked: null }));
            if (last) clearState();
          }}
        >
          {idx === APTITUDE_ITEMS.length - 1 ? 'See my results' : 'Next puzzle'}
        </button>
      </div>
    </section>
  );
}
