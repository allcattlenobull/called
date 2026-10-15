import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { Logo } from './ui';
import { Celebrations, LevelChip } from './Game';
import { ThemeToggle } from './ThemeToggle';
import { useStore } from '../state/store';
import { hasStarted } from '../lib/profile';
import { flushResearchQueue, recordResearchEvent } from '../lib/researchParticipation';

const PRIMARY_NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/discover', label: 'Discover', icon: 'discover' },
  { to: '/purpose', label: 'Purpose', icon: 'purpose' },
  { to: '/careers', label: 'Careers', icon: 'careers' },
  { to: '/try', label: 'Try It', icon: 'try' },
  { to: '/path', label: 'My Path', icon: 'path' },
];

const MORE_NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/compare', label: 'Compare careers', icon: 'compare' },
  { to: '/network', label: 'Connections', icon: 'purpose' },
  { to: '/about', label: 'About', icon: 'about' },
  { to: '/research', label: 'Research and trust', icon: 'about' },
  { to: '/counselor', label: 'For counselors', icon: 'path' },
];

const TABS = ['/', '/discover', '/purpose', '/careers', '/try'];

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { profile, settings } = useStore();
  const started = hasStarted(profile);
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  // Close the menu and move focus to the new page on navigation, so screen readers hear the change.
  useEffect(() => {
    setOpen(false);
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-reading', settings.readingMode);
    void flushResearchQueue(settings);
  }, [settings.productAnalytics, settings.readingMode, settings.researchParticipation]);

  useEffect(() => {
    void recordResearchEvent(settings, 'page_view', { path: location.pathname });
  }, [location.pathname, settings]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/" className="topbar__brand" aria-label="Called home">
            <Logo />
          </Link>
          <nav className="topnav" aria-label="Primary">
            {PRIMARY_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} className="topnav__link">
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="topbar__actions">
            {started && <LevelChip />}
            <ThemeToggle />
            <button type="button" className="btn btn--icon topbar__menu" aria-expanded={open} aria-controls="menu-sheet" onClick={() => setOpen(true)}>
              <Icon name="menu" />
              <span className="visually-hidden">Open menu</span>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="sheet" role="dialog" aria-modal="true" aria-label="Menu" id="menu-sheet">
          <div className="sheet__scrim" onClick={() => setOpen(false)} />
          <div className="sheet__panel">
            <div className="sheet__head">
              <Logo />
              <button type="button" className="btn btn--icon" onClick={() => setOpen(false)} autoFocus>
                <Icon name="close" />
                <span className="visually-hidden">Close menu</span>
              </button>
            </div>
            <nav aria-label="All sections">
              <ul className="sheet__nav">
                {PRIMARY_NAV.map((n) => (
                  <li key={n.to}>
                    <NavLink to={n.to} end={n.end}>
                      <Icon name={n.icon} />
                      {n.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <ul className="sheet__nav sheet__nav--secondary">
                {MORE_NAV.map((n) => (
                  <li key={n.to}>
                    <NavLink to={n.to} end={n.end}>
                      <Icon name={n.icon} />
                      {n.label}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <NavLink to="/try/experiments">
                    <Icon name="flask" />
                    Purpose experiments
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/compare/education">
                    <Icon name="compare" />
                    Education ROI
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/path/report">
                    <Icon name="print" />
                    My Called report
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/feedback">
                    <Icon name="spark" />
                    Improve Called
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/data">
                    <Icon name="lock" />
                    Your data
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/achievements">
                    <Icon name="spark" />
                    Achievements
                  </NavLink>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      <main id="main" ref={mainRef} tabIndex={-1} className="main">
        <div className="page-enter" key={location.pathname}>
          {children}
        </div>
      </main>
      <Celebrations />

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <Logo size={24} />
            <p>Discover what you’ve been given. Explore where it can take you.</p>
          </div>
          <p className="footer__privacy">
            <Icon name="lock" size={16} /> Your personal Called profile is stored on this device. <Link to="/data">Manage your data</Link>
          </p>
          <nav aria-label="Footer" className="footer__links">
            <Link to="/about">About</Link>
            <Link to="/about#sources">Data sources</Link>
            <Link to="/about#how-matching-works">How matching works</Link>
            <Link to="/research">Research and trust</Link>
            <Link to="/feedback">Give feedback</Link>
            <Link to="/counselor">For counselors</Link>
            <Link to="/data">Your data</Link>
          </nav>
        </div>
      </footer>

      <nav className="tabbar" aria-label="Quick">
        {PRIMARY_NAV.filter((n) => TABS.includes(n.to)).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="tabbar__link">
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
