import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { dueOutcomeCheckIns } from '../lib/outcomes';
import { SIM_BY_ID } from '../data/simulations';
import { uid } from '../lib/profile';
import { recordResearchEvent } from '../lib/researchParticipation';
import { Callout, OptionGroup, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import type { OutcomeCheckIn } from '../types';

export default function ResearchCheckIn() {
  useDocumentTitle('Experience check-in');
  const { profile, update, settings } = useStore();
  const due = useMemo(() => dueOutcomeCheckIns(profile), [profile]);
  const current = due[0];
  const [clarity, setClarity] = useState<number>();
  const [confidence, setConfidence] = useState<number>();
  const [action, setAction] = useState<OutcomeCheckIn['action']>();

  if (!current) {
    return (
      <div className="wrap wrap--narrow">
        <PageHeader title="You’re caught up" lead="There are no experience follow-ups due right now." />
        <Link className="btn btn--primary" to="/">Back to my journey</Link>
      </div>
    );
  }

  const simulation = SIM_BY_ID[current.simulation.simulationId];
  const save = () => {
    if (!clarity || !confidence || !action) return;
    const item: OutcomeCheckIn = { id: uid('outcome'), simulationId: current.simulation.simulationId, simulationRunId: current.simulation.runId ?? `legacy:${current.simulation.completedAt}`, window: current.window, clarity, confidence, action, completedAt: new Date().toISOString() };
    update((draft) => void draft.outcomeCheckIns.push(item));
    void recordResearchEvent(settings, 'follow_up', {
      simulationId: item.simulationId,
      simulationRunId: item.simulationRunId,
      instrumentVersion: current.simulation.instrumentVersion ?? 'legacy',
      window: item.window,
      clarity,
      confidence,
      action,
    });
    setClarity(undefined);
    setConfidence(undefined);
    setAction(undefined);
  };

  return (
    <div className="wrap wrap--narrow">
      <PageHeader title="A quick follow-up" lead={`It has been ${current.window.replace('d', ' days')} since “${simulation?.title ?? 'your simulation'}.” What happened afterward?`} back={{ to: '/', label: 'My journey' }} />
      <Callout>This personal check-in helps you notice whether an experience led to clearer decisions or useful action. It never changes your match score.</Callout>
      <div className="card stack-lg" style={{ marginTop: 'var(--s-5)' }}>
        <OptionGroup legend="How clear are you now about this career?" layout="row" value={clarity} onChange={setClarity} options={[1, 2, 3, 4, 5].map((value) => ({ value, label: String(value) }))} />
        <OptionGroup legend="How confident are you in your next step?" layout="row" value={confidence} onChange={setConfidence} options={[1, 2, 3, 4, 5].map((value) => ({ value, label: String(value) }))} />
        <OptionGroup legend="What have you done since then?" value={action} onChange={setAction} options={[
          { value: 'researched' as const, label: 'Researched the career' },
          { value: 'talked' as const, label: 'Talked with someone in the field' },
          { value: 'tried' as const, label: 'Tried another real-world activity' },
          { value: 'applied' as const, label: 'Applied for a class, role, or program' },
          { value: 'paused' as const, label: 'Chose to pause this path' },
          { value: 'none' as const, label: 'Nothing yet' },
        ]} />
        <button type="button" className="btn btn--primary" disabled={!clarity || !confidence || !action} onClick={save}>Save and continue</button>
      </div>
      {due.length > 1 && <p className="small muted">{due.length - 1} more follow-up{due.length > 2 ? 's' : ''} waiting after this one.</p>}
    </div>
  );
}
