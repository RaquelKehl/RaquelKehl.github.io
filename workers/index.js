/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO API — Cloudflare Worker (workers/index.js)
   One Worker, four routes, zero secrets in the browser:

     GET  /api/github   — GitHub repo stats, KV-cached (10 min)
     POST /api/contact  — validated relay to Formspree
     GET  /api/agents   — CrewAI pipeline status from KV
     POST /api/webhook  — HMAC-verified pipeline result ingest

   Bindings (wrangler.toml): PORTFOLIO_KV (KV), RATE_LIMITER
   Secrets (wrangler secret put): FORMSPREE_ENDPOINT, WEBHOOK_SECRET,
   GITHUB_TOKEN (optional, raises the GitHub API rate limit)
   Vars: GITHUB_USERNAME, ALLOWED_ORIGINS (comma-separated)
   ═══════════════════════════════════════════════════════════════ */

const GITHUB_CACHE_KEY = 'github-repos';
const GITHUB_CACHE_TTL = 600;            // seconds
const AGENTS_KEY = 'agents-status';
const MAX_BODY_BYTES = 32 * 1024;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // one shared limiter, keyed per client + route class
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const writeRoute = request.method === 'POST';
    if (env.RATE_LIMITER) {
      const { success } = await env.RATE_LIMITER.limit({
        key: ip + ':' + (writeRoute ? 'w' : 'r')
      });
      if (!success) {
        return json({ error: 'rate_limited' }, 429, cors);
      }
    }

    try {
      if (url.pathname === '/api/github' && request.method === 'GET') {
        return await handleGithub(env, cors, ctx);
      }
      if (url.pathname === '/api/contact' && request.method === 'POST') {
        return await handleContact(request, env, cors);
      }
      if (url.pathname === '/api/agents' && request.method === 'GET') {
        return await handleAgents(env, cors);
      }
      if (url.pathname === '/api/webhook' && request.method === 'POST') {
        return await handleWebhook(request, env, cors);
      }
      return json({ error: 'not_found' }, 404, cors);
    } catch (err) {
      // never leak internals to the client
      console.error('worker error:', err && err.message);
      return json({ error: 'internal' }, 500, cors);
    }
  }
};

/* ---------- CORS ---------- */
function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const h = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Signature',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
  if (allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...cors
    }
  });
}

/* ---------- GET /api/github ---------- */
async function handleGithub(env, cors, ctx) {
  if (!env.GITHUB_USERNAME) return json({ repos: [], note: 'github_username_not_configured' }, 200, cors);

  const cached = await env.PORTFOLIO_KV.get(GITHUB_CACHE_KEY, 'json');
  if (cached) return json(cached, 200, cors);

  const headers = {
    'User-Agent': 'portfolio-worker',
    'Accept': 'application/vnd.github+json'
  };
  if (env.GITHUB_TOKEN) headers['Authorization'] = 'Bearer ' + env.GITHUB_TOKEN;

  const res = await fetch(
    'https://api.github.com/users/' + encodeURIComponent(env.GITHUB_USERNAME) +
    '/repos?sort=updated&per_page=6',
    { headers }
  );
  if (!res.ok) return json({ error: 'upstream', status: res.status }, 502, cors);

  const repos = (await res.json()).map(r => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stargazers_count: r.stargazers_count,
    updated_at: r.updated_at,
    html_url: r.html_url
  }));
  const payload = { source: 'github', fetched: new Date().toISOString(), repos };

  ctx.waitUntil(env.PORTFOLIO_KV.put(
    GITHUB_CACHE_KEY, JSON.stringify(payload), { expirationTtl: GITHUB_CACHE_TTL }
  ));
  return json(payload, 200, cors);
}

/* ---------- POST /api/contact ---------- */
async function handleContact(request, env, cors) {
  if (!env.WEB3FORMS_KEY && !env.FORMSPREE_ENDPOINT) {
    return json({ error: 'not_configured' }, 503, cors);
  }

  let fields;
  const type = request.headers.get('Content-Type') || '';
  if (type.includes('application/json')) {
    fields = await request.json();
  } else {
    const form = await request.formData();
    fields = Object.fromEntries(form.entries());
  }

  // honeypot: silently accept and drop
  if (fields._gotcha) return json({ ok: true }, 200, cors);

  const name = String(fields.name || '').trim();
  const email = String(fields.email || '').trim();
  const message = String(fields.message || '').trim();
  const topic = String(fields.topic || 'other').slice(0, 40);
  const organisation = String(fields.organisation || '').slice(0, 200);

  if (!name || name.length > 200) return json({ error: 'invalid_name' }, 400, cors);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json({ error: 'invalid_email' }, 400, cors);
  }
  if (!message || message.length > 5000) return json({ error: 'invalid_message' }, 400, cors);

  const subject = 'raquelkehl.ch contact — ' + topic + ' — ' + name;

  // Preferred relay: Web3Forms (built for server-side submissions).
  // Fallback: Formspree, if only that is configured.
  let relayOk = false;
  if (env.WEB3FORMS_KEY) {
    const relay = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: env.WEB3FORMS_KEY,
        subject, name, email, message, topic, organisation
      })
    });
    const result = await relay.json().catch(() => null);
    relayOk = relay.ok && result && result.success === true;
  } else {
    const relay = await fetch(env.FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name, email, message, topic, organisation, _subject: subject })
    });
    relayOk = relay.ok;
  }

  if (!relayOk) return json({ error: 'relay_failed' }, 502, cors);
  return json({ ok: true }, 200, cors);
}

/* ---------- GET /api/agents ---------- */
async function handleAgents(env, cors) {
  const stored = await env.PORTFOLIO_KV.get(AGENTS_KEY, 'json');
  if (stored) return json(stored, 200, cors);
  return json({
    generated: null,
    pipeline: 'awaiting first pipeline run',
    agents: []
  }, 200, cors);
}

/* ---------- POST /api/webhook ---------- */
async function handleWebhook(request, env, cors) {
  if (!env.WEBHOOK_SECRET) return json({ error: 'not_configured' }, 503, cors);

  const signature = request.headers.get('X-Signature') || '';
  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_BODY_BYTES) {
    return json({ error: 'invalid_body' }, 400, cors);
  }

  const valid = await verifyHmac(body, signature, env.WEBHOOK_SECRET);
  if (!valid) return json({ error: 'invalid_signature' }, 401, cors);

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return json({ error: 'invalid_json' }, 400, cors);
  }
  if (!payload || !Array.isArray(payload.agents)) {
    return json({ error: 'invalid_schema' }, 400, cors);
  }

  await env.PORTFOLIO_KV.put(AGENTS_KEY, JSON.stringify(payload));
  return json({ ok: true, stored: payload.agents.length }, 200, cors);
}

async function verifyHmac(bodyBuffer, signatureHex, secret) {
  if (!/^[0-9a-f]{64}$/i.test(signatureHex)) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, bodyBuffer));
  const given = hexToBytes(signatureHex);
  if (given.length !== mac.length) return false;
  // constant-time comparison
  let diff = 0;
  for (let i = 0; i < mac.length; i++) diff |= mac[i] ^ given[i];
  return diff === 0;
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
