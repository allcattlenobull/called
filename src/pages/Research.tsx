import { Link } from 'react-router-dom';
import { Callout, PageHeader } from '../components/ui';
import { RESEARCH_AUDIT, RESEARCH_SOURCES, researchSourceById, type ResearchStatus } from '../data/research';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const STATUS_TONE: Record<ResearchStatus, string> = {
  'Evidence-backed construct': 'tag--done',
  'Evidence-informed method': 'tag--purpose',
  'Descriptive source': 'tag--primary',
  'Called-specific evidence missing': 'tag--warn',
};

export default function Research() {
  useDocumentTitle('Research and trust');

  return (
    <div className="wrap wrap--narrow research-page">
      <PageHeader title="Research and trust" lead="Called should earn trust by showing its work. This page maps every major component to the research it can honestly claim, the evidence it still lacks, and what we will change next." />

      <Callout tone="evidence" title="The honest headline">
        Peer-reviewed research supports some constructs and design patterns used here. It does not validate Called as a whole, and it does not turn a custom quiz into a psychological test. Called’s current scores are transparent decision-support signals, not diagnoses, predictions, or guarantees.
      </Callout>

      <section className="prose" aria-labelledby="standard-h">
        <h2 id="standard-h">Our evidence standard</h2>
        <p>We use “high efficacy” narrowly. A method must match the intended construct and outcome, have peer-reviewed evidence, and be administered and scored the way the research studied it. A paper about validated interest inventories does not validate Called’s custom interest prompts. A paper about situational-judgment tests does not validate an untested scenario score.</p>
        <div className="research-principles">
          <div className="research-principle"><strong>Construct validity</strong><span>Are we measuring the thing we name?</span></div>
          <div className="research-principle"><strong>Reliability</strong><span>Would the signal be reasonably stable and precise?</span></div>
          <div className="research-principle"><strong>Criterion validity</strong><span>Does it relate to the outcome we say it helps with?</span></div>
          <div className="research-principle"><strong>Fairness and limits</strong><span>For whom does it work, and where should it not be used?</span></div>
        </div>
      </section>

      <section className="research-summary" aria-labelledby="summary-h">
        <h2 id="summary-h">What the audit changed</h2>
        <div className="grid grid--2">
          <div className="card research-summary__card"><span className="tag tag--done">Kept</span><h3 className="h3">Evidence gathering</h3><p>Interests, values, real-world conversations, experiments, reality checks, local data, and transparent explanations are useful inputs when presented as clues and tradeoffs.</p></div>
          <div className="card research-summary__card"><span className="tag tag--warn">Downgraded</span><h3 className="h3">Custom aptitude score</h3><p>Called no longer uses the fifteen custom puzzles to rank careers. They remain optional practice prompts until a normed, validated replacement is available.</p></div>
          <div className="card research-summary__card"><span className="tag tag--warn">Downgraded</span><h3 className="h3">Simulation percentage</h3><p>The “professional approach” percentage is removed from decision support. Simulations now contribute exposure and reflection only; a scored version would require formal SJT or work-sample validation.</p></div>
          <div className="card research-summary__card"><span className="tag tag--purpose">Still in progress</span><h3 className="h3">Product efficacy</h3><p>Called has not run a controlled study of its full journey. We will not imply that the app causes better choices until that evidence exists.</p></div>
        </div>
      </section>

      <section className="research-audit" aria-labelledby="audit-h">
        <div className="section-heading"><div><span className="eyebrow">Component by component</span><h2 id="audit-h">The full audit</h2></div><span className="small muted">{RESEARCH_AUDIT.length} areas reviewed</span></div>
        <div className="research-audit__list">
          {RESEARCH_AUDIT.map((item) => (
            <article className="card research-card" key={item.id}>
              <div className="row row--between research-card__head"><h3 className="h3">{item.area}</h3><span className={['tag', STATUS_TONE[item.status]].join(' ')}>{item.status}</span></div>
              <dl className="research-card__facts">
                <div><dt>What Called does</dt><dd>{item.current}</dd></div>
                <div><dt>What the literature supports</dt><dd>{item.evidence}</dd></div>
                <div><dt>What we cannot claim</dt><dd>{item.limit}</dd></div>
                <div><dt>Higher-evidence next step</dt><dd>{item.next}</dd></div>
              </dl>
              <div className="research-card__sources"><span className="small muted">Relevant literature</span><div className="chips chips--static">{item.sources.map((id) => <a className="tag tag--source" key={id} href={researchSourceById[id].url} target="_blank" rel="noreferrer">{researchSourceById[id].authors.split(' ')[0]} {researchSourceById[id].year}</a>)}</div></div>
            </article>
          ))}
        </div>
      </section>

      <section className="prose" aria-labelledby="replacement-h">
        <h2 id="replacement-h">What a true replacement requires</h2>
        <p>We will not copy a proprietary instrument or borrow a research label without its method. For any component that becomes a formal assessment, the replacement plan is: define the construct and intended outcome; use a documented instrument or create an item bank with expert content review; pilot it; test internal structure and appropriate reliability; check relationships with relevant outcomes; examine subgroup fairness and measurement invariance; publish the scoring and uncertainty; then validate the exact Called workflow.</p>
        <p>Until then, Called will use the safer label: <strong>evidence to explore</strong>. The app can help someone ask a better question or choose a next experiment; it cannot certify a career choice.</p>
        <Callout tone="info" title="For counselors, parents, and educators">Use Called as a conversation and exploration aid. Pair it with a qualified counselor, current local information, and real exposure to the work. Never use Called’s custom signals for admissions, employment selection, diagnosis, or high-stakes placement.</Callout>
        <p><Link to="/about">Read how Called works today</Link> or <Link to="/data">review your privacy and data controls</Link>.</p>
      </section>

      <section className="research-sources" aria-labelledby="sources-h">
        <div className="section-heading"><div><span className="eyebrow">Peer-reviewed sources</span><h2 id="sources-h">The literature behind the audit</h2></div><span className="small muted">{RESEARCH_SOURCES.length} sources</span></div>
        <div className="research-sources__list">
          {RESEARCH_SOURCES.map((source) => (
            <article className="research-source" key={source.id}>
              <div className="row row--between"><h3 className="h4"><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></h3><span className="small muted">{source.year}</span></div>
              <p className="small muted">{source.authors} · {source.venue}</p>
              <p><strong>Method:</strong> {source.method}</p>
              <p><strong>Why it matters here:</strong> {source.relevance}</p>
            </article>
          ))}
        </div>
        <p className="small muted research-note">This is a focused evidence audit of the methods currently in the repository, not a claim of an exhaustive systematic review of all career-development research. Sources were selected for direct relevance to the constructs and methods used here.</p>
      </section>
    </div>
  );
}
