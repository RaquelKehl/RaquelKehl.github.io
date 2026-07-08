/* ═══════════════════════════════════════════════════════════════
   Integration tests for the portfolio Worker.
   Usage:
     1. In this directory:  npx wrangler dev        (default port 8787)
     2. In another shell:   node integration-tests.js [baseUrl]
   Requires Node 18+ (built-in fetch). Exits non-zero on failure.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const BASE = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/+$/, '');
const ORIGIN = 'http://127.0.0.1:4173';

let passed = 0, failed = 0;

function check(name, condition, detail) {
  if (condition) { passed++; console.log('  PASS  ' + name); }
  else { failed++; console.error('  FAIL  ' + name + (detail ? ' — ' + detail : '')); }
}

async function run() {
  console.log('Testing worker at ' + BASE + '\n');

  // 1 — CORS preflight
  {
    const r = await fetch(BASE + '/api/agents', {
      method: 'OPTIONS',
      headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'GET' }
    });
    check('preflight returns 204', r.status === 204, 'got ' + r.status);
    check('preflight allows configured origin',
      r.headers.get('access-control-allow-origin') === ORIGIN,
      'got ' + r.headers.get('access-control-allow-origin'));
  }

  // 2 — /api/agents always answers JSON
  {
    const r = await fetch(BASE + '/api/agents', { headers: { Origin: ORIGIN } });
    check('agents returns 200', r.status === 200, 'got ' + r.status);
    const body = await r.json();
    check('agents payload has agents[]', Array.isArray(body.agents));
    check('agents is no-store', (r.headers.get('cache-control') || '').includes('no-store'));
  }

  // 3 — /api/github answers (configured or graceful)
  {
    const r = await fetch(BASE + '/api/github', { headers: { Origin: ORIGIN } });
    check('github returns 200/502', r.status === 200 || r.status === 502, 'got ' + r.status);
    if (r.status === 200) {
      const body = await r.json();
      check('github payload has repos[]', Array.isArray(body.repos));
    } else { check('github payload has repos[] (skipped — upstream error)', true); }
  }

  // 4 — /api/contact validation
  {
    const r = await fetch(BASE + '/api/contact', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'not-an-email', message: '' })
    });
    check('contact rejects invalid input (400) or reports unconfigured (503)',
      r.status === 400 || r.status === 503, 'got ' + r.status);
  }

  // 5 — honeypot is silently accepted
  {
    const r = await fetch(BASE + '/api/contact', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ _gotcha: 'bot', name: 'x', email: 'a@b.co', message: 'hi' })
    });
    check('honeypot accepted with ok (200) or unconfigured (503)',
      r.status === 200 || r.status === 503, 'got ' + r.status);
  }

  // 6 — webhook rejects bad signatures
  {
    const r = await fetch(BASE + '/api/webhook', {
      method: 'POST',
      headers: {
        Origin: ORIGIN, 'Content-Type': 'application/json',
        'X-Signature': 'deadbeef'.repeat(8)
      },
      body: JSON.stringify({ agents: [] })
    });
    check('webhook rejects wrong signature (401) or reports unconfigured (503)',
      r.status === 401 || r.status === 503, 'got ' + r.status);
  }

  // 7 — webhook rejects missing signature
  {
    const r = await fetch(BASE + '/api/webhook', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ agents: [] })
    });
    check('webhook rejects missing signature (401) or unconfigured (503)',
      r.status === 401 || r.status === 503, 'got ' + r.status);
  }

  // 8 — unknown route
  {
    const r = await fetch(BASE + '/api/nope', { headers: { Origin: ORIGIN } });
    check('unknown route returns 404', r.status === 404, 'got ' + r.status);
  }

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

run().catch(function (e) {
  console.error('Could not reach the worker: ' + e.message);
  console.error('Start it first with: npx wrangler dev');
  process.exit(2);
});
