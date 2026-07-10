/* ═══════════════════════════════════════════════════════════════
   LIQUID COPPER — dashboard.js
   Skills radar + bars (Chart.js, self-hosted, theme-aware),
   GitHub activity panel, CrewAI agent status panel.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme-aware chart colors, read from the tokens ---------- */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function palette() {
    return {
      c1: cssVar('--chart-1'),
      grid: cssVar('--chart-grid'),
      tick: cssVar('--chart-tick'),
      text: cssVar('--text'),
      surface: cssVar('--surface')
    };
  }
  function withAlpha(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  /* ---------- data (from the CV, self-assessed /100) ---------- */
  var radarData = [
    ['M365 Digital Workplace', 90],
    ['Data Science & ML', 85],
    ['IT Risk & Compliance', 85],
    ['Technical PM', 85],
    ['Agentic Orchestration', 80],
    ['AI & IT Governance', 80],
    ['Delivery Architecture', 80],
    ['System Integration', 75]
  ];
  var allSkills = [
    ['M365 Digital Workplace', 90],
    ['Data Science & ML', 85],
    ['IT Risk & Compliance', 85],
    ['Technical PM', 85],
    ['Agentic Orchestration', 80],
    ['AI & IT Governance', 80],
    ['Delivery Architecture', 80],
    ['ERP & Core Banking', 80],
    ['Generative AI Patterns', 80],
    ['System Integration', 75],
    ['UI / UX Design', 75],
    ['Enterprise Architecture', 70],
    ['Full-Stack Architecture', 70],
    ['Azure DevOps & Cloud', 65]
  ];

  var charts = [];

  function buildCharts() {
    if (typeof Chart === 'undefined') return;
    charts.forEach(function (c) { c.destroy(); });
    charts = [];

    var p = palette();
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = p.tick;
    if (reduced) Chart.defaults.animation = false;

    var radarEl = document.getElementById('radarChart');
    if (radarEl) {
      charts.push(new Chart(radarEl, {
        type: 'radar',
        data: {
          labels: radarData.map(function (d) { return d[0]; }),
          datasets: [{
            label: 'Self-assessed /100',
            data: radarData.map(function (d) { return d[1]; }),
            borderColor: p.c1,
            backgroundColor: withAlpha(p.c1, .18),
            borderWidth: 2,
            pointBackgroundColor: p.c1,
            pointBorderColor: p.surface,
            pointBorderWidth: 2,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },  /* single series — the panel title names it */
          scales: {
            r: {
              min: 0, max: 100,
              ticks: { display: false, stepSize: 25 },
              grid: { color: p.grid },
              angleLines: { color: p.grid },
              pointLabels: { color: p.tick, font: { size: 11 } }
            }
          }
        }
      }));
    }

    var barsEl = document.getElementById('barsChart');
    if (barsEl) {
      charts.push(new Chart(barsEl, {
        type: 'bar',
        data: {
          labels: allSkills.map(function (d) { return d[0]; }),
          datasets: [{
            label: 'Self-assessed /100',
            data: allSkills.map(function (d) { return d[1]; }),
            backgroundColor: p.c1,
            borderRadius: { topRight: 4, bottomRight: 4 }, /* rounded data end, flat baseline */
            borderSkipped: 'left',
            barThickness: 12
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { min: 0, max: 100, grid: { color: p.grid }, ticks: { color: p.tick } },
            y: { grid: { display: false }, ticks: { color: p.tick, autoSkip: false, font: { size: 11 } } }
          }
        }
      }));
    }
  }

  /* rebuild charts when the theme flips, after the token transition */
  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () { setTimeout(buildCharts, 60); });
  }

  /* ---------- GitHub panel ---------- */
  function repoCard(r, sample) {
    var li = document.createElement('div');
    li.className = 'mini';
    var updated = r.updated_at ? new Date(r.updated_at).toISOString().slice(0, 10) : '';
    li.innerHTML =
      '<span class="nm"></span>' +
      '<span class="meta">' + (r.language ? r.language + ' · ' : '') + '★ ' +
        (r.stargazers_count || 0) + (updated ? ' · ' + updated : '') +
        (sample ? ' · sample' : '') + '</span>' +
      '<span class="desc"></span>';
    var nm = li.querySelector('.nm');
    if (!sample && /^https:\/\/github\.com\//.test(r.html_url || '')) {
      var a = document.createElement('a');
      a.href = r.html_url;
      a.rel = 'noopener';
      a.target = '_blank';
      a.textContent = r.name;
      nm.appendChild(a);
    } else {
      nm.textContent = r.name;
    }
    li.querySelector('.desc').textContent = r.description || '—';
    return li;
  }
  function loadGitHub() {
    var list = document.getElementById('ghList');
    var src = document.getElementById('ghSource');
    if (!list) return;
    var cfg = window.SITE_CONFIG || {};

    function showSample() {
      fetch('data/mock-github.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          src.textContent = 'source: sample — github account pending';
          data.repos.forEach(function (r) { list.appendChild(repoCard(r, true)); });
          var note = document.createElement('div');
          note.className = 'dev-inline';
          note.innerHTML =
            '<span class="dev-badge"><span class="pulse-dot"></span>Live architecture in progress</span>' +
            '<p>Live repository telemetry is briefly unavailable — the entries above are a ' +
            'labelled sample. <span class="mono">HTTP 418 · I’m a teapot 🫖</span></p>';
          list.appendChild(note);
        })
        .catch(function () {
          src.textContent = 'source: unavailable';
          list.innerHTML = '<div class="empty">Repository data could not be loaded.</div>';
        });
    }

    if (cfg.workerBaseUrl) {
      /* served from the edge: cached, rate-limited, no keys in the browser */
      fetch(cfg.workerBaseUrl.replace(/\/+$/, '') + '/api/github')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) {
          var repos = data.repos || [];
          src.textContent = 'source: edge · cached';
          if (!repos.length) {
            list.innerHTML = '<div class="empty">No public repositories yet.</div>';
            return;
          }
          repos.forEach(function (r) { list.appendChild(repoCard(r, false)); });
        })
        .catch(showSample);
    } else if (cfg.githubUsername) {
      fetch('https://api.github.com/users/' + encodeURIComponent(cfg.githubUsername) +
            '/repos?sort=updated&per_page=6')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (repos) {
          src.textContent = 'source: github api · live';
          if (!repos.length) {
            list.innerHTML = '<div class="empty">No public repositories yet.</div>';
            return;
          }
          repos.forEach(function (r) { list.appendChild(repoCard(r, false)); });
        })
        .catch(showSample);
    } else {
      showSample();
    }
  }

  /* ---------- agent crew panel ---------- */
  var STATUS_LABEL = { ok: 'ok', running: 'running', idle: 'idle', error: 'error' };
  var STATUS_DOT = { ok: 'ok', running: 'warn', idle: 'idle', error: 'err' };
  function loadAgents() {
    var list = document.getElementById('agentList');
    var src = document.getElementById('agentSource');
    if (!list) return;
    var cfg = window.SITE_CONFIG || {};

    function render(data, label) {
      src.textContent = label;
      data.agents.forEach(function (a) {
        var li = document.createElement('div');
        li.className = 'mini';
        /* status is folded to a known label — payload text never enters innerHTML */
        li.innerHTML =
          '<span class="nm"><span class="dot ' + (STATUS_DOT[a.status] || 'idle') + '"></span></span>' +
          '<span class="meta">' + (STATUS_LABEL[a.status] || 'unknown') +
            (a.last_run ? ' · last run ' + new Date(a.last_run).toISOString().slice(0, 10) : '') + '</span>' +
          '<span class="desc"></span>';
        li.querySelector('.nm').appendChild(document.createTextNode(a.name));
        li.querySelector('.desc').textContent = a.last_output || a.role;
        list.appendChild(li);
      });
    }

    function showBundledSample() {
      fetch('data/agents-status.json')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          render(data, 'source: bundled sample — pipeline awaiting first run');
        })
        .catch(function () {
          src.textContent = 'source: unavailable';
          list.innerHTML = '<div class="empty">Agent status could not be loaded.</div>';
        });
    }

    if (cfg.workerBaseUrl) {
      fetch(cfg.workerBaseUrl.replace(/\/+$/, '') + '/api/agents')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (data) {
          if (!data.agents || !data.agents.length) { showBundledSample(); return; }
          var when = data.generated ? ' · ' + new Date(data.generated).toISOString().slice(0, 10) : '';
          render(data, 'source: crewai pipeline · live' + when);
        })
        .catch(showBundledSample);
    } else {
      showBundledSample();
    }
  }

  /* ---------- experience timeline geometry ----------
     Set via the CSSOM: the strict CSP (style-src 'self') forbids
     inline style attributes, but not programmatic styles. */
  function layoutTimeline() {
    var SPAN_START = 2007, SPAN_END = 2027, span = SPAN_END - SPAN_START;
    document.querySelectorAll('.tl-bar[data-start]').forEach(function (bar) {
      var s = parseInt(bar.getAttribute('data-start'), 10);
      var e = parseInt(bar.getAttribute('data-end'), 10);
      bar.style.left = ((s - SPAN_START) / span * 100) + '%';
      bar.style.width = ((e - s) / span * 100) + '%';
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    layoutTimeline();
    buildCharts();
    loadGitHub();
    loadAgents();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
