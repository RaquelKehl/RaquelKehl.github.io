/* ═══════════════════════════════════════════════════════════════
   LIQUID COPPER — agents.js
   Hydrates the agent showcase cards from the pipeline status JSON
   (bundled sample until the CrewAI pipeline's first deployment).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STATUS_DOT = { ok: 'ok', running: 'warn', idle: 'idle', error: 'err' };

  var cfg = window.SITE_CONFIG || {};
  var statusUrl = cfg.workerBaseUrl
    ? cfg.workerBaseUrl.replace(/\/+$/, '') + '/api/agents'
    : 'data/agents-status.json';

  fetch(statusUrl)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      var src = document.getElementById('crewSource');
      if (src && data.generated) {
        var when = new Date(data.generated).toISOString().slice(0, 10);
        var sample = /sample/i.test(data.pipeline || '');
        src.textContent = 'status source: ' + (sample ? 'bundled sample' : 'crewai pipeline') +
          ' · generated ' + when;
      }
      data.agents.forEach(function (a) {
        var card = document.querySelector('[data-agent="' + a.id + '"]');
        if (!card) return;
        var dot = card.querySelector('.dot');
        var text = card.querySelector('.status-text');
        var out = card.querySelector('.sample-output');
        if (dot) dot.className = 'dot ' + (STATUS_DOT[a.status] || 'idle');
        if (text) text.textContent = a.status + (a.last_run
          ? ' · ' + new Date(a.last_run).toISOString().slice(0, 10) : '');
        if (out) {
          var payload = { status: a.status, last_run: a.last_run, output: a.last_output };
          out.textContent = JSON.stringify(payload, null, 2);
        }
      });
    })
    .catch(function () { /* cards keep their static fallback content */ });
})();
