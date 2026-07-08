# Security policy

## Reporting a vulnerability

If you find a security issue in this site, its Worker API, or its pipeline,
please report it privately:

- **Email (preferred):** [hello@raquelkehl.ch](mailto:hello@raquelkehl.ch)
- **LinkedIn:** [linkedin.com/in/raquel-kehl-furukawa](https://www.linkedin.com/in/raquel-kehl-furukawa)
- Please include: the affected URL or file, steps to reproduce, and impact.

You can expect an acknowledgement within five working days. Please do not
open public issues for security reports, and allow a reasonable window for a
fix before any disclosure.

## Scope

- The static site (this repository)
- The Cloudflare Worker API (`workers/`)
- The GitHub Actions workflows (`.github/workflows/`)

## Security practices in this project

- **No secrets in the repository** — Worker secrets via `wrangler secret put`,
  CI secrets via GitHub Secrets; `.gitignore` blocks `.env` and `.dev.vars`.
- **Strict Content Security Policy** on every page — no inline scripts or
  styles, `object-src 'none'`, connect targets allow-listed.
- **HTTPS enforced** by GitHub Pages; HSTS via Cloudflare when a custom domain
  is attached.
- **Rate limiting** on every public API route (Cloudflare Rate Limiting API).
- **CORS allow-list** — the Worker only answers configured origins.
- **Webhook integrity** — HMAC-SHA256 signatures verified in constant time.
- **Input validation** on all write routes; honeypot on the contact form.
- **Dependabot** monitors workflow and (future) Python dependencies.
- **Branch protection** on `main` is part of the deployment checklist.
