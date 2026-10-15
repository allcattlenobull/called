import { Link } from 'react-router-dom';
import { ASSESSMENTS } from '../../data/assessments';
import { useStore } from '../../state/store';
import { PageHeader, Progress } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { computeCompass } from '../../lib/compass';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/format';

const DIM_FOR = { interests: 'interests', skills: 'skills', aptitudes: 'aptitudes', workStyle: 'workStyle', values: 'values', lifestyle: 'lifestyle' } as const;

export default function Discover() {
  useDocumentTitle('Discover');
  const { profile } = useStore();
  const dims = computeCompass(profile);
  const done = Object.keys(profile.completed).length;

  return (
    <div className="wrap">
      <PageHeader title="Discover yourself" lead="Six short assessments build the self and life sides of your Purpose Compass. Take them in any order, skip what you like, and retake them as you change." />
      <div className="discover-progress">
        <Progress value={done} max={ASSESSMENTS.length} label="Assessments completed" />
      </div>
      <div className="assess-grid">
        {ASSESSMENTS.map((a) => {
          const completed = profile.completed[a.id];
          const dim = dims.find((d) => d.id === DIM_FOR[a.id]);
          return (
            <article key={a.id} className={`assess-card fam-${a.group}`}>
              <div className="assess-card__top">
                <span className="assess-card__swatch" aria-hidden="true" />
                {completed ? (
                  <span className="tag tag--done">
                    <Icon name="check" size={14} /> Done {formatDate(completed)}
                  </span>
                ) : (
                  <span className="tag">
                    <Icon name="clock" size={14} /> {a.minutes} min
                  </span>
                )}
              </div>
              <h2 className="assess-card__title">
                <Link to={`/discover/${a.id}`} className="stretched">
                  {a.title}
                </Link>
              </h2>
              <p className="assess-card__q">{a.question}</p>
              <p className="muted small">{completed && dim && dim.evidence > 0 ? dim.summary : a.blurb}</p>
              <span className="assess-card__go">
                {completed ? 'Review or retake' : 'Start'} <Icon name="arrowRight" size={16} />
              </span>
            </article>
          );
        })}
      </div>
      <div className="callout" style={{ marginTop: 'var(--s-6)' }}>
        <Icon name="info" size={20} />
        <div>
          <strong className="callout__title">These aren’t tests of your worth</strong>
          They’re a starting point. Called weighs what you actually do in simulations and experiments more heavily over time, because experience is better evidence than self-description.
        </div>
      </div>
    </div>
  );
}
