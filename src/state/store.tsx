import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Profile, Settings } from '../types';
import { emptyProfile } from '../lib/profile';
import { backupProfileSync, clearProfile, clearSettings, loadProfile, loadSettings, saveProfile, saveSettings } from '../lib/storage';

interface StoreValue {
  ready: boolean;
  profile: Profile;
  update: (fn: (draft: Profile) => Profile | void) => void;
  replace: (p: Profile) => void;
  reset: () => Promise<void>;
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
  saveState: 'idle' | 'saving' | 'saved';
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [saveState, setSaveState] = useState<StoreValue['saveState']>('idle');
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef(profile);

  useEffect(() => {
    let alive = true;
    loadProfile().then((p) => {
      if (!alive) return;
      latest.current = p;
      setProfile(p);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const dirty = useRef(false);

  const persist = useCallback((p: Profile, immediate = false) => {
    latest.current = p;
    dirty.current = true;
    setSaveState('saving');
    window.clearTimeout(timer.current);
    const write = () =>
      saveProfile(latest.current).then(() => {
        if (latest.current === p) dirty.current = false;
        setSaveState('saved');
      });
    if (immediate) write();
    else timer.current = window.setTimeout(write, 250);
  }, []);

  // If the tab closes before an async write finishes, keep a synchronous backup.
  useEffect(() => {
    const flush = () => {
      if (dirty.current) {
        backupProfileSync(latest.current);
        saveProfile(latest.current);
      }
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  const update = useCallback(
    (fn: (draft: Profile) => Profile | void) => {
      setProfile((prev) => {
        const draft = structuredClone(prev);
        const result = fn(draft) ?? draft;
        result.updatedAt = new Date().toISOString();
        persist(result);
        return result;
      });
    },
    [persist],
  );

  const replace = useCallback(
    (p: Profile) => {
      setProfile(p);
      persist(p, true);
    },
    [persist],
  );

  const reset = useCallback(async () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    dirty.current = false;
    await clearProfile();
    clearSettings();
    const fresh = emptyProfile();
    latest.current = fresh;
    setProfile(fresh);
    setSettingsState(loadSettings());
    setSaveState('idle');
  }, []);

  const setSettings = useCallback((s: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...s };
      saveSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const value = useMemo(
    () => ({ ready, profile, update, replace, reset, settings, setSettings, saveState }),
    [ready, profile, update, replace, reset, settings, setSettings, saveState],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function useProfile() {
  return useStore().profile;
}
