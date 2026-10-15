import { Link } from 'react-router-dom';
import { GIFTS, PROBLEMS, SERVES } from '../../data/vocab';
import { useStore } from '../../state/store';
import { Callout, Chip } from '../../components/ui';
import type { GiftId, ProblemId, ServeId } from '../../types';

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function GiftsSection() {
  const { profile, update, settings } = useStore();
  const ids = Object.keys(GIFTS) as GiftId[];
  return (
    <div className="split">
      <div className="stack">
        <p>Choose the strengths that show up again and again, at school, at home, at church, with friends. Pick as many as are true, but the ones that repeat matter most.</p>
        <div className="gift-grid">
          {ids.map((id) => {
            const on = profile.gifts.includes(id);
            return (
              <button key={id} type="button" aria-pressed={on} className={`gift${on ? ' is-selected' : ''}`} onClick={() => update((p) => void (p.gifts = toggle(p.gifts, id)))}>
                <span className="gift__name">{GIFTS[id].label}</span>
                <span className="gift__blurb">{GIFTS[id].blurb}</span>
              </button>
            );
          })}
        </div>
      </div>
      <aside className="stack sticky">
        {settings.faithLens && (
          <Callout tone="purpose" title="Gifts differing">
            In Romans 12, Paul lists gifts like serving, teaching, encouraging, giving, leading and mercy, and says they are different on purpose. No gift is more valuable than another.
          </Callout>
        )}
        <div className="card">
          <h3>Check your self-view</h3>
          <p className="muted small">We’re not always the best judges of our own gifts. Ask a few people what they see in you and record it.</p>
          <Link to="/purpose/feedback">Add what others see in me</Link>
        </div>
      </aside>
    </div>
  );
}

export function ServeSection() {
  const { profile, update } = useStore();
  const ids = Object.keys(SERVES) as ServeId[];
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <p>Who do you notice? Whose needs are hard for you to walk past? Choose the people you feel drawn toward helping.</p>
      <div className="chips">
        {ids.map((id) => (
          <Chip key={id} family="purpose" selected={profile.serves.includes(id)} onClick={() => update((p) => void (p.serves = toggle(p.serves, id)))}>
            {SERVES[id]}
          </Chip>
        ))}
      </div>
      <Callout tone="purpose">Service isn’t only for “helping professions.” An electrician serves families; an accountant serves small businesses. This helps Called find work where your effort reaches the people you care about.</Callout>
      {profile.serves.length > 0 && (
        <p>
          <Link to="/purpose/care">Next: what problems do you care about?</Link>
        </p>
      )}
    </div>
  );
}

export function ProblemsSection() {
  const { profile, update } = useStore();
  const ids = Object.keys(PROBLEMS) as ProblemId[];
  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <p>What problems in the world are difficult for you to ignore? Pick the ones that bother you enough that you’d want to work on them.</p>
      <div className="chips">
        {ids.map((id) => (
          <Chip key={id} family="purpose" selected={profile.problems.includes(id)} onClick={() => update((p) => void (p.problems = toggle(p.problems, id)))}>
            {PROBLEMS[id]}
          </Chip>
        ))}
      </div>
      {profile.problems.length > 0 && (
        <p>
          <Link to="/purpose/statement">Next: draft your current purpose statement</Link>
        </p>
      )}
    </div>
  );
}
