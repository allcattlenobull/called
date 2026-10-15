const SERVICE_URL = (import.meta.env.VITE_SYNC_URL as string | undefined)?.replace(/\/$/, '');
export const sharedReportsAvailable = !!SERVICE_URL;

const toB64Url = (bytes: Uint8Array) => {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64Url = (value: string): Uint8Array<ArrayBuffer> => {
  const raw = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='));
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
};

async function importKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export interface SharedReportLink {
  id: string;
  url: string;
  expiresAt: string;
}

/** The decryption key stays after # in the URL, so browsers never send it to the server. */
export async function createSharedReport(text: string): Promise<SharedReportLink> {
  if (!SERVICE_URL) throw new Error('Private sharing is unavailable until the sync service is configured.');
  const id = toB64Url(crypto.getRandomValues(new Uint8Array(18)));
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await importKey(rawKey), new TextEncoder().encode(text)));
  const response = await fetch(`${SERVICE_URL}/v1/shares/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ v: 1, iv: toB64Url(iv), ct: toB64Url(ciphertext) }),
  });
  if (!response.ok) throw new Error('The private link could not be created.');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const path = `${import.meta.env.BASE_URL}share/${id}`.replace(/\/+/g, '/');
  return { id, expiresAt, url: `${new URL(path, window.location.origin).toString()}#${toB64Url(rawKey)}` };
}

export async function readSharedReport(id: string, keyText: string): Promise<string> {
  if (!SERVICE_URL) throw new Error('Private sharing is not configured.');
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(id) || !/^[A-Za-z0-9_-]{40,50}$/.test(keyText)) throw new Error('This private link is incomplete.');
  const response = await fetch(`${SERVICE_URL}/v1/shares/${id}`);
  if (response.status === 404) throw new Error('This private link expired or was revoked.');
  if (!response.ok) throw new Error('This private report could not be loaded.');
  const payload = (await response.json()) as { v: number; iv: string; ct: string };
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64Url(payload.iv) }, await importKey(fromB64Url(keyText)), fromB64Url(payload.ct));
  return new TextDecoder().decode(plain);
}

export async function revokeSharedReport(id: string): Promise<void> {
  if (!SERVICE_URL) return;
  await fetch(`${SERVICE_URL}/v1/shares/${id}`, { method: 'DELETE' });
}
