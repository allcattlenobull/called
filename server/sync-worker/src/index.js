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
const RESEARCH_KINDS = new Set(['simulation_completion', 'simulation_outcome', 'follow_up', 'page_view', 'usability_feedback']);

function cors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.length === 0 || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin || '*' : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
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
