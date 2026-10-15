import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Callout, PageHeader } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { CAREER_BY_ID } from '../../data/careers';
import { aiRolePlayPrompt, practiceQuestions } from '../../lib/interviewPractice';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import NotFound from '../NotFound';

export default function InterviewPractice() {
  const { id = '' } = useParams();
  const career = CAREER_BY_ID[id];
  useDocumentTitle(career ? `Practice a ${career.title} interview` : 'Interview practice');
  const [copied, setCopied] = useState(false);
  if (!career) return <NotFound />;
  const questions = practiceQuestions(career);
  const prompt = aiRolePlayPrompt(career);

  return (
    <div className="wrap wrap--narrow interview-practice">
      <PageHeader title={`Practice an interview about ${career.title}`} lead="Rehearse better questions before you talk with a real person. Practice is preparation—not real-world evidence.">
        <Link to={`/careers/${career.id}`} className="btn btn--secondary"><Icon name="arrowLeft" size={17} /> Career</Link>
      </PageHeader>
      <Callout tone="info" title="Practice does not affect your matches">Nothing on this page changes a Called score. A real conversation only becomes evidence when you deliberately log what you learned in Local Connections.</Callout>
      <section className="card stack" aria-labelledby="questions-h">
        <h2 id="questions-h" className="h3">Questions worth practicing</h2>
        <ol className="practice-questions">{questions.map((question) => <li key={question}>{question}</li>)}</ol>
        <Link to={`/network?career=${career.id}`} className="btn btn--primary">Find and log a real conversation</Link>
      </section>
      <section className="card stack" aria-labelledby="ai-practice-h">
        <h2 id="ai-practice-h" className="h3">Optional AI role-play</h2>
        <p>Copy this into an assistant you choose. It tells the assistant to act as a transparent simulator, challenge assumptions, and never pretend it has a real career history.</p>
        <textarea className="textarea ai-export__prompt" readOnly value={prompt} rows={14} aria-label="AI interview-practice prompt" />
        <div><button type="button" className="btn btn--secondary" onClick={async () => { await navigator.clipboard.writeText(prompt); setCopied(true); }}><Icon name="copy" size={17} /> Copy practice prompt</button></div>
        {copied && <p className="small" role="status">Practice prompt copied.</p>}
      </section>
    </div>
  );
}

