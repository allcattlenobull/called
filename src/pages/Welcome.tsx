import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../state/store';
import { CompassBloom, SAMPLE_DIMS } from '../components/CompassBloom';
import { OptionGroup } from '../components/ui';
import { Icon } from '../components/Icon';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { RestoreForm } from '../components/JourneyCode';
import type { Profile } from '../types';

const EVIDENCE = ['who you are', 'what you value', 'what you’re good at', 'what you’re curious about', 'what kind of life you want', 'and what work might fit'];

export default function Welcome() {
  useDocumentTitle('Welcome');
  const { profile, update, settings, setSettings } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState(profile.name ?? '');
  const [lastName, setLastName] = useState(profile.lastName ?? '');
  const [stage, setStage] = useState<Profile['stage']>(profile.stage);
  const [city, setCity] = useState(profile.location?.city ?? '');
  const [state, setState] = useState(profile.location?.state ?? '');
  const [zip, setZip] = useState(profile.location?.zip ?? '');

  const finish = (to: string) => {
    update((p) => {
      p.onboarded = true;
      p.name = name.trim() || undefined;
      p.lastName = lastName.trim() || undefined;
      p.stage = stage;
      if (city.trim() || state.trim() || zip.trim()) p.location = { city: city.trim() || undefined, state: state.trim().toUpperCase() || undefined, zip: zip.trim() || undefined, considering: p.location?.considering ?? [] };
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
              <strong className="callout__title">Your private Called account</strong>
              No email or ordinary password is required. Your journey code is the private key to your results, and you can export, move or delete them anytime.
            </div>
          </div>
          <details className="restore-details">
            <summary>Coming back? Enter your journey code</summary>
            <RestoreForm />
          </details>
          <div className="runner__nav">
            <span />
            <button type="button" className="btn btn--primary btn--lg" onClick={() => setStep(1)}>
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
          <h2 className="h3" style={{ marginTop: 'var(--s-7)' }}>
            How do you want to begin?
          </h2>
          <div className="grid grid--2 welcome__choices">
            <button type="button" className="choice-card" onClick={() => finish('/discover/interests')}>
              <span className="choice-card__title">Build my Purpose Compass</span>
              <span className="choice-card__text">Start with a 4-minute interests check, then keep going at your own pace.</span>
              <span className="choice-card__go">
                Start with interests <Icon name="arrowRight" size={16} />
              </span>
            </button>
            <button type="button" className="choice-card" onClick={() => finish('/careers')}>
              <span className="choice-card__title">Start exploring now</span>
              <span className="choice-card__text">Browse careers, read reality checks, and try simulations. Add evidence whenever you want.</span>
              <span className="choice-card__go">
                Browse careers <Icon name="arrowRight" size={16} />
              </span>
            </button>
          </div>
          <p className="small muted" style={{ marginTop: 'var(--s-5)' }}>
            <Link to="/about">Read how Called works</Link> before you begin.
          </p>
        </section>
      )}
    </div>
  );
}
