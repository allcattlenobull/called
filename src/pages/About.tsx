import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageHeader, Callout } from '../components/ui';
import { DIMENSIONS } from '../lib/matching';
import { CAREERS, DATA_SOURCES } from '../data/careers';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const EXPLAIN: Record<string, string> = {
  interest: 'How strongly you responded to the kinds of activities this work centers on, blended with how much those interests stand out for you. Enjoyed experiences, simulations and experiments nudge it.',
  skills: 'Your self-rated skill levels for the skills this work uses most. Missing skills lower it, but skills can be learned, so it carries less weight.',
  aptitude: 'Reserved for a future validated measure. The current practice puzzles and OMIB pilot do not affect career ranking.',
  values: 'Whether this career tends to support or strain the values you ranked essential and important.',
  lifestyle: 'How the schedule, remote options, physical demands, travel, stress, business potential, income stability and location fit what you said you want, plus your work-style preferences.',
  purpose: 'Overlap between your gifts (including what others notice), who you want to serve and the problems you care about, and the same things for this career.',
  education: 'Whether typical training time fits how long you’re willing to train. Paid apprenticeships soften the penalty for longer training.',
  financial: 'Whether median pay meets your income goal, and whether typical tuition fits your comfort with debt.',
};

export default function About() {
  useDocumentTitle('About');
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <div className="wrap wrap--narrow about">
      <PageHeader title="About Called" lead="We are not trying to tell anyone what they should become. We are helping them become wise enough to choose." />

      <Callout tone="evidence" title="Want the evidence behind this?">
        Read the <Link to="/research">research and trust audit</Link> for a component-by-component account of what is supported, what is still unvalidated, and what Called is changing.
      </Callout>

      <section className="prose">
        <h2>What Called is</h2>
        <p>
          Called is a free, private place to understand who you are, explore what work is really like, try it, reflect on it, and build a path. It works whether you’re in high school, in college, starting out, or years into a career and thinking about a change. It gets more useful the longer you use it.
        </p>
        <p>The journey moves through discover, purpose, explore, experience, reflect, compare, plan, act and reassess. You can start anywhere, skip anything and come back anytime.</p>

        <h2>The heart of it</h2>
        <p>
          Most career tools try to answer “What should I be?” Called is built around a better question: <strong>what should I explore next?</strong> Evidence, exploration, reflection, wisdom and action, repeated, lead to better choices than any single quiz.
        </p>

        <h2>Built on Christian principles</h2>
        <p>
          Called draws on stewardship, service, wisdom, diligence, gifts, good work, calling and purpose. Those ideas shape how it asks questions and how it weighs evidence. It never presents a career recommendation as a message from God. Instead, it helps you weigh your gifts, opportunities, interests, abilities, responsibilities, circumstances, counsel and service to others. Your career can be one way you live out your purpose; it isn’t your purpose.
        </p>
        <p>
          <Link to="/purpose/principles">Read the principles and the Scripture behind them</Link>. Faith reflections can be turned off in <Link to="/data">settings</Link> for classrooms or anyone who prefers.
        </p>

        <h2 id="how-matching-works">How matching works</h2>
        <p>
          Every career can receive seven current decision-support scores from 0 to 100. A component stays empty until you’ve given Called evidence for it. Aptitude is deliberately excluded until an exact instrument is validated for this use. The overall score is a weighted average of the components that exist, then adjusted by your experience: simulation reflections, reality checks, purpose experiments and how you’ve marked careers. Experience is capped at plus 20 or minus 30 so one reaction can’t overwhelm everything else.
        </p>
        <div className="table-wrap">
          <table className="table">
            <caption className="visually-hidden">Matching dimensions and weights</caption>
            <thead>
              <tr>
                <th scope="col">Dimension</th>
                <th scope="col" className="num">
                  Weight
                </th>
                <th scope="col">What it measures</th>
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map((d) => (
                <tr key={d.id}>
                  <th scope="row">{d.label}</th>
                  <td className="num">{d.weight}</td>
                  <td>{EXPLAIN[d.id]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Every recommendation shows the reasons it appeared and any <strong>potential conflicts</strong> with what you said matters to you. Evidence labels tell you how much to trust a score: <em>Early signal</em> (fewer than three dimensions), <em>Growing evidence</em> (three to five), and <em>Solid evidence</em> (six or more plus real experience).
        </p>
        <Callout title="What the score is not">
          The scoring is a transparent set of rules written by people, not a validated psychological instrument or a prediction. It organizes your evidence so you can think clearly. Treat it as “here’s what the evidence suggests,” and test it.
        </Callout>

        <h2 id="sources">Data sources</h2>
        <p>
          Called includes {CAREERS.length} careers, chosen to cover healthcare, technology, business, finance, education, skilled trades, government, creative work, human services, engineering, science, entrepreneurship, operations, legal and public safety, and every level of training from none to doctoral.
        </p>
        <ul>
          <li>
            <strong>Pay:</strong> {DATA_SOURCES.wages}. Rounded figures, {DATA_SOURCES.wagesAsOf}. Low and high are roughly the 10th and 90th percentiles.
          </li>
          <li>
            <strong>Outlook:</strong> {DATA_SOURCES.outlook}, shown as categories rather than exact percentages.
          </li>
          <li>
            <strong>Tasks, reality checks and day-in-the-life:</strong> {DATA_SOURCES.tasks}.
          </li>
          <li>
            <strong>Tuition:</strong> College Board, Trends in College Pricing, published tuition and fees before aid.
          </li>
        </ul>
        <p>
          Each career links to its <a href="https://www.onetonline.org/" target="_blank" rel="noreferrer">O*NET OnLine</a> and <a href="https://www.bls.gov/ooh/" target="_blank" rel="noreferrer">BLS</a> pages. O*NET is a trademark of the U.S. Department of Labor, Employment and Training Administration. Called is not affiliated with or endorsed by any government agency. Pay and outlook vary by place and change over time, so check the source before making a decision.
        </p>

        <h2>Privacy</h2>
        <p>
          Called has no accounts. Your profile, journal and results are stored in your browser on this device, and every journey has its own journey code. If cross-device restore is turned on, an encrypted copy is saved under a scrambled version of your code; it is locked with your code before it leaves your browser. Research events and minimal page analytics are separate, de-identified, and off until you explicitly opt in. Fonts are bundled with the app and there are no advertising scripts. You can <Link to="/data">export, import, switch, withdraw research consent, or delete data</Link> at any time.
        </p>

        <h2>For parents, counselors, teachers and mentors</h2>
        <p>
          Anyone using Called can share a <Link to="/path/report">Called report</Link> they choose the contents of. The most helpful thing you can do is ask good questions about it: What surprised you? What would you like to try? Who could you talk to? Then help them find real experiences: a job shadow, a volunteer shift, an interview with someone in the field.
        </p>
      </section>
    </div>
  );
}
