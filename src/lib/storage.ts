/**
 * Local-only persistence. The profile lives in IndexedDB on this device, with a localStorage
 * fallback for browsers or modes where IndexedDB is unavailable (some private windows).
 * Nothing here ever makes a network request.
 */
import type { Profile, Settings } from '../types';
import { DEFAULT_SETTINGS, normalizeProfile } from './profile';

const DB_NAME = 'called';
const STORE = 'kv';
const PROFILE_KEY = 'profile';
const LS_PROFILE = 'called.profile';
const LS_SETTINGS = 'called.settings';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB unavailable'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked: the app keeps working in memory */
  }
}
function lsRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export async function loadProfile(): Promise<Profile> {
  let fromDb: Profile | undefined;
  try {
    fromDb = await idbGet<Profile>(PROFILE_KEY);
  } catch {
    /* IndexedDB unavailable: fall back to localStorage */
  }
  let fromLs: Profile | undefined;
  const raw = lsGet(LS_PROFILE);
  if (raw) {
    try {
      fromLs = JSON.parse(raw) as Profile;
    } catch {
      /* corrupted backup: ignore */
    }
  }
  // A synchronous backup is written when the tab closes mid-save, so prefer whichever is newer.
  const newest = fromDb && fromLs ? (String(fromLs.updatedAt) > String(fromDb.updatedAt) ? fromLs : fromDb) : (fromDb ?? fromLs);
  return normalizeProfile(newest ?? null);
}

/** Synchronous last-chance save used when the page is closing before an async write finishes. */
export function backupProfileSync(p: Profile) {
  lsSet(LS_PROFILE, JSON.stringify(p));
}

export async function saveProfile(p: Profile): Promise<void> {
  try {
    await idbSet(PROFILE_KEY, p);
    lsRemove(LS_PROFILE);
  } catch {
    lsSet(LS_PROFILE, JSON.stringify(p));
  }
}

export async function clearProfile(): Promise<void> {
  try {
    await idbDelete(PROFILE_KEY);
  } catch {
    /* ignore */
  }
  lsRemove(LS_PROFILE);
}

/* ---------- Several journeys on one device ---------- */

const STASH_INDEX = 'stash:index';
const LS_STASH = 'called.stash.';

export interface StashedSummary {
  code: string;
  name?: string;
  updatedAt: string;
}

async function readIndex(): Promise<StashedSummary[]> {
  try {
    return (await idbGet<StashedSummary[]>(STASH_INDEX)) ?? [];
  } catch {
    const raw = lsGet(`${LS_STASH}index`);
    return raw ? (JSON.parse(raw) as StashedSummary[]) : [];
  }
}

async function writeIndex(list: StashedSummary[]) {
  try {
    await idbSet(STASH_INDEX, list);
  } catch {
    lsSet(`${LS_STASH}index`, JSON.stringify(list));
  }
}

/** Keep a journey on this device while another one is active. */
export async function stashProfile(p: Profile): Promise<void> {
  const hasContent = p.onboarded || Object.keys(p.completed).length > 0 || p.journal.length > 0 || p.saved.length > 0 || p.simulations.length > 0;
  if (!hasContent) return;
  try {
    await idbSet(`stash:${p.code}`, p);
  } catch {
    lsSet(`${LS_STASH}${p.code}`, JSON.stringify(p));
  }
  const list = (await readIndex()).filter((x) => x.code !== p.code);
  list.unshift({ code: p.code, name: p.name, updatedAt: p.updatedAt });
  await writeIndex(list.slice(0, 20));
}

export async function loadStashed(code: string): Promise<Profile | null> {
  try {
    const p = await idbGet<Profile>(`stash:${code}`);
    if (p) return normalizeProfile(p);
  } catch {
    /* fall back */
  }
  const raw = lsGet(`${LS_STASH}${code}`);
  return raw ? normalizeProfile(JSON.parse(raw)) : null;
}

export async function removeStashed(code: string): Promise<void> {
  try {
    await idbDelete(`stash:${code}`);
  } catch {
    /* ignore */
  }
  lsRemove(`${LS_STASH}${code}`);
  await writeIndex((await readIndex()).filter((x) => x.code !== code));
}

export async function listStashed(): Promise<StashedSummary[]> {
  return readIndex();
}

/** Ask the browser not to evict Called’s data when storage runs low. Silently ignored if unsupported. */
export function requestPersistentStorage() {
  try {
    navigator.storage?.persist?.();
  } catch {
    /* ignore */
  }
}

export function loadSettings(): Settings {
  const raw = lsGet(LS_SETTINGS);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  lsSet(LS_SETTINGS, JSON.stringify(s));
}

export function clearSettings() {
  lsRemove(LS_SETTINGS);
}

/* ---------- Export and import ---------- */

export interface JourneyFile {
  app: 'called';
  kind: 'journey';
  exportedAt: string;
  profile: Profile;
}

export function exportJourney(p: Profile): string {
  const file: JourneyFile = { app: 'called', kind: 'journey', exportedAt: new Date().toISOString(), profile: p };
  return JSON.stringify(file, null, 2);
}

export function parseJourney(text: string): Profile {
  const data = JSON.parse(text) as Partial<JourneyFile>;
  if (data.app !== 'called' || data.kind !== 'journey' || !data.profile) {
    throw new Error('This file isn’t a Called journey export.');
  }
  return normalizeProfile(data.profile);
}
