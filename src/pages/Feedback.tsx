import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { recordResearchEvent } from '../lib/researchParticipation';
import { Callout, OptionGroup, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function Feedback() {
  useDocumentTitle('Improve Called');
  const { settings } = useStore();
  const [ease, setEase] = useState<number>();
  const [trust, setTrust] = useState<number>();
  const [goal, setGoal] = useState('');
  const [confusing, setConfusing] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!ease || !trust) return;
    void recordResearchEvent(settings, 'usability_feedback', { path: window.location.pathname, ease, trust, goal: goal.trim().slice(0, 500), confusing: confusing.trim().slice(0, 500) });
    setSent(true);
  };

  return (
    <div className="wrap wrap--narrow">
      <PageHeader title="Help improve Called" lead="A short usability check helps us make the journey clearer and more trustworthy." />
      {!settings.researchParticipation ? (
        <Callout tone="warn" title="Research sharing is off">Turn on voluntary research participation in <Link to="/data#research">Your data</Link> before submitting. You can still use every part of Called without it.</Callout>
      ) : sent ? (
        <Callout tone="evidence" title="Feedback sent">Thank you. No name, journey code, journal entry, or contact information was attached.</Callout>
      ) : (
        <div className="card stack-lg">
          <p className="small muted">Please do not include names, contact information, or anything you would not want included in a de-identified research dataset.</p>
          <OptionGroup legend="How easy was it to find what you needed?" layout="row" value={ease} onChange={setEase} options={[1, 2, 3, 4, 5].map((value) => ({ value, label: String(value) }))} />
          <OptionGroup legend="How much do you trust what Called shows you?" layout="row" value={trust} onChange={setTrust} options={[1, 2, 3, 4, 5].map((value) => ({ value, label: String(value) }))} />
          <label className="field">What were you trying to do?<textarea className="textarea" value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={500} /></label>
          <label className="field">What felt confusing or incomplete?<textarea className="textarea" value={confusing} onChange={(event) => setConfusing(event.target.value)} maxLength={500} /></label>
          <button type="button" className="btn btn--primary" disabled={!ease || !trust} onClick={submit}>Send anonymous feedback</button>
        </div>
      )}
    </div>
  );
}
