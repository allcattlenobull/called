import { useStore } from '../state/store';
import { BADGES, LEVELS, levelFor, pointLines, totalPoints, weeklyStreak } from '../lib/gamify';
import { BadgeMedal, EvidenceMeter, LevelRing, Quests } from '../components/Game';
import { EVIDENCE_META, evidenceProfile } from '../lib/evidence';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { Reveal } from '../components/motion';
import { PageHeader } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function Achievements() {
  useDocumentTitle('Achievements');
  const { profile } = useStore();
  const pts = totalPoints(profile);
  const { level, next, progress } = levelFor(pts);
  const cats = useMemo(() => evidenceProfile(profile), [profile]);
  const lines = pointLines(profile);
  const streak = weeklyStreak(profile.activeDays);

  return (
    <div className="wrap">
      <PageHeader title="Achievements" lead="The game in Called is gathering evidence about yourself. Every badge marks something you learned by doing. Points just keep the tally underneath." />

      <section className="card ev-card" aria-labelledby="ev-h">
        <h2 id="ev-h" className="h3">
          Your career evidence
        </h2>
        <EvidenceMeter cats={cats} />
        <ul className="ev-next">
          {cats
            .filter((c) => c.next)
            .map((c) => (
              <li key={c.id}>
                <span className="small muted">{c.label}:</span> <Link to={c.next!.to}>{c.next!.next}</Link>
              </li>
            ))}
        </ul>
      </section>

      <section className="achv-hero">
        <LevelRing progress={progress} size={160}>
          <span className="level-ring__n">{level.n}</span>
          <span className="level-ring__label">Level</span>
        </LevelRing>
        <div>
          <h2 style={{ marginBottom: 'var(--s-1)' }}>{level.name}</h2>
          <p className="lead" style={{ marginBottom: 'var(--s-3)' }}>
            {level.blurb}
          </p>
          <p className="small muted">
            {pts.toLocaleString('en-US')} evidence points{next ? ` · Next level: ${next.name}` : ''}
          </p>
          {streak > 0 && <p className="small">You’ve shown up {streak} week{streak === 1 ? '' : 's'} in a row.</p>}
        </div>
      </section>

      <ol className="level-track" aria-label="Levels">
        {LEVELS.map((l) => (
          <li key={l.n} className={l.n < level.n ? 'is-past' : l.n === level.n ? 'is-current' : ''}>
            <span className="level-track__dot">{l.n}</span>
            <span className="level-track__name">{l.name}</span>
          </li>
        ))}
      </ol>

      <div className="split" style={{ marginTop: 'var(--s-6)' }}>
        <section aria-labelledby="badges-h">
          <h2 id="badges-h" className="h3 section-title">
            Badges
          </h2>
          <ul className="badge-grid">
            {BADGES.map((b, i) => {
              const [have, need] = b.progress(profile);
              const earned = have >= need;
              return (
                <Reveal as="li" key={b.id} className={`badge-card${earned ? ' is-earned' : ''}`} delay={i * 30}>
                  <BadgeMedal badge={b} earned={earned} />
                  <span className="badge-card__name">{b.name}</span>
                  <span className="badge-card__desc">{earned ? b.insight.headline : b.description}</span>
                  <span className="badge-card__ev">{EVIDENCE_META[b.evidence].label}</span>
                  {earned ? (
                    <span className="tag tag--done">Earned</span>
                  ) : (
                    <span className="badge-card__progress" role="progressbar" aria-label={`${b.name} progress`} aria-valuemin={0} aria-valuemax={need} aria-valuenow={Math.min(have, need)}>
                      <span style={{ width: `${(Math.min(have, need) / need) * 100}%` }} />
                    </span>
                  )}
                </Reveal>
              );
            })}
          </ul>
        </section>
        <aside className="stack-lg sticky">
          <Quests />
          <section className="card" aria-labelledby="pts-h">
            <h2 id="pts-h" className="h3">
              Where your evidence points come from
            </h2>
            <table className="table points-table">
              <caption className="visually-hidden">Evidence points by activity</caption>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className={l.points ? '' : 'is-zero'}>
                    <th scope="row">
                      {l.label}
                      <span className="small muted">
                        {' '}
                        {l.each} each{l.cap ? `, up to ${l.cap}` : ''}
                      </span>
                    </th>
                    <td className="num">{l.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </div>
  );
}
