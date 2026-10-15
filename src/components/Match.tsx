import { Link } from 'react-router-dom';
import { CONFIDENCE_LABEL, DIMENSIONS, type Confidence, type DimensionId, type MatchResult } from '../lib/matching';
import { Icon } from './Icon';

const FAMILY_CLASS = { self: 'fam-self', life: 'fam-life', purpose: 'fam-purpose' } as const;

const DIM_HREF: Record<DimensionId, string> = {
  interest: '/discover/interests',
  skills: '/discover/skills',
  aptitude: '/discover/aptitudes',
  values: '/discover/values',
  lifestyle: '/discover/lifestyle',
  purpose: '/purpose',
  education: '/discover/lifestyle',
  financial: '/discover/lifestyle',
};

/** Thin segmented strip: the eight match dimensions at a glance. Never a single opaque number. */
export function FitStrip({ match }: { match: MatchResult }) {
  const label = DIMENSIONS.map((d) => `${d.label} ${match.dimensions[d.id].score ?? 'unknown'}`).join(', ');
  return (
    <div className="fitstrip" role="img" aria-label={`Match by dimension: ${label}`}>
      {DIMENSIONS.map((d) => {
        const s = match.dimensions[d.id].score;
        return (
          <span key={d.id} className={`fitstrip__seg ${FAMILY_CLASS[d.family]}${s === null ? ' is-empty' : ''}`} title={`${d.label}: ${s ?? 'not enough evidence yet'}`}>
            {s !== null && <span className="fitstrip__fill" style={{ height: `${Math.max(12, s)}%` }} />}
          </span>
        );
      })}
    </div>
  );
}

export function EvidenceBadge({ confidence }: { confidence: Confidence }) {
  const dots = confidence === 'early' ? 1 : confidence === 'growing' ? 2 : 3;
  return (
    <span className={`evidence evidence--${confidence}`}>
      <span className="evidence__dots" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= dots ? 'on' : ''} />
        ))}
      </span>
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export function MatchBars({ match }: { match: MatchResult }) {
  return (
    <ul className="matchbars">
      {DIMENSIONS.map((d) => {
        const dim = match.dimensions[d.id];
        return (
          <li key={d.id} className={`matchbar ${FAMILY_CLASS[d.family]}`}>
            <div className="matchbar__top">
              <span className="matchbar__label">{d.label}</span>
              <span className="matchbar__value">
                {dim.score === null ? (
                  <Link to={DIM_HREF[d.id]} className="matchbar__missing">
                    Add evidence
                  </Link>
                ) : (
                  dim.score
                )}
              </span>
            </div>
            <div className={`matchbar__track${dim.score === null ? ' is-empty' : ''}`} aria-hidden="true">
              {dim.score !== null && <span style={{ width: `${dim.score}%` }} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function OverallScore({ match, size = 'md' }: { match: MatchResult; size?: 'sm' | 'md' }) {
  if (match.overall === null) {
    return <span className={`overall overall--${size} overall--none`}>No score yet</span>;
  }
  return (
    <span className={`overall overall--${size}`} aria-label={`Overall fit ${match.overall} out of 100`}>
      <span className="overall__num">{match.overall}</span>
      <span className="overall__of">/100</span>
    </span>
  );
}

export function Conflicts({ match }: { match: MatchResult }) {
  if (!match.conflicts.length) return null;
  return (
    <ul className="conflicts">
      {match.conflicts.map((c, i) => (
        <li key={i}>
          <Icon name="alert" size={18} />
          <span>{c.text}</span>
        </li>
      ))}
    </ul>
  );
}
