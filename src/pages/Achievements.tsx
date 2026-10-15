import { useStore } from '../state/store';
import { BADGES, LEVELS, levelFor, pointLines, totalPoints, weeklyStreak } from '../lib/gamify';
import { BadgeMedal, LevelRing, Quests } from '../components/Game';
import { CountUp, Reveal } from '../components/motion';
import { PageHeader } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function Achievements() {
  useDocumentTitle('Achievements');
  const { profile } = useStore();
  const pts = totalPoints(profile);
  const { level, next, progress, toNext } = levelFor(pts);
  const lines = pointLines(profile);
  const streak = weeklyStreak(profile.activeDays);

  return (
    <div className="wrap">
      <PageHeader title="Achievements" lead="Points come from real exploration: reflecting, trying the work and talking to people. They can’t tell you what to become, but they show how much evidence you’ve gathered." />

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
          <p className="achv-points">
            <strong>
              <CountUp value={pts} />
            </strong>{' '}
            points
            {next && (
              <span className="muted">
                {' '}
                ({toNext} more to reach {next.name})
              </span>
            )}
          </p>
          {streak > 0 && <p className="small">You’ve shown up {streak} week{streak === 1 ? '' : 's'} in a row.</p>}
        </div>
      </section>

      <ol className="level-track" aria-label="Levels">
        {LEVELS.map((l) => (
          <li key={l.n} className={l.n < level.n ? 'is-past' : l.n === level.n ? 'is-current' : ''}>
            <span className="level-track__dot">{l.n}</span>
            <span className="level-track__name">{l.name}</span>
            <span className="level-track__min">{l.min.toLocaleString('en-US')}</span>
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
                  <span className="badge-card__desc">{b.description}</span>
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
              Where your points come from
            </h2>
            <table className="table points-table">
              <caption className="visually-hidden">Points by activity</caption>
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
