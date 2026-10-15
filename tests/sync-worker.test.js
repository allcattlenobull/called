import { describe, expect, it } from 'vitest';
import worker from '../server/sync-worker/src/index.js';

class MemoryKv {
  values = new Map();
  async get(key, type) {
    const value = this.values.get(key) ?? null;
    return value && type === 'json' ? JSON.parse(value) : value;
  }
  async put(key, value) { this.values.set(key, value); }
  async delete(key) { this.values.delete(key); }
  async list({ prefix = '' }) {
    return { keys: [...this.values.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
  }
}

const b64url = (bytes) => Buffer.from(bytes).toString('base64url');
const digest = async (value) => b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
const call = (env, path, init) => worker.fetch(new Request(`https://accounts.called.test${path}`, init), env);

describe('counselor account worker', () => {
  it('protects a counselor roster and accepts only authorized student updates', async () => {
    const env = { JOURNEYS: new MemoryKv(), ALLOWED_ORIGINS: 'https://allcattlenobull.github.io' };
    const id = 'COUN-ABCD-2345-EFGH';
    const accessKey = 'KEY-234567-89ABCD-EFGHJK-MNPQRS';
    const verifier = await digest(`called-counselor-access:${id}:${accessKey}`);
    const create = await call(env, '/v1/counselors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, firstName: 'Avery', lastName: 'Morgan', organization: 'North High', verifier, publicKey: 'A'.repeat(400), wrappedPrivateKey: { salt: 'A'.repeat(22), iv: 'A'.repeat(16), ct: 'A'.repeat(200) } }) });
    expect(create.status).toBe(201);

    const publicAccount = await (await call(env, `/v1/counselors/${id}`)).json();
    expect(publicAccount).toMatchObject({ id, firstName: 'Avery', lastName: 'Morgan' });
    expect(publicAccount).not.toHaveProperty('verifier');
    expect((await call(env, `/v1/counselors/${id}/account`)).status).toBe(401);
    expect((await call(env, `/v1/counselors/${id}/account`, { headers: { Authorization: `Bearer ${accessKey}` } })).status).toBe(200);

    const personId = 'CLD-2345-6789-ABCD';
    const shareKey = 'SHARE-23456789ABCDEFGHJKMNPQRS';
    const shareVerifier = await digest(`called-counselor-share:${id}:${personId}:${shareKey}`);
    const record = { personId, updatedAt: new Date().toISOString(), shareVerifier, encryptedKey: 'A'.repeat(350), iv: 'A'.repeat(16), ciphertext: 'A'.repeat(80) };
    expect((await call(env, `/v1/counselors/${id}/records`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Share-Key': shareKey }, body: JSON.stringify(record) })).status).toBe(200);
    expect((await call(env, `/v1/counselors/${id}/records`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Share-Key': 'SHARE-WRONG-WRONG-WRONG-WRONG' }, body: JSON.stringify(record) })).status).toBe(403);

    const roster = await (await call(env, `/v1/counselors/${id}/records`, { headers: { Authorization: `Bearer ${accessKey}` } })).json();
    expect(roster.records).toHaveLength(1);
    expect(roster.records[0]).not.toHaveProperty('shareVerifier');
    expect((await call(env, `/v1/counselors/${id}/records/${personId}`, { method: 'DELETE', headers: { 'X-Share-Key': shareKey } })).status).toBe(200);
    expect((await call(env, `/v1/counselors/${id}/records`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Share-Key': shareKey }, body: JSON.stringify(record) })).status).toBe(200);
    expect((await call(env, `/v1/counselors/${id}/records/${personId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessKey}` } })).status).toBe(200);
  });
});
