import { useDraft } from '../../state/useDraft';
import { useStore } from '../../state/store';
import { Callout, PageHeader } from '../../components/ui';
import { OMIB_PILOT_ITEMS, type OmibPilotItem } from '../../data/assessments/omibPilot';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

const CORNERS = ['12,12 38,12 12,38', '88,88 62,88 88,62', '88,62 88,88 62,88', '62,12 88,12 88,38'];
const LINES = ['18,50 50,18', '18,50 50,82', '50,82 82,50', '50,18 82,50'];
const BOXES = ['38,2 62,2 62,14 38,14', '2,38 2,62 14,62 14,38', '38,86 62,86 62,98 38,98', '86,38 86,62 98,62 98,38'];
const ARROWS = ['50,14 36,28 64,28', '14,50 28,36 28,64', '50,86 36,72 64,72', '86,50 72,36 72,64'];

function Symbol({ index }: { index: number }) {
  if (index < 4) return <polygon points={CORNERS[index]} fill="currentColor" />;
  if (index < 8) return <polyline points={LINES[index - 4]} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />;
  if (index < 12) return <polygon points={BOXES[index - 8]} fill="none" stroke="currentColor" strokeWidth="4" />;
  if (index < 16) {
    const shape = index - 12;
    if (shape === 0) return <rect x="40" y="40" width="20" height="20" fill="currentColor" />;
    if (shape === 1) return <rect x="40" y="40" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="4" />;
    if (shape === 2) return <circle cx="50" cy="50" r="12" fill="currentColor" />;
    return <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="4" />;
  }
  return <polygon points={ARROWS[index - 16]} fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />;
}

function Cell({ code, empty = false, label }: { code: string; empty?: boolean; label: string }) {
  return (
    <div className="omib-cell" aria-label={label} role="img">
      {!empty && <svg viewBox="0 0 100 100" aria-hidden="true">{Array.from(code).map((bit, i) => bit === '1' && <Symbol key={i} index={i} />)}</svg>}
    </div>
  );
}

function Matrix({ item }: { item: OmibPilotItem }) {
  return (
    <div className="omib-matrix" role="img" aria-label="A three by three matrix with the last cell missing">
      {item.cells.map((code, i) => <Cell key={i} code={code} empty={i === 8} label={i === 8 ? 'Missing cell' : `Matrix cell ${i + 1}`} />)}
    </div>
  );
}

function Options({ selected, onToggle }: { selected: string; onToggle: (index: number) => void }) {
  return (
    <div className="omib-options" role="group" aria-label="Construction elements. Select the elements that belong in the missing cell.">
      {Array.from({ length: 20 }, (_, i) => {
        const active = selected[i] === '1';
        return (
          <button type="button" key={i} className={`omib-option${active ? ' is-selected' : ''}`} aria-pressed={active} onClick={() => onToggle(i)}>
            <svg viewBox="0 0 100 100" aria-hidden="true"><Symbol index={i} /></svg>
            <span className="visually-hidden">Element {i + 1}{active ? ', selected' : ''}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function ValidatedAptitudePilot() {
  useDocumentTitle('Reasoning pilot');
  const { profile, update } = useStore();
  const [state, setState, clearState, resumed] = useDraft<{ idx: number; selected: string; answers: Record<string, string> }>('omib-pilot', () => ({
    idx: profile.validatedReasoning ? OMIB_PILOT_ITEMS.length : 0,
    selected: '0'.repeat(20),
    answers: {},
  }));
  const item = OMIB_PILOT_ITEMS[state.idx];
  const done = state.idx >= OMIB_PILOT_ITEMS.length;

  const submit = () => {
    if (!item) return;
    const answers = { ...state.answers, [item.id]: state.selected };
    const last = state.idx === OMIB_PILOT_ITEMS.length - 1;
    if (last) {
      const correct = OMIB_PILOT_ITEMS.reduce((sum, candidate) => sum + (answers[candidate.id] === candidate.solution ? 1 : 0), 0);
      update((p) => {
        p.validatedReasoning = { instrument: 'OMIB-pilot', correct, total: OMIB_PILOT_ITEMS.length, completedAt: new Date().toISOString() };
      });
      setState({ idx: OMIB_PILOT_ITEMS.length, selected: '0'.repeat(20), answers });
      clearState();
    } else {
      setState({ idx: state.idx + 1, selected: '0'.repeat(20), answers });
    }
  };

  if (done) {
    const result = profile.validatedReasoning;
    return (
      <div className="wrap">
        <PageHeader title="Research-backed reasoning pilot" lead="A short, transparent pilot built from the Open Matrices Item Bank." back={{ to: '/discover/aptitudes', label: 'Aptitudes' }} />
        <section className="runner">
        <Callout tone="evidence" title="Pilot recorded">This is a short pilot built from released OMIB item-bank materials. It is not a normed IQ score, a diagnosis, or a career prediction.</Callout>
        <h2>Your reasoning pilot</h2>
        <p className="lead">{result ? `${result.correct} of ${result.total} items matched the published item solutions.` : 'No pilot result is recorded yet.'}</p>
        <p>We keep the career piece open: this result is available as an additional evidence point, while the matching model continues to show its sources and limits. A future change to ranking would require a preregistered score contract and outcome testing.</p>
        <div className="row" style={{ marginTop: 'var(--s-4)' }}>
          <Link className="btn btn--quiet" to="/research">Read the instrument decision</Link>
          <button type="button" className="btn btn--primary" onClick={() => setState({ idx: 0, selected: '0'.repeat(20), answers: {} })}>Retake pilot</button>
        </div>
        </section>
      </div>
    );
  }

  const selectedCount = Array.from(state.selected).filter((bit) => bit === '1').length;
  return (
    <div className="wrap">
      <PageHeader title="Research-backed reasoning pilot" lead="A short, transparent pilot built from the Open Matrices Item Bank." back={{ to: '/discover/aptitudes', label: 'Aptitudes' }} />
      <section className="runner">
      {resumed && state.idx > 0 && <Callout tone="evidence" title="Welcome back">Your pilot progress was saved locally. You are on item {state.idx + 1}.</Callout>}
      {state.idx === 0 && <Callout title="Research-backed pilot">These are the original OMIB construction elements and item codes. There is no timer, matching the published validation procedure. The pilot is for evidence gathering, not a verdict.</Callout>}
      <p className="runner__count">OMIB pilot item {state.idx + 1} of {OMIB_PILOT_ITEMS.length}</p>
      <div className="progress__track" aria-hidden="true" style={{ marginBottom: 'var(--s-5)' }}><span style={{ width: `${(state.idx / OMIB_PILOT_ITEMS.length) * 100}%` }} /></div>
      <div className="runner__step" key={item.id}>
        <h2 className="question">Complete the missing cell</h2>
        <Matrix item={item} />
        <p className="small muted">Select every construction element that belongs in the empty cell. Selected elements: {selectedCount}.</p>
        <Options selected={state.selected} onToggle={(index) => setState((s) => {
          const bits = s.selected.split('');
          bits[index] = bits[index] === '1' ? '0' : '1';
          return { ...s, selected: bits.join('') };
        })} />
      </div>
      <div className="runner__nav">
        <span />
        <button type="button" className="btn btn--primary" onClick={submit}>{state.idx === OMIB_PILOT_ITEMS.length - 1 ? 'Save pilot result' : 'Next item'}</button>
      </div>
      </section>
    </div>
  );
}
