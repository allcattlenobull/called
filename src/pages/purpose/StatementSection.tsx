import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../state/store';
import { GIFTS, PROBLEMS, SERVES, SKILLS } from '../../data/vocab';
import { topSkills } from '../../lib/compass';
import { giftSignals } from '../../lib/signals';
import { Callout, Chip } from '../../components/ui';
import { uid } from '../../lib/profile';
import { formatDate } from '../../lib/format';

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function StatementSection() {
  const { profile, update } = useStore();
  const gifts = giftSignals(profile).all;
  const skills = topSkills(profile, 3);
  const abilityOptions = [...gifts.map((g) => GIFTS[g].label), ...skills.map((s) => SKILLS[s].label)];
  const [abilities, setAbilities] = useState<string[]>(abilityOptions.slice(0, 2));
  const [serve, setServe] = useState<string | undefined>(profile.serves[0]);
  const [problem, setProblem] = useState<string | undefined>(profile.problems[0]);
  const current = profile.statements[profile.statements.length - 1];

  const draft = useMemo(() => {
    const a = abilities.map(lower);
    const ability = a.length ? (a.length === 1 ? a[0] : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`) : 'my strengths';
    const who = serve ? lower(SERVES[serve as keyof typeof SERVES]) : 'people';
    const what = problem ? lower(PROBLEMS[problem as keyof typeof PROBLEMS]) : 'problems that matter';
    return `I want to use my gifts of ${ability} to serve ${who} by working on ${what}.`;
  }, [abilities, serve, problem]);

  const [text, setText] = useState(current?.text ?? '');
  const ready = gifts.length > 0 || profile.serves.length > 0;

  const save = () => {
    if (!text.trim()) return;
    update((p) => {
      p.statements.push({ id: uid('st'), createdAt: new Date().toISOString(), text: text.trim() });
    });
  };

  return (
    <div className="split">
      <div className="stack">
        <Callout tone="purpose" title="This is a current statement, not a permanent one">
          Purpose matures. Write what seems true now. You can revise it anytime, and Called keeps earlier versions so you can see how you’ve grown.
        </Callout>

        {!ready && (
          <Callout title="Start with a few reflections">
            Name some <Link to="/purpose/gifts">gifts</Link> and <Link to="/purpose/serve">who you want to help</Link> first. The builder will use them.
          </Callout>
        )}

        <section className="card stack" aria-labelledby="builder-h">
          <h2 id="builder-h" className="h3">
            Build a draft
          </h2>
          {abilityOptions.length > 0 && (
            <div className="field">
              <span className="field__label">Gifts and skills to include</span>
              <div className="chips">
                {abilityOptions.map((a) => (
                  <Chip key={a} family="purpose" selected={abilities.includes(a)} onClick={() => setAbilities((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]))}>
                    {a}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {profile.serves.length > 0 && (
            <div className="field">
              <span className="field__label">Who you want to serve</span>
              <div className="chips">
                {profile.serves.map((s) => (
                  <Chip key={s} family="purpose" selected={serve === s} onClick={() => setServe(s)}>
                    {SERVES[s]}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {profile.problems.length > 0 && (
            <div className="field">
              <span className="field__label">The problem you care about</span>
              <div className="chips">
                {profile.problems.map((s) => (
                  <Chip key={s} family="purpose" selected={problem === s} onClick={() => setProblem(s)}>
                    {PROBLEMS[s]}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          <p className="draft">{draft}</p>
          <button type="button" className="btn btn--secondary" onClick={() => setText(draft)}>
            Use this draft
          </button>
        </section>

        <section className="field">
          <label htmlFor="statement" className="h3" style={{ fontFamily: 'var(--font-display)' }}>
            My current purpose statement
          </label>
          <span className="field__hint">
            Make it yours. An example: “I want to use my ability to understand complex problems and communicate clearly to create systems that improve people’s financial lives.”
          </span>
          <textarea id="statement" className="textarea" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row">
            <button type="button" className="btn btn--primary" onClick={save} disabled={!text.trim() || text.trim() === current?.text}>
              {current ? 'Save as new version' : 'Save statement'}
            </button>
          </div>
        </section>
      </div>

      <aside className="stack sticky" aria-labelledby="history-h">
        <h2 id="history-h" className="h3">
          How it has changed
        </h2>
        {profile.statements.length ? (
          <ol className="history" reversed>
            {[...profile.statements].reverse().map((s, i) => (
              <li key={s.id} className={i === 0 ? 'is-current' : ''}>
                <span className="small muted">
                  {i === 0 ? 'Current, ' : ''}
                  {formatDate(s.createdAt)}
                </span>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">Your versions will appear here.</p>
        )}
      </aside>
    </div>
  );
}
