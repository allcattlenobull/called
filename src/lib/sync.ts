/**
 * Optional cross-device restore with a journey code.
 *
 * The journey is encrypted in the browser with a key derived from the code (PBKDF2 → AES-GCM)
 * before it is sent. The server only ever sees a random-looking ID (a hash of the code) and
 * ciphertext, so neither the server nor anyone running it can read a user's answers.
 * Losing the code means losing access to the backup; there is no recovery by design.
 *
 * Enabled only when the site is built with VITE_SYNC_URL (see server/sync-worker/README.md).
 */
import type { Profile } from '../types';
import { normalizeCode, normalizeProfile } from './profile';

const SYNC_URL = (import.meta.env.VITE_SYNC_URL as string | undefined)?.replace(/\/$/, '');
export const syncAvailable = !!SYNC_URL;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(atob(b64).length));
  const bin = atob(b64);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** The lookup ID never reveals the code: it’s a SHA-256 hash with a fixed prefix. */
export async function journeyId(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`called-id:${code}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function keyFor(code: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('called-journey-v1'), iterations: 210000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptJourney(p: Profile): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFor(p.code);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(p))));
  return JSON.stringify({ v: 1, iv: toB64(iv), ct: toB64(ct) });
}

export async function decryptJourney(code: string, payload: string): Promise<Profile> {
  const { iv, ct } = JSON.parse(payload) as { iv: string; ct: string };
  const key = await keyFor(code);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(ct));
  return normalizeProfile(JSON.parse(dec.decode(plain)));
}

export async function pushJourney(p: Profile): Promise<void> {
  if (!SYNC_URL) return;
  const id = await journeyId(p.code);
  const res = await fetch(`${SYNC_URL}/v1/journeys/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: await encryptJourney(p) });
  if (!res.ok) throw new Error(`Backup failed (${res.status})`);
}

export type PullResult = { ok: true; profile: Profile } | { ok: false; reason: 'invalid' | 'notFound' | 'unavailable' | 'error' };

export async function pullJourney(input: string): Promise<PullResult> {
  const code = normalizeCode(input);
  if (!code) return { ok: false, reason: 'invalid' };
  if (!SYNC_URL) return { ok: false, reason: 'unavailable' };
  try {
    const res = await fetch(`${SYNC_URL}/v1/journeys/${await journeyId(code)}`);
    if (res.status === 404) return { ok: false, reason: 'notFound' };
    if (!res.ok) return { ok: false, reason: 'error' };
    const profile = await decryptJourney(code, await res.text());
    profile.code = code;
    return { ok: true, profile };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function deleteRemoteJourney(code: string): Promise<void> {
  if (!SYNC_URL) return;
  await fetch(`${SYNC_URL}/v1/journeys/${await journeyId(code)}`, { method: 'DELETE' }).catch(() => undefined);
}
