import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Callout, PageHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { createAiPrompt, createPrivateEvidenceSummary, type AiExportGoal } from '../lib/aiExport';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { useStore } from '../state/store';

const GOALS: Array<{ value: AiExportGoal; label: string }> = [
  { value: 'next-step', label: 'Choose my next experiment' },
  { value: 'compare', label: 'Compare active paths' },
  { value: 'contradictions', label: 'Challenge my assumptions' },
  { value: 'counselor', label: 'Prepare for a counselor meeting' },
];

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AiEvidenceExport() {
  useDocumentTitle('Take my evidence to an AI');
  const { profile } = useStore();
  const [goal, setGoal] = useState<AiExportGoal>('next-step');
  const [copied, setCopied] = useState(false);
  const prompt = useMemo(() => createAiPrompt(profile, goal), [profile, goal]);
  const structured = useMemo(() => JSON.stringify(createPrivateEvidenceSummary(profile), null, 2), [profile]);

  return (
    <div className="wrap wrap--narrow ai-export-page">
      <PageHeader title="Take my evidence to an AI" lead="Called can be the memory. Your assistant can help you think—but it should not replace your evidence or quietly change your scores.">
        <Link to="/account" className="btn btn--secondary"><Icon name="arrowLeft" size={17} /> Account</Link>
      </PageHeader>
      <Callout tone="evidence" title="Private by design">This export omits your name, location, member ID, journey code, journal, counselor records, and free-text responses. Review it before pasting it anywhere; another service’s privacy rules will apply after you share it.</Callout>
      <section className="card stack" aria-labelledby="export-goal-h">
        <h2 id="export-goal-h" className="h3">What do you want help with?</h2>
        <label className="field">Goal<select className="select" value={goal} onChange={(event) => setGoal(event.target.value as AiExportGoal)}>{GOALS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="field">Privacy-reduced prompt<textarea className="textarea ai-export__prompt" readOnly value={prompt} rows={18} /></label>
        <div className="row">
          <button type="button" className="btn btn--primary" onClick={async () => { await navigator.clipboard.writeText(prompt); setCopied(true); }}><Icon name="copy" size={17} /> Copy prompt</button>
          <button type="button" className="btn btn--secondary" onClick={() => download('called-ai-evidence-prompt.txt', prompt, 'text/plain')}><Icon name="download" size={17} /> Download prompt</button>
          <button type="button" className="btn btn--quiet" onClick={() => download('called-private-evidence.json', structured, 'application/json')}><Icon name="download" size={17} /> Download structured data</button>
        </div>
        {copied && <p className="small" role="status">Copied. Paste it into the assistant you choose.</p>}
      </section>
      <Callout tone="warn" title="Keep the boundary clear">AI output stays outside Called. Only assessments, reflections, conversations, simulations, experiments, and decisions you deliberately record can change your profile.</Callout>
    </div>
  );
}

