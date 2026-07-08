# Deployment guide — from this folder to a live site

Two independent halves. **Part A puts the visible site online** and needs only
a GitHub account. **Part B adds the serverless edge** (live GitHub stats,
working contact form, agent status) and can happen any time later.

---

## Part A — the visible site on GitHub Pages (free)

### A1. Create the dedicated GitHub account
1. Sign out of any existing GitHub account, go to <https://github.com/signup>.
2. Choose the professional username — it becomes your site address:
   `https://<username>.github.io`. Short and close to your name is best
   (e.g. `raquelkehl`).
3. Verify the e-mail address and enable **two-factor authentication**
   (Settings → Password and authentication).

### A2. Create the repository
1. New repository, named exactly `<username>.github.io`
   (this makes the site live at the root URL, no path suffix).
2. Visibility: **Public** (required for free Pages). No README/licence —
   this folder already has content.

### A3. Push this folder
```bash
cd "My_Website"
git remote add origin https://github.com/<username>/<username>.github.io.git
git add -A
git commit -m "Portfolio v1 — Liquid Copper"
git push -u origin main
```
The `.gitignore` already excludes local secrets, `.claude/`, and the private
meta-prompt document — check `git status` shows none of them staged.

### A4. Enable Pages via the Actions workflow
1. Repository → **Settings → Pages** → Source: **GitHub Actions**.
2. The included workflow `.github/workflows/deploy.yml` runs on every push to
   `main`; the first run publishes the site. HTTPS is automatic.

### A5. Repository hygiene (5 minutes, once)
- **Settings → Code security** → enable Dependabot alerts + security updates
  (the config file is already in the repo).
- **Settings → Branches** → add a protection rule for `main`:
  require a pull request before merging, block force pushes.
- Optional but recommended: sign your commits
  (`git config commit.gpgsign true` with an SSH or GPG signing key).

### A6. Configure the site
Edit `main.js` → `SITE_CONFIG`:
```js
githubUsername: '<username>',   // un-hides the footer GitHub link
```
Commit and push — the workflow redeploys automatically.

**The site is now live.** Everything below is enhancement.

---

## Part B — the serverless edge (Cloudflare Workers, free)

Follow `workers/README.md` for the full walkthrough. Summary:

1. Cloudflare account → `npx wrangler login`
2. `npx wrangler kv namespace create PORTFOLIO_KV` → paste id into
   `workers/wrangler.toml`
3. Fill `GITHUB_USERNAME` and `ALLOWED_ORIGINS` in `workers/wrangler.toml`
4. Secrets: `npx wrangler secret put FORMSPREE_ENDPOINT` / `WEBHOOK_SECRET` /
   optionally `GITHUB_TOKEN`
5. `npx wrangler deploy` → note the Worker URL
6. Connect the frontend:
   - `main.js` → `SITE_CONFIG.workerBaseUrl = 'https://portfolio-api.<subdomain>.workers.dev'`
   - **every page's** CSP meta tag → append the Worker origin to `connect-src`,
     e.g. `connect-src 'self' https://api.github.com https://portfolio-api.<subdomain>.workers.dev`
     (pages: index, about, portfolio, usecases, blog, dashboard, agents, game, contact)
7. Verify with `workers/integration-tests.js`, then commit + push.

The contact form, live repo stats, and (later) agent telemetry now flow
through the edge with all keys server-side.

---

## Part C — custom domain (optional)

1. Buy the domain (e.g. at Cloudflare Registrar — at-cost pricing).
2. **DNS**: add a `CNAME` record for `www` → `<username>.github.io`, and
   `A` records on the apex to GitHub Pages IPs
   (185.199.108.153 / .109. / .110. / .111.153).
3. Repository → Settings → Pages → Custom domain → enter the domain,
   wait for the DNS check, then tick **Enforce HTTPS**.
4. Add the new origin to `ALLOWED_ORIGINS` in `workers/wrangler.toml`
   (comma-separated) and redeploy the Worker.
5. Update `og:url`/canonical tags when you settle on the final domain.

---

## Launch checklist

- [ ] Pages build green, site loads at `https://<username>.github.io`
- [ ] All nine pages render; dark and light themes both work
- [ ] CV download works (`assets/cv/2026_CV_Website.pdf` is the version you want public)
- [ ] Replace the placeholder contact e-mail before publicising (currently none is exposed — by design)
- [ ] `SITE_CONFIG.githubUsername` set; footer GitHub link visible
- [ ] Dependabot alerts on, branch protection on `main`
- [ ] (Part B) Worker deployed, integration tests pass, CSP updated
- [ ] Lighthouse ≥ 90 on Performance / Accessibility / Best Practices / SEO
      (Chrome DevTools → Lighthouse, test the live URL, not localhost)
