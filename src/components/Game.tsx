import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { BADGES, currentWeek, earnedBadges, levelFor, pickQuests, questStatus, totalPoints, weeklyStreak, type Badge, type QuestSnapshot } from '../lib/gamify';
import { CountUp, prefersReducedMotion, useMountedFlag } from './motion';
import { Icon } from './Icon';

export function BadgeMedal({ badge, earned, size = 64 }: { badge: Badge; earned: boolean; size?: number }) {
  return (
    <span className={`medal fam-${badge.family}${earned ? ' is-earned' : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx="32" cy="32" r="29" className="medal__ring" />
        <circle cx="32" cy="32" r="22" className="medal__face" />
        <text x="32" y="33" textAnchor="middle" dominantBaseline="middle" className="medal__glyph">
          {badge.glyph}
        </text>
      </svg>
    </span>
  );
}

export function LevelRing({ progress, size = 96, children }: { progress: number; size?: number; children?: ReactNode }) {
  const mounted = useMountedFlag();
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <span className="level-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="level-ring__track" />
        <circle cx="50" cy="50" r={r} className="level-ring__fill" strokeDasharray={c} strokeDashoffset={mounted ? c * (1 - progress) : c} transform="rotate(-90 50 50)" />
      </svg>
      <span className="level-ring__inner">{children}</span>
    </span>
  );
}

/** Small header chip: level and points. */
export function LevelChip() {
  const { profile } = useStore();
  const pts = totalPoints(profile);
  const { level } = levelFor(pts);
  return (
    <Link to="/achievements" className="level-chip" aria-label={`Level ${level.n}, ${level.name}, ${pts} points. View achievements.`}>
      <span className="level-chip__n">{level.n}</span>
      <span className="level-chip__pts">
        <CountUp value={pts} /> pts
      </span>
    </Link>
  );
}

export function LevelCard() {
  const { profile } = useStore();
  const pts = totalPoints(profile);
  const { level, next, progress, toNext } = levelFor(pts);
  const streak = weeklyStreak(profile.activeDays);
  const earned = earnedBadges(profile);
  return (
    <section className="card level-card" aria-labelledby="level-h">
      <LevelRing progress={progress} size={104}>
        <span className="level-ring__n">{level.n}</span>
        <span className="level-ring__label">Level</span>
      </LevelRing>
      <div className="level-card__body">
        <h2 id="level-h" className="h3" style={{ margin: 0 }}>
          {level.name}
        </h2>
        <p className="muted small" style={{ margin: '2px 0 var(--s-2)' }}>
          {level.blurb}
        </p>
        <p className="level-card__pts">
          <strong>
            <CountUp value={pts} />
          </strong>{' '}
          points{next ? `, ${toNext} to ${next.name}` : ''}
        </p>
        <div className="row small">
          <span className="tag tag--done">
            <Icon name="spark" size={14} /> {earned.length} of {BADGES.length} badges
          </span>
          {streak > 0 && <span className="tag tag--primary">{streak}-week streak</span>}
          <Link to="/achievements">See achievements</Link>
        </div>
      </div>
    </section>
  );
}

/** This week’s three quests. The snapshot is stored so progress counts only this week’s work. */
export function Quests() {
  const { profile, setDraft } = useStore();
  const week = currentWeek();
  const stored = profile.drafts.quests as QuestSnapshot | undefined;
  const snap = useMemo(() => (stored && stored.week === week ? stored : pickQuests(profile, week)), [stored, week, profile]);
  useEffect(() => {
    if (!stored || stored.week !== week) setDraft('quests', snap);
  }, [stored, week, snap, setDraft]);
  const items = questStatus(profile, snap);
  const done = items.filter((i) => i.done).length;
  return (
    <section className="card quests" aria-labelledby="quests-h">
      <div className="row row--between">
        <h2 id="quests-h" className="h3" style={{ margin: 0 }}>
          This week’s quests
        </h2>
        <span className="tag">
          {done} of {items.length}
        </span>
      </div>
      <ul className="quest-list">
        {items.map(({ quest, have, target, done: isDone }) => (
          <li key={quest.id} className={isDone ? 'is-done' : ''}>
            <span className="quest-check" aria-hidden="true">
              {isDone && <Icon name="check" size={16} />}
            </span>
            <Link to={quest.to} className="quest-title">
              {quest.title}
              <span className="visually-hidden">{isDone ? ' (done)' : ''}</span>
            </Link>
            <span className="quest-meta">
              {target > 1 && !isDone ? `${have}/${target}, ` : ''}+{quest.points}
            </span>
          </li>
        ))}
      </ul>
      <p className="small muted" style={{ margin: 0 }}>
        New quests every Monday.
      </p>
    </section>
  );
}

/**
 * Watches for newly earned badges and level-ups and celebrates them once.
 * A short burst of brand-colored rings, then a card the user dismisses.
 */
export function Celebrations() {
  const { profile, update, ready } = useStore();
  const pts = totalPoints(profile);
  const { level } = levelFor(pts);
  const earned = earnedBadges(profile);
  const fresh = earned.filter((b) => !profile.seenBadges.includes(b.id));
  const levelUp = level.n > profile.seenLevel && profile.seenLevel > 0;
  const firstRun = profile.seenLevel === 0;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    // On first ever load (or for older profiles), record current state quietly unless there's something to show.
    if (firstRun && fresh.length === 0) {
      update((p) => {
        p.seenLevel = level.n;
      });
      return;
    }
    if (fresh.length > 0 || levelUp) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, fresh.length, levelUp, firstRun]);

  const dismiss = () => {
    setOpen(false);
    update((p) => {
      p.seenBadges = Array.from(new Set([...p.seenBadges, ...earned.map((b) => b.id)]));
      p.seenLevel = level.n;
    });
  };

  if (!open) return null;
  const headline = levelUp ? `Level ${level.n}: ${level.name}` : fresh.length === 1 ? `Badge earned: ${fresh[0].name}` : `${fresh.length} badges earned`;
  return (
    <div className="celebrate" role="dialog" aria-modal="true" aria-labelledby="celebrate-h">
      <div className="celebrate__scrim" onClick={dismiss} />
      {!prefersReducedMotion() && <Burst />}
      <div className="celebrate__card">
        {levelUp ? (
          <LevelRing progress={1} size={120}>
            <span className="level-ring__n">{level.n}</span>
            <span className="level-ring__label">Level</span>
          </LevelRing>
        ) : (
          <div className="celebrate__medals">
            {fresh.slice(0, 4).map((b) => (
              <BadgeMedal key={b.id} badge={b} earned size={72} />
            ))}
          </div>
        )}
        <h2 id="celebrate-h">{headline}</h2>
        <p className="muted">
          {levelUp
            ? level.blurb
            : fresh.length === 1
              ? fresh[0].description
              : `${fresh.slice(0, 3).map((b) => b.name).join(', ')}${fresh.length > 3 ? ` and ${fresh.length - 3} more` : ''}.`}
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn--primary" onClick={dismiss} autoFocus>
            Keep going
          </button>
          <Link to="/achievements" className="btn btn--quiet" onClick={dismiss}>
            See achievements
          </Link>
        </div>
      </div>
    </div>
  );
}

function Burst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        angle: (i / 28) * 360 + Math.random() * 10,
        dist: 140 + Math.random() * 160,
        size: 6 + Math.random() * 10,
        ring: i % 3 === 0,
        color: ['var(--dim-self)', 'var(--dim-life)', 'var(--dim-purpose)', 'var(--c-spark)'][i % 4],
        delay: Math.random() * 120,
      })),
    [],
  );
  return (
    <div className="burst" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`burst__p${p.ring ? ' is-ring' : ''}`}
          style={{
            ['--a' as string]: `${p.angle}deg`,
            ['--d' as string]: `${p.dist}px`,
            ['--s' as string]: `${p.size}px`,
            ['--c' as string]: p.color,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
