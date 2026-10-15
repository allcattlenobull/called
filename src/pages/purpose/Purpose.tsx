import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useStore } from '../../state/store';
import { computeCompass, compassCompleteness } from '../../lib/compass';
import { CompassBloom } from '../../components/CompassBloom';
import { CompassList } from '../../components/CompassList';
import { PageHeader } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { PURPOSE_SECTIONS } from '../../data/purpose/prompts';
import { formatDate } from '../../lib/format';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export default function Purpose() {
  useDocumentTitle('Purpose');
  const { profile, settings } = useStore();
  const dims = useMemo(() => computeCompass(profile), [profile]);
  const completeness = Math.round(compassCompleteness(dims) * 100);
  const statement = profile.statements[profile.statements.length - 1];
  const counts: Record<string, string> = {
    gifts: profile.gifts.length ? `${profile.gifts.length} named` : '',
    care: profile.problems.length ? `${profile.problems.length} chosen` : '',
    serve: profile.serves.length ? `${profile.serves.length} chosen` : '',
    experiences: profile.experiences.length ? `${profile.experiences.length} logged` : '',
    feedback: profile.feedback.length ? `${profile.feedback.length} notes` : '',
    principles: Object.keys(profile.principleNotes).length ? `${Object.keys(profile.principleNotes).length} reflections` : '',
    journal: profile.journal.length ? `${profile.journal.length} entries` : '',
    statement: profile.statements.length ? `Version ${profile.statements.length}` : '',
  };
  const sections = PURPOSE_SECTIONS.filter((s) => settings.faithLens || s.id !== 'principles');

  return (
    <div className="wrap">
      <PageHeader title="Your Purpose Compass" lead="A living profile of who you are and where your gifts might meet real needs. It becomes more evidence-based every time you reflect, try something or hear from others." />

      <section className="compass-hero">
        <div className="compass-hero__art">
          <CompassBloom dims={dims} labels size={520} />
          <div className="compass-legend" aria-label="Legend">
            <span className="fam-self">
              <i aria-hidden="true" /> Self
            </span>
            <span className="fam-life">
              <i aria-hidden="true" /> Life
            </span>
            <span className="fam-purpose">
              <i aria-hidden="true" /> Purpose
            </span>
            <span className="compass-legend__note">Longer petal: stronger signal. Deeper color: more evidence. Dashed: not explored yet.</span>
          </div>
        </div>
        <div>
          <div className="row row--between" style={{ marginBottom: 'var(--s-3)' }}>
            <h2 className="h3" style={{ margin: 0 }}>
              Eleven dimensions
            </h2>
            <span className="tag tag--done">{completeness}% filled in</span>
          </div>
          <CompassList dims={dims} />
        </div>
      </section>

      <section className="section">
        <div className="panel panel--purpose statement-card">
          <h2 className="h3">My current purpose statement</h2>
          {statement ? (
            <>
              <blockquote className="statement">{statement.text}</blockquote>
              <p className="muted small">
                Written {formatDate(statement.createdAt)}. Purpose matures over time; this is version {profile.statements.length}.
              </p>
            </>
          ) : (
            <p className="muted">Not written yet. Once you’ve named some gifts and who you want to serve, Called will help you draft one.</p>
          )}
          <Link to="/purpose/statement" className="btn btn--secondary">
            {statement ? 'Revise my statement' : 'Draft my statement'}
          </Link>
        </div>
      </section>

      <section aria-labelledby="reflect-h">
        <h2 id="reflect-h" className="section-title">
          Guided reflections
        </h2>
        <div className="grid grid--3">
          {sections
            .filter((s) => s.id !== 'statement')
            .map((s) => (
              <article key={s.id} className="card card--link">
                <div className="row row--between">
                  <Icon name={s.id === 'journal' ? 'journal' : s.id === 'principles' ? 'purpose' : 'spark'} size={22} className="card-icon" />
                  {counts[s.id] && <span className="tag tag--done">{counts[s.id]}</span>}
                </div>
                <h3 style={{ marginTop: 'var(--s-3)' }}>
                  <Link to={`/purpose/${s.id}`} className="stretched">
                    {s.title}
                  </Link>
                </h3>
                <p className="muted small">{s.question}</p>
              </article>
            ))}
        </div>
      </section>
    </div>
  );
}
