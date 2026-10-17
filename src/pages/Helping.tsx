import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { useDocumentTitle } from '../lib/useDocumentTitle';

/** For parents, counselors, pastors and mentors: how Called works and how to help. */
export default function Helping() {
  useDocumentTitle('Helping someone');
  return (
    <div className="wrap wrap--narrow helping">
      <PageHeader title="Helping someone find their way" lead="For parents, counselors, teachers, pastors and mentors. Called helps a person gather evidence about who they are and what work is really like. You can help most by asking good questions, not by giving answers." />

      <section className="section section--tight" aria-labelledby="what-h">
        <h2 id="what-h" className="h3">What Called does, in two minutes</h2>
        <ul className="guide-points">
          <li>
            <strong>Four starting points.</strong> Discover gifts and purpose, find careers that fit, look up one career, or decide between options. People who are already working get credit for their job, pay, education and skills.
          </li>
          <li>
            <strong>Evidence, not verdicts.</strong> Matches show their reasons and their tensions. Reality checks, short simulations and real conversations come before any decision.
          </li>
          <li>
            <strong>Built on Christian principles.</strong> Stewardship, service and wisdom shape it. It never presents a career as a message from God, and the faith reflections can be turned off.
          </li>
          <li>
            <strong>Private by default.</strong> No account is required. Everything stays in the person’s browser unless they choose to share it.
          </li>
        </ul>
      </section>

      <section className="section section--tight" aria-labelledby="ask-h">
        <h2 id="ask-h" className="h3">Questions that help</h2>
        <ul className="guide-steps">
          <li>What surprised you about yourself?</li>
          <li>Which career sounded good until you read the reality check?</li>
          <li>What did you enjoy in the simulation, and what drained you?</li>
          <li>Who could you talk to who does this work? Can I help you reach them?</li>
          <li>What is one small thing you could try in the next month?</li>
        </ul>
      </section>

      <section className="grid grid--2" aria-label="Ways to help">
        <article className="card stack">
          <h2 className="h4">See what they choose to share</h2>
          <p className="small">They can print or send a Called report, or share a limited report to your counselor account. Reports never include journals or private answers.</p>
          <Link to="/counselor" className="btn btn--secondary">
            Counselor accounts <Icon name="arrowRight" size={16} />
          </Link>
        </article>
        <article className="card stack">
          <h2 className="h4">Try it yourself first</h2>
          <p className="small">Ten minutes on your own is the best way to know how to guide someone through it.</p>
          <Link to="/" className="btn btn--secondary">
            Choose a starting point <Icon name="arrowRight" size={16} />
          </Link>
        </article>
      </section>
      <p className="small muted" style={{ marginTop: 'var(--s-5)' }}>
        More detail: <Link to="/about">How Called works</Link> · <Link to="/research">Research and trust</Link> · <Link to="/data">Privacy and data</Link>
      </p>
    </div>
  );
}
