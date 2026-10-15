import { Link } from 'react-router-dom';
import detail from '../data/careers/overrides/ai-impact.json';
import { AI_BANDS, AI_FAMILY_GUIDANCE, AI_SOURCE, aiBand, type AiBand } from '../lib/ai';
import type { Career } from '../types';
import type { AiWorkGuide } from '../data/ai-work';

interface AiDetail {
  exposure: number;
  exposedShare: number;
  autoShare: number;
  tasksRated: number;
  speed: string[];
  human: string[];
  approximate?: boolean;
  basedOn?: string[];
}

const DETAIL = (detail as { careers: Record<string, AiDetail> }).careers;
const ORDER: AiBand[] = ['low', 'moderate', 'high'];

/** “How AI is changing this work” on every career page. */
export function AiImpact({ career, guide }: { career: Career; guide: AiWorkGuide }) {
  const d = DETAIL[career.id];
  if (!d) return null;
  const band = aiBand(d.exposure);
  const tenths = Math.round(d.exposedShare * 10);
  const handsOn = career.physical >= 2 || career.family === 'trades';

  return (
    <section aria-labelledby="ai-h" className="ai-work">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Evidence-informed · reviewed {guide.reviewed}</span>
          <h2 id="ai-h">How AI is changing this work</h2>
        </div>
      </div>
      <div className="card ai-card">
        <div className="ai-head">
          <div>
            <span className={`ai-band ai-band--${band}`}>{AI_BANDS[band].label}</span>
            <p className="ai-head__line">
              {tenths === 0
                ? 'Almost none of this job’s core tasks could be done much faster with AI tools.'
                : `About ${tenths} in 10 of this job’s core tasks could be done noticeably faster with AI tools.`}{' '}
              {d.exposedShare > 0 &&
                (d.autoShare >= 0.4
                  ? 'For some of them, AI could do much of the work itself, so the role may shift toward checking, judgment and people.'
                  : 'Mostly as an assistant: people still do the work, and AI helps them do it faster.')}
            </p>
          </div>
          <div className="ai-scale" role="img" aria-label={`Exposure to AI: ${AI_BANDS[band].short}, on a scale of low, moderate and high`}>
            {ORDER.map((b) => (
              <span key={b} className={`ai-scale__seg${b === band ? ' is-on' : ''}${ORDER.indexOf(b) <= ORDER.indexOf(band) ? ' is-filled' : ''}`}>
                {AI_BANDS[b].short}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid--2 ai-tasks">
          <div>
            <h3 className="h4">Tasks AI tools could speed up</h3>
            {d.speed.length ? (
              <ul className="ai-list ai-list--speed">
                {d.speed.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : (
              <p className="small muted">Researchers found almost none of this job’s tasks could be sped up much by AI tools.</p>
            )}
          </div>
          <div>
            <h3 className="h4">Tasks that stay human</h3>
            {d.human.length ? (
              <ul className="ai-list ai-list--human">
                {d.human.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : (
              <p className="small muted">Almost every task in this job could be sped up by AI tools. What stays human is judgment: deciding what to trust, owning the result and working with people.</p>
            )}
          </div>
        </div>

        <div className="ai-meaning">
          <h3 className="h4">What this means for you</h3>
          <p>{AI_BANDS[band].meaning}</p>
          <p>{AI_FAMILY_GUIDANCE[career.family]}</p>
        </div>

        <div className="grid grid--2 ai-tasks">
          <div>
            <h3 className="h4">Skills that hold up</h3>
            <div className="chips chips--static">
              {guide.durableSkills.map((item) => (
                <span className="tag" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="h4">How to prepare</h3>
            <ul className="ai-list">
              {guide.actions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="row">
          <Link to={`/careers/${career.id}/interview`} className="btn btn--secondary">
            Practice an informational interview
          </Link>
          <Link to="/research#ai-work" className="btn btn--quiet">
            Method and sources
          </Link>
        </div>

        <p className="small muted ai-source">
          <strong>Task exposure is not a job forecast.</strong> Based on {d.tasksRated} official task descriptions for this occupation, rated in{' '}
          <a href={AI_SOURCE.url} target="_blank" rel="noreferrer">
            {AI_SOURCE.short}
          </a>
          . Ratings describe what AI language tools could speed up, not whether jobs will disappear, and they don’t cover robots{handsOn ? ', which matter more for hands-on work' : ''}. AI is moving fast; treat this as a direction, not a forecast. This section doesn’t affect your match score.
          {d.approximate && d.basedOn && ` This career spans several official occupations, so these figures combine ${d.basedOn.slice(0, 3).join(', ')}${d.basedOn.length > 3 ? ' and others' : ''}.`}
        </p>
      </div>
    </section>
  );
}
