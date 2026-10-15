import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { browserSpanishAvailable, restoreDocumentEnglish, spanishReadingCopyUrl, translateDocumentToSpanish } from '../lib/pageTranslation';
import { useStore } from '../state/store';
import type { Settings } from '../types';

const THEME_LABEL: Record<Settings['theme'], string> = { system: 'Auto', light: 'Light / Claro', dark: 'Dark / Oscuro' };
const SIZE_LABEL: Record<Settings['textSize'], string> = { standard: 'Standard / Estándar', large: 'Large / Grande', xlarge: 'Extra large / Muy grande' };

export function AccessibilityMenu() {
  const { settings, setSettings } = useStore();
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [translationState, setTranslationState] = useState<'idle' | 'working' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const localTranslation = browserSpanishAvailable();

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
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
      <button type="button" className="btn btn--icon accessibility-toggle" aria-label="Accessibility options" aria-expanded={open} aria-controls="accessibility-panel" onClick={() => setOpen((value) => !value)} title="Accessibility options">
        <Icon name="accessibility" size={22} />
        <span className="accessibility-toggle__label">Accessibility</span>
      </button>
      {open && (
        <section className="accessibility-panel" id="accessibility-panel" role="dialog" aria-label="Accessibility options">
          <div className="row row--between accessibility-panel__head"><div><strong>Accessibility / Accesibilidad</strong><span className="small muted">Adjust this device / Ajustar este dispositivo</span></div><button type="button" className="btn btn--icon btn--sm" onClick={() => setOpen(false)} aria-label="Close accessibility options"><Icon name="close" size={18} /></button></div>
          <fieldset className="accessibility-setting"><legend>Appearance / Apariencia</legend><div className="segmented accessibility-options">{(['system', 'light', 'dark'] as const).map((theme) => <button type="button" key={theme} aria-pressed={settings.theme === theme} onClick={() => setSettings({ theme })}>{THEME_LABEL[theme]}</button>)}</div></fieldset>
          <fieldset className="accessibility-setting"><legend>Text size / Tamaño del texto</legend><div className="segmented accessibility-options">{(['standard', 'large', 'xlarge'] as const).map((textSize) => <button type="button" key={textSize} aria-pressed={settings.textSize === textSize} onClick={() => setSettings({ textSize })}>{SIZE_LABEL[textSize]}</button>)}</div></fieldset>
          <fieldset className="accessibility-setting"><legend>Language / Idioma</legend>
            {localTranslation ? language === 'en' ? <button type="button" className="btn btn--secondary btn--sm" disabled={translationState === 'working'} onClick={() => void translate()}>Español — translate this page</button> : <button type="button" className="btn btn--secondary btn--sm" onClick={() => { restoreDocumentEnglish(); setLanguage('en'); setProgress('Page restored to English.'); }}>English — show original</button> : <a className="btn btn--secondary btn--sm" href={spanishReadingCopyUrl()} target="_blank" rel="noreferrer">Español — open translated page</a>}
            <p className="small muted accessibility-privacy">{localTranslation ? 'Supported browsers translate on this device. A language model may download the first time.' : 'Opens a Google Translate reading copy in a new tab. Google’s privacy terms apply, and private journey data is not included.'}</p>
            {progress && <p className={`small accessibility-status${translationState === 'error' ? ' accessibility-status--error' : ''}`} role="status">{progress}</p>}
          </fieldset>
        </section>
      )}
    </div>
  );
}
