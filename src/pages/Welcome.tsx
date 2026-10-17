import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { CompassBloom, SAMPLE_DIMS } from '../components/CompassBloom';
import { OptionGroup } from '../components/ui';
import { Icon } from '../components/Icon';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { RestoreForm } from '../components/JourneyCode';
import type { Profile } from '../types';
import { TERMS_VERSION } from '../lib/terms';
import { Doors } from '../components/Doors';
import { JOURNEYS } from '../lib/journeys';

const EVIDENCE = ['who you are', 'what you value', 'what you’re good at', 'what you’re curious about', 'what kind of life you want', 'and what work might fit'];

export default function Welcome() {
  useDocumentTitle('Welcome');
  const { profile, update, settings, setSettings } = useStore();
  const navigate = useNavigate();
  const journey = profile.goal ? JOURNEYS[profile.goal] : undefined;
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState(profile.name ?? '');
  const [lastName, setLastName] = useState(profile.lastName ?? '');
  const [stage, setStage] = useState<Profile['stage']>(profile.stage ?? (profile.goal === 'change' ? 'working' : undefined));
  const [city, setCity] = useState(profile.location?.city ?? '');
  const [state, setState] = useState(profile.location?.state ?? '');
  const [zip, setZip] = useState(profile.location?.zip ?? '');
  const [acceptedGuestTerms, setAcceptedGuestTerms] = useState(profile.guestTermsAcceptedVersion === TERMS_VERSION);

  const finish = (to: string) => {
    update((p) => {
      p.onboarded = true;
      p.name = name.trim() || undefined;
      p.lastName = lastName.trim() || undefined;
      p.stage = stage ?? (p.goal === 'change' ? 'working' : undefined);
      if (city.trim() || state.trim() || zip.trim()) p.location = { city: city.trim() || undefined, state: state.trim().toUpperCase() || undefined, zip: zip.trim() || undefined, considering: p.location?.considering ?? [], place: p.location?.state === (state.trim().toUpperCase() || undefined) ? p.location?.place : undefined };
    });
    navigate(to);
  };

  return (
    <div className="wrap wrap--narrow welcome">
      {step === 0 ? (
        <section className="runner__step welcome__intro" aria-labelledby="w-title">
          <CompassBloom dims={SAMPLE_DIMS} size={200} animate title="A Purpose Compass" />
          <h1 id="w-title">Called will not tell you exactly what to do with your life.</h1>
          <p className="lead">Instead, it will help you collect evidence about:</p>
          <ul className="evidence-list">
            {EVIDENCE.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p>
            Your direction can change as you learn more about yourself. That’s expected. Called keeps track of what you learn so you can see it grow.
          </p>
          <div className="callout">
            <Icon name="lock" size={20} />
            <div>
              <strong className="callout__title">Start without an account</strong>
              Your work stays in this browser unless you deliberately export, share, or activate a connected feature. You can create a private individual account later.
            </div>
          </div>
          <details className="restore-details">
            <summary>Coming back? Enter your journey code</summary>
            <RestoreForm />
          </details>
          <div className="terms-consent">
            <label className="check">
              <input type="checkbox" checked={acceptedGuestTerms} onChange={(event) => setAcceptedGuestTerms(event.target.checked)} />
              I agree to the Guest Terms of Use
            </label>
            <p className="small muted">Read the <Link to="/terms#guest">Guest Terms</Link>. If you are under 13, use device-only features only with a parent, guardian, or authorized school adult.</p>
          </div>
          <div className="runner__nav">
            <span />
            <button type="button" className="btn btn--primary btn--lg" disabled={!acceptedGuestTerms} onClick={() => {
              update((draft) => {
                draft.guestTermsAcceptedVersion = TERMS_VERSION;
                draft.guestTermsAcceptedAt = new Date().toISOString();
              });
              setStep(1);
            }}>
              Continue
            </button>
          </div>
        </section>
      ) : (
        <section className="runner__step" aria-labelledby="w2-title">
          <h1 id="w2-title">A little about you</h1>
          <p className="lead">Everything here is optional. It helps Called speak to where you are.</p>
          <div className="stack-lg">
            <div className="grid grid--2">
              <div className="field">
                <label htmlFor="name">What should we call you?</label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" placeholder="First name" maxLength={40} />
              </div>
              <div className="field">
                <label htmlFor="last-name">Last name</label>
                <input id="last-name" className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" placeholder="Last name" maxLength={60} />
              </div>
            </div>
            <OptionGroup
              legend="Where are you right now?"
              value={stage}
              onChange={(v) => setStage(v)}
              layout="grid"
              options={[
                { value: 'highSchool', label: 'In high school' },
                { value: 'graduated', label: 'Recently graduated' },
                { value: 'college', label: 'In college or training' },
                { value: 'working', label: 'Working or changing careers' },
                { value: 'other', label: 'Something else' },
              ]}
            />
            <div className="field">
              <label>Optional location context</label>
              <p className="small muted">A city and state help Called show local pay, training and people to learn from. No GPS or birthdate required. You can add other places later in <Link to="/network">Local Connections</Link>.</p>
              <div className="grid grid--2">
                <input className="input" aria-label="City" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
                <input className="input" aria-label="State" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} maxLength={30} />
                <input className="input" aria-label="ZIP code" placeholder="ZIP code (optional)" value={zip} onChange={(e) => setZip(e.target.value.replace(/[^0-9-]/g, '').slice(0, 10))} inputMode="numeric" />
              </div>
            </div>
            <label className="check">
              <input type="checkbox" checked={settings.faithLens} onChange={(e) => setSettings({ faithLens: e.target.checked })} />
              <span>
                Show faith reflections <span className="muted small">(optional biblical prompts; you can change this later)</span>
              </span>
            </label>
          </div>
          {journey ? (
            <div className="welcome__start">
              <h2 className="h3">You’re starting: {journey.goal === 'change' ? 'Change careers without starting over' : journey.door}</h2>
              <p className="muted">{journey.blurb}</p>
              <div className="row">
                <button type="button" className="btn btn--primary btn--lg" onClick={() => finish('/')}>
                  Start my journey <Icon name="arrowRight" size={18} />
                </button>
                <button type="button" className="btn btn--quiet" onClick={() => update((p) => void (p.goal = undefined))}>
                  Choose something else
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 'var(--s-7)' }}>
              <Doors
                heading="What would you like to explore today?"
                onChoose={(goal) => {
                  update((p) => void (p.goal = goal));
                  finish('/');
                }}
                onSearch={(q) => {
                  update((p) => void (p.goal = 'lookup'));
                  finish(q ? `/careers?q=${encodeURIComponent(q)}` : '/careers');
                }}
              />
              <p className="small" style={{ marginTop: 'var(--s-3)' }}>
                <button type="button" className="linkish" onClick={() => finish('/careers')}>
                  Just let me look around
                </button>
              </p>
            </div>
          )}
          <p className="small muted" style={{ marginTop: 'var(--s-5)' }}>
            <Link to="/about">Read how Called works</Link> before you begin.
          </p>
        </section>
      )}
    </div>
  );
}
