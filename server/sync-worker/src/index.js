/**
 * Called journey sync: a tiny Cloudflare Worker that stores encrypted journeys.
 *
 * It never receives a journey code or readable data. Clients send:
 *   - an ID: SHA-256 of the code (64 hex characters)
 *   - a body: AES-GCM ciphertext produced in the browser
 *
 * The same worker also stores seven-day encrypted report links and explicitly
 * consented, de-identified research events. Research never uses a journey code.
 */
const MAX_BYTES = 512 * 1024;
const TTL_SECONDS = 60 * 60 * 24 * 730;
const SHARE_TTL_SECONDS = 60 * 60 * 24 * 7;
const ID_RE = /^[0-9a-f]{64}$/;
const SHARE_ID_RE = /^[A-Za-z0-9_-]{20,40}$/;
const PARTICIPANT_RE = /^[0-9a-f]{32}$/;
const COUNSELOR_ID_RE = /^COUN(?:-[2-9A-HJ-NP-TV-Z]{4}){3}$/;
const MEMBER_ID_RE = /^CLD(?:-[2-9A-HJ-NP-TV-Z]{4}){3}$/;
const RESEARCH_KINDS = new Set(['simulation_completion', 'simulation_outcome', 'follow_up', 'page_view', 'usability_feedback']);

function cors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.length === 0 || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin || '*' : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Share-Key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function toB64Url(bytes) {
  let raw = '';
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function digest(value) {
  return toB64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))));
}

function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}

async function counselorAuthorized(request, account) {
  const header = request.headers.get('Authorization') || '';
  const accessKey = header.startsWith('Bearer ') ? header.slice(7) : '';
  return accessKey.length >= 28 && sameSecret(account.verifier, await digest(`called-counselor-access:${account.id}:${accessKey}`));
}

function validWrappedKey(value) {
  return value && typeof value === 'object' && /^[A-Za-z0-9_-]{20,30}$/.test(value.salt) && /^[A-Za-z0-9_-]{16,24}$/.test(value.iv) && /^[A-Za-z0-9_-]{100,5000}$/.test(value.ct);
}

function reply(body, status, headers) {
  return new Response(body, { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });
}

export default {
  async fetch(request, env) {
    const headers = cors(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    const url = new URL(request.url);

    // Simple per-IP throttle using the optional Rate Limiting binding.
    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return reply('{"error":"slow down"}', 429, headers);
    }

    if (url.pathname === '/v1/counselors' && request.method === 'POST') {
      const text = await request.text();
      if (text.length > 16 * 1024) return reply('{"error":"too large"}', 413, headers);
      let account;
      try { account = JSON.parse(text); } catch { return reply('{"error":"bad body"}', 400, headers); }
      if (!COUNSELOR_ID_RE.test(account.id) || typeof account.firstName !== 'string' || !account.firstName.trim() || account.firstName.length > 80 || typeof account.lastName !== 'string' || !account.lastName.trim() || account.lastName.length > 100 || (account.organization !== undefined && (typeof account.organization !== 'string' || account.organization.length > 160)) || !/^[A-Za-z0-9_-]{40,50}$/.test(account.verifier) || !/^[A-Za-z0-9_-]{300,1000}$/.test(account.publicKey) || !validWrappedKey(account.wrappedPrivateKey)) {
        return reply('{"error":"invalid counselor account"}', 400, headers);
      }
      const key = `counselor:${account.id}`;
      if (await env.JOURNEYS.get(key)) return reply('{"error":"counselor ID already exists"}', 409, headers);
      await env.JOURNEYS.put(key, JSON.stringify({ ...account, firstName: account.firstName.trim(), lastName: account.lastName.trim(), organization: account.organization?.trim() || undefined, createdAt: new Date().toISOString() }));
      return reply(JSON.stringify({ ok: true, id: account.id }), 201, headers);
    }

    const counselorPublic = url.pathname.match(/^\/v1\/counselors\/(COUN-[^/]+)$/);
    if (counselorPublic && request.method === 'GET') {
      if (!COUNSELOR_ID_RE.test(counselorPublic[1])) return reply('{"error":"invalid counselor ID"}', 400, headers);
      const account = await env.JOURNEYS.get(`counselor:${counselorPublic[1]}`, 'json');
      if (!account) return reply('{"error":"counselor account not found"}', 404, headers);
      return reply(JSON.stringify({ id: account.id, firstName: account.firstName, lastName: account.lastName, organization: account.organization, publicKey: account.publicKey }), 200, headers);
    }

    const counselorAccount = url.pathname.match(/^\/v1\/counselors\/(COUN-[^/]+)\/account$/);
    if (counselorAccount && request.method === 'GET') {
      if (!COUNSELOR_ID_RE.test(counselorAccount[1])) return reply('{"error":"invalid counselor ID"}', 400, headers);
      const account = await env.JOURNEYS.get(`counselor:${counselorAccount[1]}`, 'json');
      if (!account || !(await counselorAuthorized(request, account))) return reply('{"error":"counselor ID or access key is incorrect"}', 401, headers);
      return reply(JSON.stringify({ id: account.id, firstName: account.firstName, lastName: account.lastName, organization: account.organization, publicKey: account.publicKey, wrappedPrivateKey: account.wrappedPrivateKey }), 200, headers);
    }

    const counselorRecords = url.pathname.match(/^\/v1\/counselors\/(COUN-[^/]+)\/records$/);
    if (counselorRecords) {
      const counselorId = counselorRecords[1];
      if (!COUNSELOR_ID_RE.test(counselorId)) return reply('{"error":"invalid counselor ID"}', 400, headers);
      const account = await env.JOURNEYS.get(`counselor:${counselorId}`, 'json');
      if (!account) return reply('{"error":"counselor account not found"}', 404, headers);
      if (request.method === 'GET') {
        if (!(await counselorAuthorized(request, account))) return reply('{"error":"counselor ID or access key is incorrect"}', 401, headers);
        const listed = await env.JOURNEYS.list({ prefix: `counselor-record:${counselorId}:`, limit: 1000 });
        const records = await Promise.all(listed.keys.map((entry) => env.JOURNEYS.get(entry.name, 'json')));
        return reply(JSON.stringify({ records: records.filter(Boolean).map(({ shareVerifier: _, ...record }) => record) }), 200, headers);
      }
      if (request.method === 'PUT') {
        const text = await request.text();
        if (text.length > MAX_BYTES) return reply('{"error":"too large"}', 413, headers);
        let record;
        try { record = JSON.parse(text); } catch { return reply('{"error":"bad body"}', 400, headers); }
        const shareKey = request.headers.get('X-Share-Key') || '';
        if (!MEMBER_ID_RE.test(record.personId) || Number.isNaN(Date.parse(record.updatedAt)) || !/^[A-Za-z0-9_-]{40,50}$/.test(record.shareVerifier) || !/^[A-Za-z0-9_-]{300,500}$/.test(record.encryptedKey) || !/^[A-Za-z0-9_-]{16,24}$/.test(record.iv) || !/^[A-Za-z0-9_-]{40,700000}$/.test(record.ciphertext) || shareKey.length < 24) return reply('{"error":"invalid shared report"}', 400, headers);
        const key = `counselor-record:${counselorId}:${record.personId}`;
        const previous = await env.JOURNEYS.get(key, 'json');
        const expected = await digest(`called-counselor-share:${counselorId}:${record.personId}:${shareKey}`);
        if (!sameSecret(expected, previous?.shareVerifier ?? record.shareVerifier)) return reply('{"error":"this shared report cannot be updated with that key"}', 403, headers);
        await env.JOURNEYS.put(key, JSON.stringify(record));
        return reply('{"ok":true}', 200, headers);
      }
      return reply('{"error":"method not allowed"}', 405, headers);
    }

    const counselorRecord = url.pathname.match(/^\/v1\/counselors\/(COUN-[^/]+)\/records\/(CLD-[^/]+)$/);
    if (counselorRecord && request.method === 'DELETE') {
      const [, counselorId, personId] = counselorRecord;
      if (!COUNSELOR_ID_RE.test(counselorId) || !MEMBER_ID_RE.test(personId)) return reply('{"error":"invalid record"}', 400, headers);
      const account = await env.JOURNEYS.get(`counselor:${counselorId}`, 'json');
      if (!account) return reply('{"error":"counselor account not found"}', 404, headers);
      let authorized = await counselorAuthorized(request, account);
      if (!authorized) {
        const record = await env.JOURNEYS.get(`counselor-record:${counselorId}:${personId}`, 'json');
        const shareKey = request.headers.get('X-Share-Key') || '';
        if (record && shareKey.length >= 24) authorized = sameSecret(record.shareVerifier, await digest(`called-counselor-share:${counselorId}:${personId}:${shareKey}`));
      }
      if (!authorized) return reply('{"error":"unauthorized"}', 401, headers);
      await env.JOURNEYS.delete(`counselor-record:${counselorId}:${personId}`);
      return reply('{"ok":true}', 200, headers);
    }

    const share = url.pathname.match(/^\/v1\/shares\/([^/]+)$/);
    if (share) {
      const id = share[1];
      if (!SHARE_ID_RE.test(id)) return reply('{"error":"bad id"}', 400, headers);
      const key = `share:${id}`;
      if (request.method === 'GET') {
        const value = await env.JOURNEYS.get(key);
        return value ? reply(value, 200, headers) : reply('{"error":"not found"}', 404, headers);
      }
      if (request.method === 'PUT') {
        const text = await request.text();
        if (text.length > MAX_BYTES) return reply('{"error":"too large"}', 413, headers);
        let parsed;
        try { parsed = JSON.parse(text); } catch { return reply('{"error":"bad body"}', 400, headers); }
        if (parsed.v !== 1 || typeof parsed.iv !== 'string' || typeof parsed.ct !== 'string') return reply('{"error":"bad body"}', 400, headers);
        await env.JOURNEYS.put(key, text, { expirationTtl: SHARE_TTL_SECONDS });
        return reply('{"ok":true}', 200, headers);
      }
      if (request.method === 'DELETE') {
        await env.JOURNEYS.delete(key);
        return reply('{"ok":true}', 200, headers);
      }
      return reply('{"error":"method not allowed"}', 405, headers);
    }

    if (url.pathname === '/v1/research/events' && request.method === 'POST') {
      const text = await request.text();
      if (text.length > 32 * 1024) return reply('{"error":"too large"}', 413, headers);
      let event;
      try { event = JSON.parse(text); } catch { return reply('{"error":"bad body"}', 400, headers); }
      if (!PARTICIPANT_RE.test(event.participantId) || !/^[0-9a-f]{24}$/.test(event.eventId) || !RESEARCH_KINDS.has(event.kind) || Number.isNaN(Date.parse(event.occurredAt)) || typeof event.consentVersion !== 'string' || !event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) {
        return reply('{"error":"bad body"}', 400, headers);
      }
      await env.JOURNEYS.put(`research:${event.participantId}:${event.eventId}`, JSON.stringify(event), { expirationTtl: TTL_SECONDS });
      return reply('{"ok":true}', 200, headers);
    }

    const participant = url.pathname.match(/^\/v1\/research\/participants\/([^/]+)$/);
    if (participant && request.method === 'DELETE') {
      if (!PARTICIPANT_RE.test(participant[1])) return reply('{"error":"bad id"}', 400, headers);
      let cursor;
      let deleted = 0;
      do {
        const listed = await env.JOURNEYS.list({ prefix: `research:${participant[1]}:`, cursor });
        await Promise.all(listed.keys.map((entry) => env.JOURNEYS.delete(entry.name)));
        deleted += listed.keys.length;
        cursor = listed.list_complete ? undefined : listed.cursor;
      } while (cursor);
      return reply(JSON.stringify({ ok: true, deleted }), 200, headers);
    }

    if (url.pathname === '/v1/research/export' && request.method === 'GET') {
      if (!env.RESEARCH_EXPORT_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.RESEARCH_EXPORT_TOKEN}`) return reply('{"error":"unauthorized"}', 401, headers);
      const listed = await env.JOURNEYS.list({ prefix: 'research:', limit: 1000, cursor: url.searchParams.get('cursor') || undefined });
      const values = await Promise.all(listed.keys.map((entry) => env.JOURNEYS.get(entry.name, 'json')));
      return reply(JSON.stringify({ events: values.filter(Boolean), cursor: listed.list_complete ? null : listed.cursor }), 200, headers);
    }

    const match = url.pathname.match(/^\/v1\/journeys\/([^/]+)$/);
    if (!match) return reply('{"error":"not found"}', 404, headers);
    const id = match[1];
    if (!ID_RE.test(id)) return reply('{"error":"bad id"}', 400, headers);

    if (request.method === 'GET') {
      const value = await env.JOURNEYS.get(id);
      return value ? reply(value, 200, headers) : reply('{"error":"not found"}', 404, headers);
    }

    if (request.method === 'PUT') {
      const text = await request.text();
      if (text.length > MAX_BYTES) return reply('{"error":"too large"}', 413, headers);
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return reply('{"error":"bad body"}', 400, headers);
      }
      if (parsed.v !== 1 || typeof parsed.iv !== 'string' || typeof parsed.ct !== 'string') return reply('{"error":"bad body"}', 400, headers);
      await env.JOURNEYS.put(id, text, { expirationTtl: TTL_SECONDS });
      return reply('{"ok":true}', 200, headers);
    }

    if (request.method === 'DELETE') {
      await env.JOURNEYS.delete(id);
      return reply('{"ok":true}', 200, headers);
    }

    return reply('{"error":"method not allowed"}', 405, headers);
  },
};
