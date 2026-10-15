import { Link } from 'react-router-dom';
import type { Career } from '../types';
import type { MatchResult } from '../lib/matching';
import { EDUCATION_LEVELS, FAMILIES } from '../data/vocab';
import { moneyK } from '../lib/format';
import { useStore } from '../state/store';
import { EvidenceBadge, FitStrip, OverallScore } from './Match';
import { Icon } from './Icon';
import { readinessLabel, type Readiness } from '../lib/readiness';
import type { LocalPay } from '../lib/places';

export function SaveButton({ careerId, compact }: { careerId: string; compact?: boolean }) {
  const { profile, update } = useStore();
  const saved = profile.saved.includes(careerId);
  return (
    <button
      type="button"
      className={`btn ${compact ? 'btn--icon' : 'btn--secondary'}${saved ? ' is-on' : ''}`}
      aria-pressed={saved}
      aria-label={compact ? (saved ? 'Remove saved career' : 'Save career') : undefined}
      onClick={() =>
        update((p) => {
          p.saved = saved ? p.saved.filter((x) => x !== careerId) : [...p.saved, careerId];
          if (!saved && !p.careerStatus[careerId]) p.careerStatus[careerId] = 'curious';
        })
      }
    >
      <Icon name={saved ? 'bookmarkFilled' : 'bookmark'} size={18} />
      {!compact && (saved ? 'Saved' : 'Save career')}
    </button>
  );
}

export function CareerCard({ career, match, showMatch = true, ready, pay }: { career: Career; match?: MatchResult; showMatch?: boolean; ready?: Readiness; pay?: LocalPay }) {
  return (
    <article className="ccard">
      <div className="ccard__head">
        <span className="ccard__family">{FAMILIES[career.family]}</span>
        <SaveButton careerId={career.id} compact />
      </div>
      <h3 className="ccard__title">
        <Link to={`/careers/${career.id}`} className="stretched">
          {career.title}
        </Link>
      </h3>
      <p className="ccard__summary">{career.summary}</p>
      <dl className="ccard__facts">
        <div>
          <dt>{pay && pay.scope !== 'national' ? 'Pay where you live' : 'Median pay'}</dt>
          <dd>{moneyK(pay?.pay ?? career.pay.median)}</dd>
        </div>
        <div>
          <dt>{ready ? 'From where you are' : 'Training'}</dt>
          <dd>{ready ? readinessLabel(ready) : EDUCATION_LEVELS[career.education.level].label}</dd>
        </div>
      </dl>
      {showMatch && match && match.overall !== null && (
        <div className="ccard__match">
          <OverallScore match={match} size="sm" />
          <FitStrip match={match} />
          <EvidenceBadge confidence={match.confidence} />
        </div>
      )}
    </article>
  );
}
