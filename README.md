# raquelkehl.ch

> **Built at the intersection of strategy and systems.**
> The personal website of Raquel Kehl Furukawa — part portfolio, part personal lab, part public workbench.

**Live site:** [raquelkehl.ch](https://raquelkehl.ch)

## What this is

A portfolio that practises what it preaches: a dependency-light, security-conscious,
accessible website built from scratch — and, progressively, a demonstration platform
for governed agentic AI. The visible site is complete; several capabilities are being
built in the open and are clearly marked as in development on the site itself.

## Architecture

```
Browser ── HTTPS ──> GitHub Pages (static site, this repository)
   │
   └─ fetch() ──> Cloudflare Worker (workers/, deployed separately)
                    ├─ GET  /api/github    GitHub repo stats, KV-cached
                    ├─ POST /api/contact   validated relay to the mail service
                    ├─ GET  /api/agents    agent pipeline status from KV
                    └─ POST /api/webhook   HMAC-verified pipeline ingest
                                             ▲
                        (upcoming) CrewAI editorial pipeline via GitHub Actions
```

- **Frontend** — vanilla HTML/CSS/JS, no frameworks, no build step. One design
  system (`styles.css`) with full dark/light theming, self-hosted variable fonts,
  and a Canvas 2D hero (no WebGL, no tracking embeds anywhere).
- **Edge** — a single Cloudflare Worker as the only bridge to external services:
  secrets live server-side, CORS is allow-listed, every route is rate-limited,
  and the webhook requires an HMAC-SHA256 signature. See
  [`workers/README.md`](workers/README.md) and
  [`workers/api-documentation.md`](workers/api-documentation.md).
- **Pipeline (in development)** — a human-gated editorial system that will turn
  curated newsletter sources into published Signals and a recurring Brief;
  nothing publishes without a reviewed pull request.

## Engineering choices, briefly

| Choice | Why |
|---|---|
| No JS frameworks | Lighthouse budget, tiny attack surface, no dependency churn |
| Strict CSP, no inline styles/scripts | XSS resistance by construction, not by audit |
| Self-hosted fonts & Chart.js | No third-party CDNs — CSP stays `'self'`-only |
| No analytics, no cookies, `no-referrer` everywhere | Visits collect nothing; outbound clicks never tell third parties where you came from |
| Serverless edge for all integrations | Zero secrets in the browser, swappable backends |
| UK English, `lang="en-GB"` | The author insists, correctly |
| Honest in-development states | Unfinished features are designed content, not broken links (HTTP 418 applies 🫖) |

## Repository map

| Path | Contents |
|---|---|
| `*.html`, `styles.css`, `main.js` | The ten pages and the design system |
| `dashboard.js`, `game.js`, `assets/js/` | Dashboard charts, the Pipeline puzzle game, page modules |
| `blog/` | Markdown essays + `posts.json` index |
| `data/` | JSON contracts consumed by the frontend (agents, media, mocks) |
| `assets/` | Fonts, CV, favicon, media library files |
| `workers/` | The Cloudflare Worker: source, config, docs, integration tests |
| `.github/workflows/` | Pages deployment on every push to `main` |
| `deployment_guide.md` | Full path from clone to custom domain |
| `SECURITY.md` | Security policy and how to report issues |

## Status

Live and actively developed. In progress, in the open: the first Use Cases
entries, the Insights Signals + Brief layers, the Media library's first content,
and the CrewAI agent pipeline. The site labels each of these honestly.

## Licensing

This repository is maintained as a personal portfolio, public proof of work,
and a controlled showcase of my judgment and design choices. Unless otherwise
stated, all code and content are copyright-protected and provided
**all rights reserved**; no reuse, redistribution, or derivative use is
permitted without prior permission.

There is deliberately no LICENSE file: this is a curated portfolio, not an
open-source library. The README exists to demonstrate reasoning, not to grant
reuse rights.

## Related projects

Production-grade, commercially sensitive, or in-progress strategic work
(games, client projects, unpublished systems) lives in **separate private
repositories**. This site documents such work as case studies — overview,
role, stack, architecture highlights, and status — without exposing source
code or internal documentation. Demos or technical walkthroughs can be shared
selectively where appropriate.

## Contact

Questions, ideas, opportunities: [raquelkehl.ch/contact.html](https://raquelkehl.ch/contact.html)
or `hello@raquelkehl.ch`.

---

© Raquel Kehl Furukawa. Code and content — all rights reserved.
Built with vanilla JS · hosted on GitHub Pages · dark by design.
