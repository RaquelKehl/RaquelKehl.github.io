# Portfolio API — endpoint reference

Base URL: `https://portfolio-api.<subdomain>.workers.dev`
All responses: `application/json; charset=utf-8`, `Cache-Control: no-store`.
All routes are rate-limited (60 req/min per client IP; read and write pools are separate).
CORS: only origins listed in `ALLOWED_ORIGINS` are echoed back.

---

## GET /api/github

Repository stats for the configured account, cached in KV for 600 s.

**200**
```json
{
  "source": "github",
  "fetched": "2026-07-08T10:00:00.000Z",
  "repos": [
    {
      "name": "portfolio-website",
      "description": "…",
      "language": "JavaScript",
      "stargazers_count": 3,
      "updated_at": "2026-07-08T09:00:00Z",
      "html_url": "https://github.com/…"
    }
  ]
}
```

**200 (unconfigured)** `{ "repos": [], "note": "github_username_not_configured" }`
**502** `{ "error": "upstream", "status": 403 }` — GitHub API failure (not cached).

---

## POST /api/contact

Validates and relays a contact-form submission to Formspree. Accepts
`application/json` or form data.

| Field | Rules |
|---|---|
| `name` | required, ≤ 200 chars |
| `email` | required, syntactically valid, ≤ 254 chars |
| `message` | required, ≤ 5000 chars |
| `topic` | optional, truncated to 40 chars |
| `organisation` | optional, truncated to 200 chars |
| `_gotcha` | honeypot — any value silently accepted and dropped |

**200** `{ "ok": true }`
**400** `{ "error": "invalid_name" | "invalid_email" | "invalid_message" }`
**502** `{ "error": "relay_failed" }` — Formspree unreachable/rejected.
**503** `{ "error": "not_configured" }` — `FORMSPREE_ENDPOINT` secret missing.

---

## GET /api/agents

Latest CrewAI pipeline status, exactly as stored by the webhook.

**200** — the stored payload, or before the first run:
```json
{ "generated": null, "pipeline": "awaiting first pipeline run", "agents": [] }
```

Schema of a stored payload (written by `run_agents.py`):
```json
{
  "generated": "ISO-8601 timestamp",
  "pipeline": "string",
  "agents": [
    {
      "id": "kebab-case-id",
      "name": "string",
      "role": "string",
      "status": "ok | running | idle | error",
      "last_run": "ISO-8601 timestamp | null",
      "last_output": "string"
    }
  ]
}
```

---

## POST /api/webhook

Ingests pipeline results. Called by GitHub Actions after an agent run.

**Headers**
- `X-Signature`: lowercase hex HMAC-SHA256 of the **raw request body**, keyed
  with `WEBHOOK_SECRET` (the same value stored in GitHub Secrets).

**Body** — JSON matching the agents schema above. Max 32 KB.

**200** `{ "ok": true, "stored": 4 }`
**400** `{ "error": "invalid_body" | "invalid_json" | "invalid_schema" }`
**401** `{ "error": "invalid_signature" }`
**503** `{ "error": "not_configured" }` — `WEBHOOK_SECRET` missing.

**Signing example (bash)**
```bash
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | awk '{print $2}')
curl -X POST "$WORKER_URL/api/webhook" \
  -H "Content-Type: application/json" -H "X-Signature: $SIG" -d "$BODY"
```

---

## Errors (all routes)

**404** `{ "error": "not_found" }` · **429** `{ "error": "rate_limited" }` ·
**500** `{ "error": "internal" }`
