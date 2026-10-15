import { Link } from 'react-router-dom';
import { EXPERIMENTS } from '../../data/purpose-experiments';
import { GIFTS } from '../../data/vocab';
import { useStore } from '../../state/store';
import { PageHeader } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export default function Experiments() {
  useDocumentTitle('Purpose experiments');
  const { profile } = useStore();
  return (
    <div className="wrap">
      <PageHeader
        title="Purpose experiments"
        lead="Small, real-world tests of a hunch about yourself. Pick one, do it this week, then come back and answer a few honest questions. The answers feed your Purpose Compass."
        back={{ to: '/try', label: 'Try It' }}
      />
      <div className="grid grid--3">
        {EXPERIMENTS.map((e) => {
          const log = profile.experiments.find((x) => x.experimentId === e.id);
          return (
            <article key={e.id} className="card card--link">
              <div className="row row--between">
                <span className="tag">
                  <Icon name="clock" size={14} /> {e.time}
                </span>
                {log && <span className={`tag ${log.status === 'done' ? 'tag--done' : 'tag--purpose'}`}>{log.status === 'done' ? 'Done' : 'In progress'}</span>}
              </div>
              <h2 className="h3" style={{ marginTop: 'var(--s-3)' }}>
                <Link to={`/try/experiments/${e.id}`} className="stretched">
                  {e.title}
                </Link>
              </h2>
              <p className="muted small">{e.hypothesis}</p>
              <p className="small">Tests: {e.gifts.map((g) => GIFTS[g].label.toLowerCase()).join(', ')}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
