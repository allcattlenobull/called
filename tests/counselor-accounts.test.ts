import { afterEach, describe, expect, it, vi } from 'vitest';
// The production Worker is intentionally plain JavaScript so Wrangler can deploy it without a build step.
// @ts-expect-error no declaration file for the Worker module
import worker from '../server/sync-worker/src/index.js';
import { createCounselorPacket } from '../src/lib/counselorReports';
import { emptyProfile } from '../src/lib/profile';

class MemoryKv {
  values = new Map<string, string>();
  async get(key: string, type?: string) { const value = this.values.get(key) ?? null; return value && type === 'json' ? JSON.parse(value) : value; }
  async put(key: string, value: string) { this.values.set(key, value); }
  async delete(key: string) { this.values.delete(key); }
  async list({ prefix = '' }: { prefix?: string }) { return { keys: [...this.values.keys()].filter((key) => key.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; }
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('encrypted counselor accounts', () => {
  it('creates an account and decrypts only reports shared to that counselor', async () => {
    vi.stubEnv('VITE_SYNC_URL', 'https://accounts.called.test');
    const env = { JOURNEYS: new MemoryKv(), ALLOWED_ORIGINS: '' };
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => worker.fetch(new Request(input, init), env));
    const accounts = await import('../src/lib/counselorAccounts');

    const credentials = await accounts.createCounselorAccount('Avery', 'Morgan', 'North High');
    expect(credentials.id).toMatch(/^COUN(?:-[2-9A-HJ-NP-TV-Z]{4}){3}$/);
    expect((await accounts.signInCounselor(credentials)).packets).toEqual([]);

    const profile = emptyProfile();
    profile.name = 'Jordan';
    profile.lastName = 'Lee';
    const packet = createCounselorPacket(profile, true);
    const shared = await accounts.shareWithCounselor(packet, credentials.id);
    expect(shared.counselor).toMatchObject({ firstName: 'Avery', lastName: 'Morgan' });

    const session = await accounts.signInCounselor(credentials);
    expect(session.packets).toHaveLength(1);
    expect(session.packets[0]).toMatchObject({ firstName: 'Jordan', lastName: 'Lee', memberId: profile.memberId });
    expect(JSON.stringify(session.packets[0])).not.toContain(profile.code);
    await accounts.revokeCounselorShare(credentials.id, profile.memberId, shared.shareKey);
    expect((await accounts.signInCounselor(credentials)).packets).toEqual([]);
  });
});
