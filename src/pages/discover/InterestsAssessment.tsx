import { useEffect, useRef, useState } from 'react';
import { INTEREST_ITEMS } from '../../data/assessments';
import { INTERESTS } from '../../data/vocab';
import { useStore } from '../../state/store';
import { interestSignals, INTEREST_IDS } from '../../lib/signals';
import type { LikeAnswer } from '../../types';
import { NextAssessment } from './Assessment';

const CHOICES: { value: LikeAnswer; label: string }[] = [
  { value: 1, label: 'I’d enjoy this' },
  { value: 0, label: 'Not sure' },
  { value: -1, label: 'Not for me' },
];

export function InterestsAssessment() {
  const { profile, update } = useStore();
  const firstUnanswered = INTEREST_ITEMS.findIndex((i) => profile.interests[i.id] === undefined);
  const [idx, setIdx] = useState(firstUnanswered === -1 ? INTEREST_ITEMS.length : firstUnanswered);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const done = idx >= INTEREST_ITEMS.length;

  useEffect(() => {
    headingRef.current?.focus();
  }, [idx]);

  const answer = (v: LikeAnswer) => {
    const item = INTEREST_ITEMS[idx];
    update((p) => {
      p.interests[item.id] = v;
      if (Object.keys(p.interests).length >= INTEREST_ITEMS.length) p.completed.interests = new Date().toISOString();
    });
    setIdx((i) => i + 1);
  };

  if (done) {
    const sig = interestSignals(profile);
    const sorted = [...INTEREST_IDS].sort((a, b) => sig[b].score - sig[a].score);
    return (
      <section className="runner" aria-labelledby="int-done" tabIndex={-1} ref={headingRef as never}>
        <h2 id="int-done">Here’s what you responded to</h2>
        <p>Higher bars are activities you said you’d enjoy. This is a starting signal; simulations and experiments will test it.</p>
        <ul className="matchbars" style={{ maxWidth: 560 }}>
          {sorted.map((id) => (
            <li key={id} className="matchbar fam-self">
              <div className="matchbar__top">
                <span className="matchbar__label">{INTERESTS[id].label}</span>
                <span className="matchbar__value">{sig[id].liked} of 5</span>
              </div>
              <div className="matchbar__track" aria-hidden="true">
                <span style={{ width: `${Math.round(sig[id].score * 100)}%` }} />
              </div>
              <span className="small muted">{INTERESTS[id].blurb}</span>
            </li>
          ))}
        </ul>
        <div className="row" style={{ marginTop: 'var(--s-4)' }}>
          <button type="button" className="btn btn--quiet" onClick={() => setIdx(0)}>
            Review my answers
          </button>
        </div>
        <NextAssessment current="interests" />
      </section>
    );
  }

  const item = INTEREST_ITEMS[idx];
  const current = profile.interests[item.id];
  return (
    <section className="runner" aria-live="polite">
      <p className="runner__count">
        Activity {idx + 1} of {INTEREST_ITEMS.length}
      </p>
      <div className="progress__track" aria-hidden="true" style={{ marginBottom: 'var(--s-5)' }}>
        <span style={{ width: `${(idx / INTEREST_ITEMS.length) * 100}%` }} />
      </div>
      <div className="runner__step" key={item.id}>
        <p className="muted">How would you feel about spending an afternoon doing this?</p>
        <h2 className="question" tabIndex={-1} ref={headingRef}>
          {item.text}
        </h2>
        <div className="answer-row" role="group" aria-label="Your answer">
          {CHOICES.map((c) => (
            <button key={c.value} type="button" className={`answer${current === c.value ? ' is-current' : ''}`} onClick={() => answer(c.value)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="runner__nav">
        <button type="button" className="btn btn--quiet" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
          Back
        </button>
        {current !== undefined && (
          <button type="button" className="btn btn--secondary" onClick={() => setIdx((i) => i + 1)}>
            Keep answer and continue
          </button>
        )}
      </div>
    </section>
  );
}
