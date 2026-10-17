import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { browserSpanishAvailable, restoreDocumentEnglish, spanishReadingCopyUrl, translateDocumentToSpanish } from '../lib/pageTranslation';
import { useStore } from '../state/store';
import type { Settings } from '../types';

const THEMES: { value: Settings['theme']; en: string; es: string; icon: 'contrast' | 'sun' | 'moon'; name: string }[] = [
  { value: 'system', en: 'Auto', es: 'Automático', icon: 'contrast', name: 'Auto' },
  { value: 'light', en: 'Light', es: 'Claro', icon: 'sun', name: 'Light / Claro' },
  { value: 'dark', en: 'Dark', es: 'Oscuro', icon: 'moon', name: 'Dark / Oscuro' },
];
const SIZES: { value: Settings['textSize']; en: string; es: string; scale: number; name: string }[] = [
  { value: 'standard', en: 'Standard', es: 'Estándar', scale: 1, name: 'Standard / Estándar' },
  { value: 'large', en: 'Large', es: 'Grande', scale: 1.25, name: 'Large / Grande' },
  { value: 'xlarge', en: 'Extra large', es: 'Muy grande', scale: 1.5, name: 'Extra large / Muy grande' },
];

export function AccessibilityMenu() {
  const { settings, setSettings } = useStore();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [translationState, setTranslationState] = useState<'idle' | 'working' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 72, right: 16 });
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const localTranslation = browserSpanishAvailable();

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  };

  // The header uses a backdrop blur, which traps fixed children; the panel is portaled to <body>
  // and placed under the toggle (a bottom sheet on phones, via CSS).
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = toggleRef.current?.getBoundingClientRect();
      if (r) setPos({ top: Math.round(r.bottom + 10), right: Math.max(12, Math.round(window.innerWidth - r.right)) });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      const t = event.target as Node;
      if (!menuRef.current?.contains(t) && !panelRef.current?.contains(t)) close(false);
    };
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab' && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')];
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keys);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', keys); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const translate = async () => {
    setTranslationState('working');
    setProgress('Preparing the Spanish translation…');
    try {
      const translated = await translateDocumentToSpanish((done, total) => setProgress(`Translating ${done} of ${total} text sections…`));
      if (!translated) throw new Error('unsupported');
      setLanguage('es');
      setProgress('Page translated to Spanish. Automated translations may contain errors.');
      setTranslationState('idle');
    } catch {
      setTranslationState('error');
      setProgress('In-page translation is unavailable in this browser. Use the Spanish reading copy instead.');
    }
  };

  return (
    <div className="accessibility-control notranslate" ref={menuRef} data-no-translate>
      <button ref={toggleRef} type="button" className="btn btn--quiet topbar__tool" aria-label="Accessibility options" aria-expanded={open} aria-controls="accessibility-panel" onClick={() => setOpen((value) => !value)}>
        <Icon name="accessibility" size={20} />
        <span className="topbar__tool-label">Accessibility</span>
      </button>
      {open && createPortal(
        <div className="a11y-layer notranslate" data-no-translate>
          <div className="a11y-scrim" aria-hidden="true" onClick={() => close()} />
          <section ref={panelRef} className="a11y-panel" id="accessibility-panel" role="dialog" aria-label="Accessibility options" style={{ ['--a11y-top' as string]: `${pos.top}px`, ['--a11y-right' as string]: `${pos.right}px` }}>
            <header className="a11y-panel__head">
              <div>
                <h2 className="a11y-panel__title">Accessibility</h2>
                <span className="a11y-panel__sub">Accesibilidad · saved on this device</span>
              </div>
              <button type="button" className="btn btn--icon btn--sm a11y-panel__close" onClick={() => close()} aria-label="Close accessibility options">
                <Icon name="close" size={18} />
              </button>
            </header>

            <fieldset className="a11y-group">
              <legend>
                Appearance <span>Apariencia</span>
              </legend>
              <div className="a11y-tiles">
                {THEMES.map((t) => (
                  <button type="button" key={t.value} className="a11y-tile" aria-label={t.name} aria-pressed={settings.theme === t.value} onClick={() => setSettings({ theme: t.value })}>
                    <Icon name={t.icon} size={22} />
                    <span className="a11y-tile__en">{t.en}</span>
                    <span className="a11y-tile__es">{t.es}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="a11y-group">
              <legend>
                Text size <span>Tamaño del texto</span>
              </legend>
              <div className="a11y-tiles">
                {SIZES.map((t) => (
                  <button type="button" key={t.value} className="a11y-tile" aria-label={t.name} aria-pressed={settings.textSize === t.value} onClick={() => setSettings({ textSize: t.value })}>
                    <span className="a11y-tile__sample" style={{ fontSize: `${t.scale * 1.05}rem` }} aria-hidden="true">
                      Aa
                    </span>
                    <span className="a11y-tile__en">{t.en}</span>
                    <span className="a11y-tile__es">{t.es}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="a11y-group">
              <legend>
                Language <span>Idioma</span>
              </legend>
              <div className="a11y-lang">
                <button type="button" className="a11y-lang__opt" aria-pressed={language === 'en'} aria-label={language === 'es' ? 'English — show original' : 'English'} onClick={() => { if (language === 'es') { restoreDocumentEnglish(); setLanguage('en'); setProgress('Page restored to English.'); } }}>
                  English
                </button>
                {localTranslation ? (
                  <button type="button" className="a11y-lang__opt" aria-pressed={language === 'es'} aria-label="Español — translate this page" disabled={translationState === 'working'} onClick={() => language === 'en' && void translate()}>
                    <Icon name="globe" size={16} /> Español
                  </button>
                ) : (
                  <a className="a11y-lang__opt" href={spanishReadingCopyUrl()} target="_blank" rel="noreferrer" aria-label="Español — open translated page">
                    <Icon name="globe" size={16} /> Español <Icon name="external" size={14} />
                  </a>
                )}
              </div>
              <p className="a11y-note">{localTranslation ? 'Your browser translates on this device. A language model may download the first time.' : 'Opens a Google Translate copy in a new tab. Google’s privacy terms apply; your private journey data isn’t included.'}</p>
              {progress && <p className={`a11y-note a11y-status${translationState === 'error' ? ' a11y-status--error' : ''}`} role="status">{progress}</p>}
            </fieldset>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
