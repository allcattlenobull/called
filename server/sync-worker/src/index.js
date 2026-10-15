/**
 * Called journey sync: a tiny Cloudflare Worker that stores encrypted journeys.
 *
 * It never receives a journey code or readable data. Clients send:
 *   - an ID: SHA-256 of the code (64 hex characters)
 *   - a body: AES-GCM ciphertext produced in the browser
 *
 * Routes:  GET | PUT | DELETE  /v1/journeys/:id
 * Storage: Workers KV (binding JOURNEYS). Entries expire after two years without an update.
 */
const MAX_BYTES = 512 * 1024;
const TTL_SECONDS = 60 * 60 * 24 * 730;
const ID_RE = /^[0-9a-f]{64}$/;

function cors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.length === 0 || allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin || '*' : 'null',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    const match = url.pathname.match(/^\/v1\/journeys\/([^/]+)$/);
    if (!match) return reply('{"error":"not found"}', 404, headers);
    const id = match[1];
    if (!ID_RE.test(id)) return reply('{"error":"bad id"}', 400, headers);

    // Simple per-IP throttle using the optional Rate Limiting binding.
    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) return reply('{"error":"slow down"}', 429, headers);
    }

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
