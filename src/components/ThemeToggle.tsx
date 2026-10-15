import { useStore } from '../state/store';
import type { Settings } from '../types';

const ORDER: Settings['theme'][] = ['system', 'light', 'dark'];
const LABEL: Record<Settings['theme'], string> = { system: 'Auto', light: 'Light', dark: 'Dark' };

/** Cycles Auto → Light → Dark. The icon shows the current choice. */
export function ThemeToggle() {
  const { settings, setSettings } = useStore();
  const next = ORDER[(ORDER.indexOf(settings.theme) + 1) % ORDER.length];
  return (
    <button
      type="button"
      className="btn btn--icon theme-toggle"
      onClick={() => setSettings({ theme: next })}
      aria-label={`Theme: ${LABEL[settings.theme]}. Switch to ${LABEL[next]}.`}
      title={`Theme: ${LABEL[settings.theme]}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        {settings.theme === 'light' && (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
          </>
        )}
        {settings.theme === 'dark' && <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}
        {settings.theme === 'system' && (
          <>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
          </>
        )}
      </svg>
      <span className="theme-toggle__label">{LABEL[settings.theme]}</span>
    </button>
  );
}
