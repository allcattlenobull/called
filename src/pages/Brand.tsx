import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CompassBloom, SAMPLE_DIMS } from '../components/CompassBloom';
import { Callout, Chip, Logo, OptionGroup, PageHeader, Progress, Stat } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { EvidenceBadge, FitStrip, MatchBars, OverallScore } from '../components/Match';
import { CareerCard } from '../components/CareerCard';
import { CAREER_BY_ID } from '../data/careers';
import { matchCareer } from '../lib/matching';
import { emptyProfile } from '../lib/profile';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const PALETTE = [
  { name: 'Ink', hex: '#121A3D', role: 'Text, dark surfaces', contrast: '16.9:1', text: '#fff' },
  { name: 'Cobalt', hex: '#2D3FE3', role: 'Primary action, Self dimensions', contrast: '7.2:1', text: '#fff' },
  { name: 'Lagoon', hex: '#037F78', role: 'Evidence, growth, Life dimensions', contrast: '4.9:1', text: '#fff' },
  { name: 'Iris', hex: '#6B3FD4', role: 'Purpose, reflection, Purpose dimensions', contrast: '6.4:1', text: '#fff' },
  { name: 'Spark', hex: '#FFCB2E', role: 'Highlight only, always with Ink', contrast: '11.2:1 with Ink', text: '#121A3D' },
  { name: 'Alert', hex: '#B3261E', role: 'Conflicts, destructive actions', contrast: '6.5:1', text: '#fff' },
];

const NEUTRALS = [
  { name: 'White', hex: '#FFFFFF', role: 'Page background' },
  { name: 'Mist', hex: '#F3F5FB', role: 'Subtle sections' },
  { name: 'Cloud', hex: '#E8ECF6', role: 'Tracks, inactive bars' },
  { name: 'Line', hex: '#D6DCEC', role: 'Borders' },
  { name: 'Steel', hex: '#6E7896', role: 'Decorative, large text' },
  { name: 'Slate', hex: '#4A5470', role: 'Secondary text (7.5:1)' },
];

const TYPE = [
  { token: '--fs-hero', label: 'Hero, 40 to 76px', sample: 'You don’t need it all figured out.', className: 'type-hero' },
  { token: '--fs-3xl', label: 'Page title, 36 to 42px', sample: 'Explore careers', className: 'type-3xl' },
  { token: '--fs-2xl', label: 'Section, 33px', sample: 'Try the work', className: 'type-2xl' },
  { token: '--fs-xl', label: 'Card title, 26px', sample: 'Registered nurse', className: 'type-xl' },
  { token: '--fs-lg', label: 'Lead, 21px', sample: 'Here’s what the evidence suggests.', className: 'type-lg' },
  { token: '--fs-md', label: 'Body, 17px', sample: 'Your direction can change as you learn more about yourself.', className: 'type-md' },
  { token: '--fs-sm', label: 'Secondary, 15px', sample: 'Median yearly pay in the U.S.', className: 'type-sm' },
];

const ICONS: IconName[] = ['home', 'discover', 'purpose', 'careers', 'try', 'compare', 'path', 'about', 'bookmark', 'search', 'filter', 'journal', 'flask', 'check', 'alert', 'lock', 'download', 'print'];

function sampleMatch() {
  const p = emptyProfile();
  Object.assign(p.interests, { i2: 1, i8: 1, i14: 1, i20: 1, i26: 1, i19: 1, i25: 1 });
  p.values = { income: 'essential', stability: 'important', independence: 'important', familyTime: 'essential' };
  p.lifestyle = { trainingYears: 'four', debt: 'moderate', income: 'high', remote: 'remote' };
  p.skills = { technology: 2, problemSolving: 3, math: 2 };
  return matchCareer(CAREER_BY_ID['software-developer'], p);
}

export default function Brand() {
  useDocumentTitle('Brand system');
  const [opt, setOpt] = useState<string | undefined>('maybe');
  const [chips, setChips] = useState(['help']);
  const match = sampleMatch();

  return (
    <div className="wrap brand">
      <PageHeader title="The Called brand system" lead="How Called looks, sounds and behaves. Every component on this page is the real one used in the app. The full written guide is BRAND.md in the repository." />

      <nav className="brand-toc" aria-label="On this page">
        {['Logo', 'Color', 'Type', 'Space and shape', 'Components', 'Data', 'Voice'].map((s) => (
          <a key={s} href={`#${s.toLowerCase().replace(/ /g, '-')}`}>
            {s}
          </a>
        ))}
      </nav>

      <section id="logo" className="brand-section">
        <h2>Logo: the open ring</h2>
        <div className="split split--even">
          <div>
            <p>
              An open circle with one dot beyond the opening. The ring is a whole self: gifts, values, experience. The <strong>opening</strong> is the invitation; a call reaches you from outside and asks for a response. The <strong>dot</strong> is you, stepping through. Read together it is also “C.”: a complete thought, said plainly.
            </p>
            <p className="muted">No crosses, doves, compasses, mountains, caps, bulbs or upward arrows. Faith lives in the meaning, not the clip-art. The opening always faces right, toward what’s next.</p>
          </div>
          <div className="logo-tiles">
            <div className="logo-tile logo-tile--light">
              <Logo size={40} />
            </div>
            <div className="logo-tile logo-tile--ink">
              <Logo size={40} />
            </div>
            <div className="logo-tile logo-tile--app" aria-label="App icon">
              <svg viewBox="0 0 512 512" width="88" height="88" role="img" aria-label="Called app icon">
                <rect width="512" height="512" rx="112" fill="#2D3FE3" />
                <g transform="translate(40 40) scale(9)">
                  <path d="M33.03 15.38A14 14 0 1 0 33.03 32.62" fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" />
                  <circle cx="39.5" cy="24" r="4.5" fill="#FFCB2E" />
                </g>
              </svg>
            </div>
            <div className="logo-tile logo-tile--light logo-tile--small">
              <Logo size={16} wordmark={false} />
              <span className="small muted">16px minimum</span>
            </div>
          </div>
        </div>
      </section>

      <section id="color" className="brand-section">
        <h2>Color</h2>
        <Callout tone="warn" title="Beige and beige-adjacent colors are prohibited from the Called brand system.">
          No beige, cream, tan, sand, oatmeal, ivory, parchment, taupe, warm off-white, khaki, camel, champagne, ecru or greige, and no muddy brown neutrals (for example #F5F0E6, #F4EFE6, #EEE8DC, #FAF5EA). Every neutral in Called is cool.
        </Callout>
        <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
          Core palette
        </h3>
        <div className="swatches">
          {PALETTE.map((c) => (
            <div key={c.name} className="swatch">
              <span className="swatch__chip" style={{ background: c.hex, color: c.text }}>
                Aa
              </span>
              <strong>{c.name}</strong>
              <code>{c.hex}</code>
              <span className="small muted">{c.role}</span>
              <span className="small">Contrast {c.contrast}</span>
            </div>
          ))}
        </div>
        <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
          Cool neutrals
        </h3>
        <div className="swatches swatches--neutral">
          {NEUTRALS.map((c) => (
            <div key={c.name} className="swatch">
              <span className="swatch__chip swatch__chip--neutral" style={{ background: c.hex }} />
              <strong>{c.name}</strong>
              <code>{c.hex}</code>
              <span className="small muted">{c.role}</span>
            </div>
          ))}
        </div>
        <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
          Color carries meaning, never alone
        </h3>
        <p>The compass’s eleven dimensions fall into three families. Each family keeps one color everywhere, and every colored element also has a label or number.</p>
        <div className="row">
          <span className="family-key fam-self">Self: Interests, Skills, Aptitudes, Work style</span>
          <span className="family-key fam-life">Life: Values, Lifestyle, Experience, Feedback</span>
          <span className="family-key fam-purpose">Purpose: Gifts, Service, Problems</span>
        </div>
      </section>

      <section id="type" className="brand-section">
        <h2>Typography</h2>
        <div className="grid grid--2">
          <div className="card">
            <p className="type-specimen type-specimen--display">Bricolage Grotesque</p>
            <p className="small muted">Display, headings and numbers. A contemporary grotesque with a little irregularity: confident and human, never corporate or childish.</p>
          </div>
          <div className="card">
            <p className="type-specimen">Atkinson Hyperlegible</p>
            <p className="small muted">Body and interface. Designed by the Braille Institute for legibility, with distinct letterforms that help younger readers and readers with low vision.</p>
          </div>
        </div>
        <ul className="type-scale">
          {TYPE.map((t) => (
            <li key={t.token}>
              <span className="type-scale__meta">
                <code>{t.token}</code>
                <span className="small muted">{t.label}</span>
              </span>
              <span className={t.className}>{t.sample}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="space-and-shape" className="brand-section">
        <h2>Space and shape</h2>
        <p>A 4px base unit. Radius follows hierarchy: panels are softer than cards, and buttons and chips are pills.</p>
        <div className="space-scale" aria-label="Spacing scale">
          {[4, 8, 12, 16, 24, 32, 48, 64, 96].map((n) => (
            <div key={n} className="space-scale__item">
              <span style={{ width: n, height: n }} />
              <code>{n}</code>
            </div>
          ))}
        </div>
        <div className="radius-demo">
          {[
            ['8px', 'Inputs'],
            ['12px', 'Cards'],
            ['20px', 'Panels'],
            ['28px', 'Hero'],
            ['999px', 'Buttons, chips'],
          ].map(([r, l]) => (
            <div key={r} className="radius-demo__item">
              <span style={{ borderRadius: r }} />
              <code>{r}</code>
              <span className="small muted">{l}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="components" className="brand-section">
        <h2>Components</h2>
        <h3 className="h4">Buttons</h3>
        <div className="row">
          <button type="button" className="btn btn--primary">
            Start simulation
          </button>
          <button type="button" className="btn btn--secondary">
            Save career
          </button>
          <button type="button" className="btn btn--quiet">
            How matching works
          </button>
          <button type="button" className="btn btn--danger">
            Delete my data
          </button>
        </div>
        <p className="small muted">Labels say exactly what happens. Minimum height 44px.</p>

        <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
          Chips and badges
        </h3>
        <div className="chips">
          {[
            ['help', 'Helping people'],
            ['build', 'Building and fixing'],
            ['create', 'Creating'],
          ].map(([id, label]) => (
            <Chip key={id} family="purpose" selected={chips.includes(id)} onClick={() => setChips((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))}>
              {label}
            </Chip>
          ))}
        </div>
        <div className="row" style={{ marginTop: 'var(--s-3)' }}>
          <EvidenceBadge confidence="early" />
          <EvidenceBadge confidence="growing" />
          <EvidenceBadge confidence="solid" />
          <span className="tag tag--done">
            <Icon name="check" size={14} /> Done
          </span>
          <span className="tag tag--primary">Software developer</span>
          <span className="tag tag--purpose">Purpose experiment</span>
        </div>

        <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
          Progress
        </h3>
        <div style={{ maxWidth: 420 }}>
          <Progress value={3} max={6} label="Assessments completed" />
        </div>
        <div className="stats" style={{ marginTop: 'var(--s-4)' }}>
          <Stat value={8} label="Careers explored" />
          <Stat value={4} label="Simulations completed" />
          <Stat value={2} label="Paths compared" />
        </div>
        <p className="small muted">Countable and calm. No streaks, levels or confetti.</p>

        <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
          Career card
        </h3>
        <div className="grid grid--3">
          <CareerCard career={CAREER_BY_ID['software-developer']} match={match} />
          <CareerCard career={CAREER_BY_ID['electrician']} />
        </div>

        <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
          Assessment interface
        </h3>
        <div className="card" style={{ maxWidth: 640 }}>
          <OptionGroup
            legend="Does this still sound interesting?"
            layout="row"
            value={opt}
            onChange={setOpt}
            options={[
              { value: 'definitely', label: 'Definitely' },
              { value: 'maybe', label: 'Maybe' },
              { value: 'unsure', label: 'Unsure' },
              { value: 'probablyNot', label: 'Probably not' },
            ]}
          />
        </div>

        <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
          Reflection interface
        </h3>
        <div className="panel panel--purpose" style={{ maxWidth: 640 }}>
          <p className="journal-prompt">What kind of work gives you energy?</p>
          <textarea className="textarea" aria-label="Sample reflection" defaultValue="Fixing the youth group’s sound system. I lost track of time." />
        </div>

        <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
          Callouts
        </h3>
        <div className="stack" style={{ maxWidth: 640 }}>
          <Callout title="Info">Neutral guidance and context.</Callout>
          <Callout tone="evidence" title="Evidence">Something you’ve learned.</Callout>
          <Callout tone="purpose" title="Purpose">Faith and reflection framing.</Callout>
          <Callout tone="warn" title="Potential conflict">A tension worth thinking through.</Callout>
        </div>
      </section>

      <section id="data" className="brand-section">
        <h2>Data visualization</h2>
        <div className="split split--even">
          <div className="card">
            <CompassBloom dims={SAMPLE_DIMS} labels size={420} />
            <p className="small muted">The Purpose Compass bloom: petal length is strength, depth of color is evidence, dashed petals are unexplored.</p>
          </div>
          <div className="card stack">
            <div className="row row--between">
              <OverallScore match={match} />
              <FitStrip match={match} />
            </div>
            <MatchBars match={match} />
            <p className="small muted">Bars over pies. Missing evidence is a dashed track, never a zero. Money is shown as ranges.</p>
          </div>
        </div>
        <h3 className="h4" style={{ marginTop: 'var(--s-5)' }}>
          Icons
        </h3>
        <p className="small muted">24px grid, 2px stroke, round caps and joins, drawn to match the ring. Always paired with a text label in navigation.</p>
        <div className="icon-grid">
          {ICONS.map((i) => (
            <span key={i} className="icon-grid__item">
              <Icon name={i} size={24} />
              <code>{i}</code>
            </span>
          ))}
        </div>
      </section>

      <section id="voice" className="brand-section">
        <h2>Voice</h2>
        <p>Warm, thoughtful, intelligent, encouraging, grounded, clear. Never patronizing.</p>
        <div className="grid grid--2">
          <div className="card">
            <h3 className="h4">Say</h3>
            <ul className="checklist">
              {['Here’s what the evidence suggests.', 'Here’s something worth exploring.', 'You may want to test this.', 'Here’s what you’ve learned so far.', 'Your direction can change as you learn more.'].map((s) => (
                <li key={s}>
                  <Icon name="check" size={16} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 className="h4">Don’t say</h3>
            <ul className="voice-dont">
              {['You were born to be a…', 'Follow your passion and everything will work out.', 'This is your perfect career.', 'God wants you to become a nurse.', 'Your results are in!'].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <p style={{ marginTop: 'var(--s-5)' }}>
          <Link to="/about">Read about the philosophy behind Called</Link>
        </p>
      </section>
    </div>
  );
}
