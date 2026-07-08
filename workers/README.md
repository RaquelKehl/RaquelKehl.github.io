# Portfolio API — Cloudflare Worker

One Worker, four routes. It is the only thing standing between the static site
and the outside world, and it is the reason no API key ever reaches a browser.

| Route | Method | Purpose |
|---|---|---|
| `/api/github` | GET | GitHub repo stats, cached in KV for 10 minutes |
| `/api/contact` | POST | Validated relay of contact-form submissions to Formspree |
| `/api/agents` | GET | Latest CrewAI pipeline status from KV |
| `/api/webhook` | POST | HMAC-verified ingest of pipeline results into KV |

Free tier: 100,000 requests/day, ~0 ms cold starts, no bandwidth charges.

## Setup (one time, ~15 minutes)

1. **Account & CLI**
   ```bash
   # create a free account at https://dash.cloudflare.com/sign-up first
   npm install -g wrangler
   npx wrangler login
   ```

2. **KV namespace**
   ```bash
   cd workers
   npx wrangler kv namespace create PORTFOLIO_KV
   ```
   Paste the returned `id` into `wrangler.toml` under `[[kv_namespaces]]`.

3. **Vars** — edit `wrangler.toml`:
   - `GITHUB_USERNAME` — the portfolio GitHub account
   - `ALLOWED_ORIGINS` — your Pages URL (and custom domain, comma-separated)

4. **Secrets** (encrypted on Cloudflare, never written to any file):
   ```bash
   npx wrangler secret put FORMSPREE_ENDPOINT   # from https://formspree.io — free tier
   npx wrangler secret put WEBHOOK_SECRET       # e.g. openssl rand -hex 32 — reuse in GitHub Secrets
   npx wrangler secret put GITHUB_TOKEN         # optional: raises GitHub API limits
   ```

5. **Deploy**
   ```bash
   npx wrangler deploy
   ```
   Note the printed URL, e.g. `https://portfolio-api.<subdomain>.workers.dev`.

6. **Connect the frontend** — two edits in the site repo:
   - `main.js` → `SITE_CONFIG.workerBaseUrl = 'https://portfolio-api.<subdomain>.workers.dev'`
   - every page's CSP `connect-src` → add that same origin

## Local development

```bash
cp .dev.vars.example .dev.vars    # fill in values; file is gitignored
npx wrangler dev                  # serves on http://127.0.0.1:8787
node integration-tests.js         # in a second shell
```

## Security model

- **Secrets server-side only** — `wrangler secret put`; the repo carries no credentials.
- **CORS allow-list** — only origins in `ALLOWED_ORIGINS` receive `Access-Control-Allow-Origin`.
- **Rate limiting** — built-in Rate Limiting API binding, 60 req/min per client IP,
  keyed separately for read and write routes. No external store.
- **Webhook integrity** — `X-Signature` must be a hex HMAC-SHA256 of the raw body,
  verified in constant time; body capped at 32 KB and schema-checked.
- **Input validation** — contact fields length-checked, email syntax-checked,
  honeypot field silently dropped.
- **No error leakage** — internals log to the Worker console only; clients get
  generic error codes.
