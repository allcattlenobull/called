import { parseCounselorPacket, type CounselorPacket } from './counselorReports';
import { TERMS_VERSION } from './terms';

const SERVICE_URL = (import.meta.env.VITE_SYNC_URL as string | undefined)?.replace(/\/$/, '');
export const counselorAccountsAvailable = !!SERVICE_URL;
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SAVED_KEY = 'called.counselor.credentials.v1';

export interface CounselorPublicAccount {
  id: string;
  firstName: string;
  lastName: string;
  organization?: string;
  publicKey: string;
}

export interface CounselorCredentials {
  id: string;
  accessKey: string;
}

export interface CounselorSession {
  account: CounselorPublicAccount;
  credentials: CounselorCredentials;
  packets: CounselorPacket[];
}

interface WrappedKey { salt: string; iv: string; ct: string }
interface PrivateAccount extends CounselorPublicAccount { wrappedPrivateKey: WrappedKey }
interface RecordEnvelope { personId: string; updatedAt: string; encryptedKey: string; iv: string; ciphertext: string }

function randomText(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

function toB64Url(bytes: Uint8Array): string {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(value: string): Uint8Array<ArrayBuffer> {
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

async function digest(value: string): Promise<string> {
  return toB64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}

async function accessVerifier(id: string, accessKey: string): Promise<string> {
  return digest(`called-counselor-access:${id}:${accessKey}`);
}

async function shareVerifier(id: string, personId: string, shareKey: string): Promise<string> {
  return digest(`called-counselor-share:${id}:${personId}:${shareKey}`);
}

async function wrappingKey(accessKey: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(accessKey), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function wrapPrivateKey(privateKey: CryptoKey, accessKey: string): Promise<WrappedKey> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const raw = new Uint8Array(await crypto.subtle.exportKey('pkcs8', privateKey));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await wrappingKey(accessKey, salt), raw));
  return { salt: toB64Url(salt), iv: toB64Url(iv), ct: toB64Url(ct) };
}

async function unwrapPrivateKey(wrapped: WrappedKey, accessKey: string): Promise<CryptoKey> {
  const salt = fromB64Url(wrapped.salt);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64Url(wrapped.iv) }, await wrappingKey(accessKey, salt), fromB64Url(wrapped.ct));
  return crypto.subtle.importKey('pkcs8', plain, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
}

function cleanId(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^COUN/, '').replace(/^CNS/, '');
}

export function normalizeCounselorId(value: string): string | null {
  const raw = cleanId(value);
  if (raw.length !== 12 || [...raw].some((char) => !ALPHABET.includes(char))) return null;
  return `COUN-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  if (!SERVICE_URL) throw new Error('Counselor accounts are not connected in this deployment.');
  const response = await fetch(`${SERVICE_URL}${path}`, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error || `Account request failed (${response.status}).`);
  }
  return response;
}

export async function findCounselor(input: string): Promise<CounselorPublicAccount> {
  const id = normalizeCounselorId(input);
  if (!id) throw new Error('Enter a counselor ID like COUN-ABCD-2345-EFGH.');
  return api(`/v1/counselors/${id}`).then((response) => response.json() as Promise<CounselorPublicAccount>);
}

export async function createCounselorAccount(firstName: string, lastName: string, organization?: string): Promise<CounselorCredentials> {
  if (!SERVICE_URL) throw new Error('Counselor accounts are not connected in this deployment.');
  if (!firstName.trim() || !lastName.trim()) throw new Error('Enter both first and last name.');
  const keyPair = await crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
  const publicKey = toB64Url(new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey)));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = randomText(12);
    const id = `COUN-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
    const secret = randomText(24);
    const accessKey = `KEY-${secret.slice(0, 6)}-${secret.slice(6, 12)}-${secret.slice(12, 18)}-${secret.slice(18)}`;
    const response = await fetch(`${SERVICE_URL}/v1/counselors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        organization: organization?.trim() || undefined,
        verifier: await accessVerifier(id, accessKey),
        publicKey,
        wrappedPrivateKey: await wrapPrivateKey(keyPair.privateKey, accessKey),
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: new Date().toISOString(),
      }),
    });
    if (response.ok) return { id, accessKey };
    if (response.status !== 409) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error || 'Counselor account could not be created.');
    }
  }
  throw new Error('A unique counselor ID could not be created. Try again.');
}

async function decryptRecords(records: RecordEnvelope[], privateKey: CryptoKey): Promise<CounselorPacket[]> {
  const packets: CounselorPacket[] = [];
  for (const record of records) {
    try {
      const rawKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, fromB64Url(record.encryptedKey));
      const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64Url(record.iv) }, key, fromB64Url(record.ciphertext));
      packets.push(parseCounselorPacket(decoder.decode(plain)));
    } catch {
      // A malformed or stale record should not prevent the rest of a counselor's roster loading.
    }
  }
  return packets.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
}

export async function signInCounselor(credentials: CounselorCredentials): Promise<CounselorSession> {
  const id = normalizeCounselorId(credentials.id);
  if (!id || !credentials.accessKey.trim()) throw new Error('Enter your counselor ID and private access key.');
  const headers = { Authorization: `Bearer ${credentials.accessKey.trim()}` };
  const account = await api(`/v1/counselors/${id}/account`, { headers }).then((response) => response.json() as Promise<PrivateAccount>);
  let privateKey: CryptoKey;
  try {
    privateKey = await unwrapPrivateKey(account.wrappedPrivateKey, credentials.accessKey.trim());
  } catch {
    throw new Error('That counselor ID and access key do not match.');
  }
  const records = await api(`/v1/counselors/${id}/records`, { headers }).then((response) => response.json() as Promise<{ records: RecordEnvelope[] }>);
  return { account, credentials: { id, accessKey: credentials.accessKey.trim() }, packets: await decryptRecords(records.records, privateKey) };
}

export async function shareWithCounselor(packet: CounselorPacket, counselorId: string, existingShareKey?: string): Promise<{ counselor: CounselorPublicAccount; shareKey: string }> {
  const counselor = await findCounselor(counselorId);
  const shareKey = existingShareKey || `SHARE-${randomText(24)}`;
  const publicKey = await crypto.subtle.importKey('spki', fromB64Url(counselor.publicKey), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  const contentKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', contentKey));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, contentKey, encoder.encode(JSON.stringify(packet))));
  await api(`/v1/counselors/${counselor.id}/records`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Share-Key': shareKey },
    body: JSON.stringify({
      personId: packet.memberId,
      updatedAt: packet.generatedAt,
      shareVerifier: await shareVerifier(counselor.id, packet.memberId, shareKey),
      encryptedKey: toB64Url(new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawKey))),
      iv: toB64Url(iv),
      ciphertext: toB64Url(ciphertext),
    }),
  });
  return { counselor, shareKey };
}

export async function removeCounselorRecord(credentials: CounselorCredentials, personId: string): Promise<void> {
  const id = normalizeCounselorId(credentials.id);
  if (!id) return;
  await api(`/v1/counselors/${id}/records/${encodeURIComponent(personId)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${credentials.accessKey}` } });
}

export async function revokeCounselorShare(counselorId: string, personId: string, shareKey: string): Promise<void> {
  const id = normalizeCounselorId(counselorId);
  if (!id) throw new Error('That counselor ID is invalid.');
  await api(`/v1/counselors/${id}/records/${encodeURIComponent(personId)}`, { method: 'DELETE', headers: { 'X-Share-Key': shareKey } });
}

export function saveCounselorCredentials(credentials: CounselorCredentials | null): void {
  if (credentials) localStorage.setItem(SAVED_KEY, JSON.stringify(credentials));
  else localStorage.removeItem(SAVED_KEY);
}

export function loadCounselorCredentials(): CounselorCredentials | null {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_KEY) ?? 'null') as CounselorCredentials | null;
    return value && typeof value.id === 'string' && typeof value.accessKey === 'string' ? value : null;
  } catch {
    return null;
  }
}
