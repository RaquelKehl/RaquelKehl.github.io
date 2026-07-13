/* ═══════════════════════════════════════════════════════════════
   LIQUID COPPER — blog.js
   Markdown-based blog: renders the post list from blog/posts.json,
   or a single post (?post=slug) with a minimal, safe MD renderer.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var listEl = document.getElementById('postList');
  var articleEl = document.getElementById('article');
  var listSection = document.getElementById('listSection');

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
  }

  /* inline markdown: code, bold, italic, links (http/https/relative only) */
  function inline(s) {
    s = s.replace(/`([^`]+)`/g, function (m, c) { return '<code>' + c + '</code>'; });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, href) {
      if (!/^(https?:\/\/|\/|[\w.-]+\.html)/.test(href)) return text;
      var ext = /^https?:\/\//.test(href);
      return '<a href="' + href + '"' + (ext ? ' rel="noopener noreferrer" target="_blank"' : '') + '>' + text + '</a>';
    });
    return s;
  }

  /* block-level markdown — input is escaped first, so output is safe */
  function renderMarkdown(md) {
    var lines = md.replace(/\r\n/g, '\n').split('\n');
    var html = [], i = 0, para = [], listType = null;

    function flushPara() {
      if (para.length) { html.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    }
    function flushList() {
      if (listType) { html.push('</' + listType + '>'); listType = null; }
    }

    while (i < lines.length) {
      var raw = esc(lines[i]);

      if (/^```/.test(raw)) {                       /* fenced code block */
        flushPara(); flushList();
        var code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) { code.push(esc(lines[i])); i++; }
        html.push('<pre><code>' + code.join('\n') + '</code></pre>');
        i++; continue;
      }
      if (/^###\s/.test(raw)) { flushPara(); flushList(); html.push('<h3>' + inline(raw.slice(4)) + '</h3>'); i++; continue; }
      if (/^##\s/.test(raw))  { flushPara(); flushList(); html.push('<h2>' + inline(raw.slice(3)) + '</h2>'); i++; continue; }
      if (/^#\s/.test(raw))   { flushPara(); flushList(); i++; continue; } /* h1 comes from posts.json */
      if (/^&gt;\s?/.test(raw)) { flushPara(); flushList(); html.push('<blockquote>' + inline(raw.replace(/^&gt;\s?/, '')) + '</blockquote>'); i++; continue; }
      if (/^---+\s*$/.test(raw)) { flushPara(); flushList(); html.push('<hr>'); i++; continue; }
      if (/^[-*]\s+/.test(raw)) {
        flushPara();
        if (listType !== 'ul') { flushList(); html.push('<ul>'); listType = 'ul'; }
        html.push('<li>' + inline(raw.replace(/^[-*]\s+/, '')) + '</li>'); i++; continue;
      }
      if (/^\d+\.\s+/.test(raw)) {
        flushPara();
        if (listType !== 'ol') { flushList(); html.push('<ol>'); listType = 'ol'; }
        html.push('<li>' + inline(raw.replace(/^\d+\.\s+/, '')) + '</li>'); i++; continue;
      }
      if (/^\s*$/.test(raw)) { flushPara(); flushList(); i++; continue; }
      para.push(raw.trim()); i++;
    }
    flushPara(); flushList();
    return html.join('\n');
  }

  function fmtDate(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function showList(posts) {
    posts.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'post-card reveal in';
      a.href = 'blog.html?post=' + encodeURIComponent(p.slug);
      a.innerHTML =
        '<span class="date">' + fmtDate(p.date) + '</span>' +
        '<h2></h2><p></p>' +
        '<span class="read">' + p.read + ' min read →</span>';
      a.querySelector('h2').textContent = p.title;
      a.querySelector('p').textContent = p.summary;
      listEl.appendChild(a);
    });
  }

  function showPost(post) {
    listSection.hidden = true;
    articleEl.hidden = false;
    document.title = post.title + ' — Raquel Kehl';
    articleEl.querySelector('h1').textContent = post.title;
    articleEl.querySelector('.meta').textContent =
      fmtDate(post.date) + ' · ' + post.read + ' min read · Raquel Kehl Furukawa';
    fetch('blog/' + post.slug + '.md')
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (md) {
        articleEl.querySelector('.prose').innerHTML = renderMarkdown(md);
      })
      .catch(function () {
        articleEl.querySelector('.prose').innerHTML =
          '<p>This post could not be loaded. <a href="blog.html">Back to all posts.</a></p>';
      });
  }

  fetch('blog/posts.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var slug = new URLSearchParams(window.location.search).get('post');
      var post = slug && data.posts.filter(function (p) { return p.slug === slug; })[0];
      if (post) { showPost(post); } else { showList(data.posts); }
    })
    .catch(function () {
      listEl.innerHTML = '<div class="empty">Posts could not be loaded.</div>';
    });
})();
