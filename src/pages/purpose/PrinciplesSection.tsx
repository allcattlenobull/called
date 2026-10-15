import { Link } from 'react-router-dom';
import { PRINCIPLES } from '../../data/scripture/principles';
import { useStore } from '../../state/store';
import { Callout } from '../../components/ui';

export function PrinciplesSection() {
  const { profile, update, settings } = useStore();
  return (
    <div className="stack-lg" style={{ maxWidth: 820 }}>
      <Callout tone="purpose" title="How Called uses Scripture">
        Called is built on Christian principles. It uses Scripture to shape how you weigh decisions, not to tell you which career God wants for you. Passages are from the King James Version (public domain) with a plain-language summary.
        {!settings.faithLens && (
          <>
            {' '}
            Faith reflections are currently hidden elsewhere in the app. <Link to="/data">Change this in settings</Link>.
          </>
        )}
      </Callout>
      {PRINCIPLES.map((pr) => (
        <section key={pr.id} id={pr.id} className="principle" aria-labelledby={`pr-${pr.id}`}>
          <h2 id={`pr-${pr.id}`} className="h3">
            {pr.name}
          </h2>
          <p className="principle__q">{pr.question}</p>
          <p>{pr.idea}</p>
          {pr.passages.map((ps) => (
            <div key={ps.ref} className="scripture">
              <span className="scripture__ref">{ps.ref}</span>
              {ps.kjv && <p className="scripture__kjv">“{ps.kjv}”</p>}
              <p className="scripture__summary">{ps.summary}</p>
            </div>
          ))}
          <p className="small muted">{pr.inPractice}</p>
          <div className="field">
            <label htmlFor={`note-${pr.id}`}>{pr.reflect[0]}</label>
            <span className="field__hint">{pr.reflect[1]}</span>
            <textarea
              id={`note-${pr.id}`}
              className="textarea"
              value={profile.principleNotes[pr.id] ?? ''}
              onChange={(e) =>
                update((p) => {
                  if (e.target.value) p.principleNotes[pr.id] = e.target.value;
                  else delete p.principleNotes[pr.id];
                })
              }
              placeholder="Your reflection is saved on this device as you type."
            />
          </div>
        </section>
      ))}
    </div>
  );
}
