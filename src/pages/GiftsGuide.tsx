import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../state/store';
import { GIFTS } from '../data/vocab';
import { PRINCIPLE_BY_ID } from '../data/scripture/principles';
import { PageHeader } from '../components/ui';
import { Icon } from '../components/Icon';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import type { GiftId } from '../types';

/** A short guide for people who want to understand gifts before (or instead of) choosing a career. */
export default function GiftsGuide() {
  useDocumentTitle('Understanding gifts');
  const { profile, settings, setDraft } = useStore();
  const principle = PRINCIPLE_BY_ID.gifts;
  const stewardship = PRINCIPLE_BY_ID.stewardship;

  useEffect(() => {
    if (!profile.drafts['seen:gifts-guide']) setDraft('seen:gifts-guide', new Date().toISOString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wrap wrap--narrow gifts-guide">
      <PageHeader title="Understanding gifts" lead="A gift is something you bring that makes life better for other people, and that tends to show up again and again. Everyone has some. No gift is more valuable than another." />

      <section className="section section--tight" aria-labelledby="how-h">
        <h2 id="how-h" className="h3">How gifts show up</h2>
        <ul className="guide-points">
          <li>
            <strong>They repeat.</strong> You find yourself doing them at school, at home, at church, with friends, often without being asked.
          </li>
          <li>
            <strong>Other people notice them.</strong> People come to you for the same kind of help. They may see your gift before you do.
          </li>
          <li>
            <strong>They give energy.</strong> Using a gift can be hard work, but it usually leaves you more alive, not drained.
          </li>
          <li>
            <strong>They point toward people.</strong> Gifts are for something: a person helped, a problem eased, something made well.
          </li>
        </ul>
      </section>

      <section className="section section--tight" aria-labelledby="diff-h">
        <h2 id="diff-h" className="h3">Gifts, skills and interests</h2>
        <div className="grid grid--3 guide-compare">
          <div className="card">
            <h3 className="h4">Gifts</h3>
            <p className="small">How you’re made to contribute: encouraging, organizing, teaching, building, showing mercy.</p>
          </div>
          <div className="card">
            <h3 className="h4">Skills</h3>
            <p className="small">What you’ve learned to do: writing, math, using tools. Skills can be trained; gifts are where training goes furthest.</p>
          </div>
          <div className="card">
            <h3 className="h4">Interests</h3>
            <p className="small">What draws your curiosity. You can be interested in something that isn’t your gift, and that’s fine.</p>
          </div>
        </div>
      </section>

      {settings.faithLens && principle && (
        <section className="section section--tight" aria-labelledby="faith-h">
          <h2 id="faith-h" className="h3">What the Bible says about gifts</h2>
          <p>{principle.idea}</p>
          {[...principle.passages, ...(stewardship?.passages.slice(1, 2) ?? [])].map((ps) => (
            <blockquote key={ps.ref} className="guide-quote">
              {ps.kjv && <p className="guide-quote__text">“{ps.kjv}”</p>}
              <p className="small">
                <strong>{ps.ref}.</strong> {ps.summary}
              </p>
            </blockquote>
          ))}
          <p className="small muted">Called uses these as a lens for reflection. It never tells you a career is what God wants for you.</p>
        </section>
      )}

      <section className="section section--tight" aria-labelledby="list-h">
        <h2 id="list-h" className="h3">Gifts people often recognize</h2>
        <ul className="guide-gifts">
          {(Object.keys(GIFTS) as GiftId[]).map((id) => (
            <li key={id}>
              <strong>{GIFTS[id].label}</strong>
              <span>{GIFTS[id].blurb}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card guide-next" aria-labelledby="next-h">
        <h2 id="next-h" className="h3">Find yours</h2>
        <ol className="guide-steps">
          <li>
            <Link to="/purpose/gifts">Choose the gifts that repeat in your life</Link>
          </li>
          <li>
            <Link to="/purpose/feedback">Ask two or three people what they see in you</Link>
          </li>
          <li>
            <Link to="/try/experiments">Try one small way to use a gift this month</Link>
          </li>
        </ol>
        <Link to="/purpose/gifts" className="btn btn--primary">
          Choose my gifts <Icon name="arrowRight" size={18} />
        </Link>
      </section>
    </div>
  );
}
