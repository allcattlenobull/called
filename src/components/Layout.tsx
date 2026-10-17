import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { ACCOUNT_NAV, NAV, activeGroup, activeItem, type NavItem } from './nav';
import { Logo } from './ui';
import { Celebrations } from './Game';
import { AccessibilityMenu } from './AccessibilityMenu';
import { useStore } from '../state/store';
import { hasStarted } from '../lib/profile';
import { JourneyBar } from './JourneyBar';
import { flushResearchQueue, recordResearchEvent } from '../lib/researchParticipation';

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const meRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const current = activeItem(location.pathname);
  const group = activeGroup(location.pathname);
  const { settings, profile } = useStore();
  const started = hasStarted(profile);
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  // Close the menu and move focus to the new page on navigation, so screen readers hear the change.
  useEffect(() => {
    setOpen(false);
    setMenu(null);
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

  // Dropdowns close on Escape (returning focus to their button) and on a click elsewhere.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const trigger = document.querySelector<HTMLButtonElement>(`[aria-controls="menu-${menu}"]`);
      setMenu(null);
      trigger?.focus();
    };
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node) && !meRef.current?.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [menu]);

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
          <nav className="topnav" aria-label="Primary" ref={navRef}>
            <NavLink to="/" end className="topnav__link">
              {started ? 'My journey' : 'Start here'}
            </NavLink>
            {NAV.map((g) => (
              <div key={g.id} className="topnav__group">
                <button
                  type="button"
                  className={`topnav__link topnav__trigger${group === g.id ? ' active' : ''}`}
                  aria-expanded={menu === g.id}
                  aria-controls={`menu-${g.id}`}
                  onClick={() => setMenu((m) => (m === g.id ? null : g.id))}
                >
                  {g.label}
                  <Icon name="down" size={14} aria-hidden="true" />
                </button>
                {menu === g.id && (
                  <div className="topnav__panel" id={`menu-${g.id}`}>
                    <p className="topnav__tagline">{g.tagline}</p>
                    <ul>
                      {g.items.map((item) => (
                        <li key={item.to}>
                          <MenuLink item={item} current={current} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="topbar__actions">
            <AccessibilityMenu />
            <div className="topnav__group topbar__me" ref={meRef}>
              <button
                type="button"
                className={`btn btn--quiet topbar__account${group === 'me' ? ' active' : ''}`}
                aria-expanded={menu === 'me'}
                aria-controls="menu-me"
                onClick={() => setMenu((m) => (m === 'me' ? null : 'me'))}
              >
                <Icon name="user" size={18} />
                <span>About me</span>
                <Icon name="down" size={14} aria-hidden="true" />
              </button>
              {menu === 'me' && (
                <div className="topnav__panel topnav__panel--right" id="menu-me">
                  <p className="topnav__tagline">Yours, private</p>
                  <ul>
                    {ACCOUNT_NAV.map((item) => (
                      <li key={item.to}>
                        <MenuLink item={item} current={current} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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
            <nav aria-label="All sections" className="sheet__sections">
              <ul className="sheet__nav">
                <li>
                  <NavLink to="/" end>
                    <Icon name="home" />
                    {started ? 'My journey' : 'Start here'}
                  </NavLink>
                </li>
              </ul>
              {NAV.map((g) => (
                <section key={g.id} className="sheet__group" aria-labelledby={`sheet-${g.id}`}>
                  <h2 id={`sheet-${g.id}`} className="sheet__heading">
                    {g.label} <span>{g.tagline}</span>
                  </h2>
                  <ul className="sheet__nav">
                    {g.items.map((item) => (
                      <li key={item.to}>
                        <NavLink to={item.to} end aria-current={current === item ? 'page' : undefined} className={current === item ? 'active' : ''}>
                          <Icon name={item.icon} />
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              <section className="sheet__group" aria-labelledby="sheet-account">
                <h2 id="sheet-account" className="sheet__heading">
                  About me <span>Yours, private</span>
                </h2>
                <ul className="sheet__nav">
                  {ACCOUNT_NAV.map((item) => (
                    <li key={item.to}>
                      <NavLink to={item.to} end aria-current={current === item ? 'page' : undefined} className={current === item ? 'active' : ''}>
                        <Icon name={item.icon} />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </section>
            </nav>
          </div>
        </div>
      )}

      <JourneyBar />
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
            <Icon name="lock" size={16} /> Your Called account is private and controlled by you. <Link to="/account">Open your account</Link>
          </p>
          <nav aria-label="Footer" className="footer__links">
            <Link to="/about">About</Link>
            <Link to="/research">Research and trust</Link>
            <Link to="/feedback">Give feedback</Link>
            <Link to="/helping">For parents and counselors</Link>
            <Link to="/counselor">Counselor accounts</Link>
            <Link to="/data">Privacy and data</Link>
            <Link to="/terms">Terms of use</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}

function MenuLink({ item, current }: { item: NavItem; current?: NavItem }) {
  return (
    <Link to={item.to} className={`menu-link${current === item ? ' is-current' : ''}`} aria-current={current === item ? 'page' : undefined}>
      <Icon name={item.icon} size={20} />
      <span>
        <strong>{item.label}</strong>
        <span>{item.blurb}</span>
      </span>
    </Link>
  );
}
