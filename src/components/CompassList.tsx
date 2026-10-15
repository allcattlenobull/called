import { Link } from 'react-router-dom';
import type { CompassDim } from '../lib/compass';

const EVIDENCE_WORD = (e: number) => (e === 0 ? 'Not yet' : e < 0.4 ? 'Early' : e < 0.8 ? 'Growing' : 'Solid');

export function CompassList({ dims, compact }: { dims: CompassDim[]; compact?: boolean }) {
  return (
    <ul className={`compass-list${compact ? ' compass-list--compact' : ''}`}>
      {dims.map((d) => (
        <li key={d.id}>
          <Link to={d.href} className={`compass-item fam-${d.family}`}>
            <span className={`compass-item__swatch${d.evidence === 0 ? ' is-empty' : ''}`} aria-hidden="true" />
            <span>
              <span className="compass-item__name">{d.label}</span>
              {!compact && <span className="compass-item__summary">{d.evidence === 0 ? d.question : d.summary}</span>}
            </span>
            <span className="compass-item__evidence">{EVIDENCE_WORD(d.evidence)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
