import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Profile, Settings } from '../types';
import { emptyProfile } from '../lib/profile';
import {
  backupProfileSync,
  clearProfile,
  clearSettings,
  listStashed,
  loadProfile,
  loadSettings,
  loadStashed,
  removeStashed,
  requestPersistentStorage,
  saveProfile,
  saveSettings,
  stashProfile,
  type StashedSummary,
} from '../lib/storage';
import { todayKey } from '../lib/gamify';
import { syncAvailable, pushJourney } from '../lib/sync';

interface StoreValue {
  ready: boolean;
  profile: Profile;
  update: (fn: (draft: Profile) => Profile | void) => void;
  replace: (p: Profile) => void;
  reset: () => Promise<void>;
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
  saveState: 'idle' | 'saving' | 'saved';
  syncState: 'off' | 'idle' | 'syncing' | 'synced' | 'error';
  /** Other journeys saved on this device (shared computers, siblings, classrooms). */
  otherJourneys: StashedSummary[];
  switchJourney: (code: string) => Promise<boolean>;
  startNewJourney: () => Promise<void>;
  forgetJourney: (code: string) => Promise<void>;
  /** Unfinished-work helpers. */
  setDraft: (key: string, value: unknown) => void;
  clearDraft: (key: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [saveState, setSaveState] = useState<StoreValue['saveState']>('idle');
  const [syncState, setSyncState] = useState<StoreValue['syncState']>(syncAvailable ? 'idle' : 'off');
  const [otherJourneys, setOther] = useState<StashedSummary[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const syncTimer = useRef<number | undefined>(undefined);
  const latest = useRef(profile);
  const dirty = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const refreshOthers = useCallback(async (currentCode: string) => {
    setOther((await listStashed()).filter((j) => j.code !== currentCode));
  }, []);

  useEffect(() => {
    let alive = true;
    requestPersistentStorage();
    loadProfile().then((p) => {
      if (!alive) return;
      latest.current = p;
      setProfile(p);
      setReady(true);
      refreshOthers(p.code);
    });
    return () => {
      alive = false;
    };
  }, [refreshOthers]);

  const scheduleSync = useCallback((p: Profile) => {
    if (!syncAvailable || !settingsRef.current.cloudBackup) return;
    window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      setSyncState('syncing');
      pushJourney(p)
        .then(() => setSyncState('synced'))
        .catch(() => setSyncState('error'));
    }, 4000);
  }, []);

  const persist = useCallback(
    (p: Profile, immediate = false) => {
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
      scheduleSync(p);
    },
    [scheduleSync],
  );

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
        const today = todayKey();
        if (result.activeDays[result.activeDays.length - 1] !== today) {
          result.activeDays = [...result.activeDays.filter((d) => d !== today), today].slice(-400);
        }
        persist(result);
        return result;
      });
    },
    [persist],
  );

  const replace = useCallback(
    (p: Profile) => {
      latest.current = p;
      setProfile(p);
      persist(p, true);
      refreshOthers(p.code);
    },
    [persist, refreshOthers],
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
    refreshOthers(fresh.code);
  }, [refreshOthers]);

  const switchJourney = useCallback(
    async (code: string) => {
      const target = await loadStashed(code);
      if (!target) return false;
      await stashProfile(latest.current);
      await removeStashed(code);
      replace(target);
      return true;
    },
    [replace],
  );

  const startNewJourney = useCallback(async () => {
    await stashProfile(latest.current);
    replace(emptyProfile());
  }, [replace]);

  const forgetJourney = useCallback(
    async (code: string) => {
      await removeStashed(code);
      refreshOthers(latest.current.code);
    },
    [refreshOthers],
  );

  const setDraft = useCallback((key: string, value: unknown) => update((p) => void (p.drafts[key] = value)), [update]);
  const clearDraft = useCallback(
    (key: string) =>
      update((p) => {
        delete p.drafts[key];
      }),
    [update],
  );

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
    const meta = document.querySelector('meta[name="theme-color"]');
    const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    meta?.setAttribute('content', dark ? '#0C1230' : '#FFFFFF');
  }, [settings.theme]);

  const value = useMemo(
    () => ({ ready, profile, update, replace, reset, settings, setSettings, saveState, syncState, otherJourneys, switchJourney, startNewJourney, forgetJourney, setDraft, clearDraft }),
    [ready, profile, update, replace, reset, settings, setSettings, saveState, syncState, otherJourneys, switchJourney, startNewJourney, forgetJourney, setDraft, clearDraft],
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
