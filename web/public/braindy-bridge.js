/*
 * Braindy bridge: lets Braindy App point at a part of this site, and pin comments on it, while it shows the site in its viewer.
 * Add once to every page: <script src="/braindy-bridge.js" defer></script> (copy this file into the site).
 * Inert outside an iframe and for any parent that is not Braindy App. It only reads the page; it never changes content.
 * Parent → frame: { type: 'braindy:spot', id, spot, label } · { type: 'braindy:comment-mode', on } · { type: 'braindy:pins', pins: [{ id, n, selector, text, x, y, done }] }
 * Frame → parent: { type: 'braindy:ready', url, editor?, inEditor? } · { type: 'braindy:spot-result', id, found } ·
 *   { type: 'braindy:picked', url, selector, text, x, y } · { type: 'braindy:comment-mode', on: false } · { type: 'braindy:pin', id }
 */
(function () {
  if (window.parent === window) return;
  var ALLOWED = ['https://app.braindy.co', 'https://braindy-app-staging.web.app', 'http://localhost:5174'];
  var VIOLET = '#8B5CF6', Z = 2147483640;
  var parentOrigin = null;
  // A message aimed at an origin the parent does not have is dropped by the browser, so "ready" goes to each allowed one.
  // A site with its own editor names it in <meta name="braindy-editor" content="/admin/editor?p=">: Braindy App then offers to edit the site in place.
  var em = document.querySelector('meta[name="braindy-editor"]'), EDITOR = em ? new URL(em.content, location.origin).href : '';
  function ready() { ALLOWED.forEach(function (o) { window.parent.postMessage({ type: 'braindy:ready', url: location.href, editor: EDITOR || undefined, inEditor: !!EDITOR && location.pathname === new URL(EDITOR).pathname }, o); }); }
  function tell(msg) { if (parentOrigin) window.parent.postMessage(msg, parentOrigin); }
  function el(css) { var d = document.createElement('div'); d.setAttribute('aria-hidden', 'true'); d.style.cssText = css; document.body.appendChild(d); return d; }

  var fold = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); };

  /** The element a spot names: a CSS selector, else the smallest visible element whose text (or image alt) contains it. */
  function find(spot) {
    // Selectors first (#contacto, .hero, h1); plain words that are not tags match nothing and fall through to text.
    try { var hit = document.querySelector(spot); if (hit && hit !== document.body) return hit; } catch (e) { /* not a selector */ }
    var want = fold(spot);
    if (!want) return null;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var p = node.parentElement;
      if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName) || !p.getClientRects().length) continue;
      if (fold(node.nodeValue).indexOf(want) >= 0) return p;
      // The text may be split across inline tags (<strong>, <a>): climb a little.
      for (var up = p, i = 0; up && i < 3; up = up.parentElement, i++) if (fold(up.textContent).indexOf(want) >= 0 && fold(up.textContent).length < want.length * 4 + 80) return up;
    }
    var imgs = document.querySelectorAll('img[alt]');
    for (var j = 0; j < imgs.length; j++) if (fold(imgs[j].alt).indexOf(want) >= 0) return imgs[j];
    return null;
  }

  /** A selector that finds this element again: its id, else a short nth-of-type path from the nearest ancestor with an id. */
  function selectorOf(node) {
    if (node.id && document.querySelectorAll('#' + CSS.escape(node.id)).length === 1) return '#' + CSS.escape(node.id);
    var parts = [];
    for (var n = node; n && n !== document.body && parts.length < 8; n = n.parentElement) {
      if (n.id && document.querySelectorAll('#' + CSS.escape(n.id)).length === 1) { parts.unshift('#' + CSS.escape(n.id)); break; }
      var i = 1; for (var s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
      parts.unshift(n.tagName.toLowerCase() + ':nth-of-type(' + i + ')');
    }
    var sel = parts.join(' > ');
    if (parts[0] && parts[0].charAt(0) !== '#') sel = 'body > ' + sel;
    try { return document.querySelector(sel) === node ? sel : ''; } catch (e) { return ''; }
  }
  var textOf = function (n) { return (n.tagName === 'IMG' ? n.alt : n.innerText || n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90); };

  // ---------- highlight one part ----------
  var box = null, label = null, target = null, timer = 0;
  function place() {
    if (!target || !box) return;
    var r = target.getBoundingClientRect();
    box.style.cssText = 'position:fixed;z-index:' + (Z + 1) + ';pointer-events:none;border-radius:10px;transition:all .25s ease;'
      + 'box-shadow:0 0 0 3px ' + VIOLET + ',0 0 0 9999px rgba(10,10,30,.28);'
      + 'left:' + (r.left - 6) + 'px;top:' + (r.top - 6) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px;';
    label.style.cssText = 'position:fixed;z-index:' + (Z + 2) + ';pointer-events:none;background:' + VIOLET + ';color:#fff;'
      + 'font:700 12px/1 system-ui,sans-serif;padding:5px 8px;border-radius:6px;'
      + 'left:' + Math.max(4, r.left - 6) + 'px;top:' + Math.max(4, r.top - 30) + 'px;';
  }
  function clear() { if (box) box.remove(); if (label) label.remove(); box = label = target = null; }
  function show(node, text) {
    clear();
    target = node; box = el(''); label = el(''); label.textContent = text || 'Braindy';
    node.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    place();
    clearTimeout(timer); timer = setTimeout(clear, 12000);
  }

  // ---------- comment mode: pick a part ----------
  var picking = false, hover = null;
  function hoverAt(node) {
    if (!hover) hover = el('');
    var r = node.getBoundingClientRect();
    hover.style.cssText = 'position:fixed;z-index:' + Z + ';pointer-events:none;border:2px dashed ' + VIOLET + ';border-radius:6px;background:rgba(139,92,246,.08);'
      + 'left:' + (r.left - 3) + 'px;top:' + (r.top - 3) + 'px;width:' + (r.width + 6) + 'px;height:' + (r.height + 6) + 'px;';
  }
  function setPicking(on) {
    picking = on;
    document.documentElement.style.cursor = on ? 'crosshair' : '';
    if (!on && hover) { hover.remove(); hover = null; }
  }
  var ours = function (n) { return n === box || n === label || n === hover || (n && n.hasAttribute && n.hasAttribute('data-braindy-pin')); };
  addEventListener('mouseover', function (e) { if (picking && !ours(e.target)) hoverAt(e.target); }, true);
  addEventListener('click', function (e) {
    if (picking) {
      var n = e.target;
      if (ours(n)) return;
      e.preventDefault(); e.stopPropagation();
      var r = n.getBoundingClientRect();
      tell({ type: 'braindy:picked', url: location.href, selector: selectorOf(n), text: textOf(n),
        x: r.width ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 0.5, y: r.height ? Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) : 0.5 });
      setPicking(false);
      return;
    }
    if (target) clear();
  }, true);
  addEventListener('keydown', function (e) { if (picking && e.key === 'Escape') { setPicking(false); tell({ type: 'braindy:comment-mode', on: false }); } }, true);

  // ---------- pins of the comments on this page ----------
  var pins = [];
  function drawPins() {
    pins.forEach(function (p) {
      var node = (p.selector && find(p.selector)) || (p.text && find(p.text));
      if (!node || !node.getClientRects().length) { p.dot.style.display = 'none'; return; }
      var r = node.getBoundingClientRect();
      p.dot.style.display = 'flex';
      p.dot.style.left = (r.left + r.width * (p.x == null ? 0.5 : p.x) - 13) + 'px';
      p.dot.style.top = (r.top + r.height * (p.y == null ? 0.5 : p.y) - 13) + 'px';
    });
  }
  function setPins(list) {
    pins.forEach(function (p) { p.dot.remove(); });
    pins = (list || []).slice(0, 200).map(function (p) {
      var dot = el('position:fixed;z-index:' + (Z + 3) + ';width:26px;height:26px;border-radius:50% 50% 50% 4px;display:flex;align-items:center;justify-content:center;'
        + 'background:' + (p.done ? '#9CA3AF' : VIOLET) + ';color:#fff;font:700 12px/1 system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid #fff;');
      dot.removeAttribute('aria-hidden');
      dot.setAttribute('data-braindy-pin', '');
      dot.setAttribute('role', 'button'); dot.setAttribute('aria-label', 'Comentario ' + p.n);
      dot.textContent = String(p.n);
      dot.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); tell({ type: 'braindy:pin', id: p.id }); });
      return { id: p.id, selector: p.selector, text: p.text, x: p.x, y: p.y, dot: dot };
    });
    drawPins();
  }
  var frame = 0;
  function onMove() { if (frame) return; frame = requestAnimationFrame(function () { frame = 0; place(); drawPins(); if (picking && hover) hover.style.display = 'none'; }); }
  addEventListener('scroll', onMove, true); addEventListener('resize', onMove);

  addEventListener('message', function (e) {
    if (e.source !== window.parent || ALLOWED.indexOf(e.origin) < 0 || !e.data || typeof e.data.type !== 'string') return;
    parentOrigin = e.origin;
    var d = e.data;
    if (d.type === 'braindy:spot') {
      var node = find(String(d.spot || ''));
      if (node) show(node, d.label);
      tell({ type: 'braindy:spot-result', id: d.id, found: !!node });
    } else if (d.type === 'braindy:comment-mode') { clear(); setPicking(!!d.on); }
    else if (d.type === 'braindy:pins') setPins(d.pins);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
  // Single-page sites change page without reloading: say "ready" again with the new address so the viewer's bar follows.
  var lastHref = location.href;
  function moved() { setTimeout(function () { if (location.href !== lastHref) { lastHref = location.href; ready(); } }, 0); }
  ['pushState', 'replaceState'].forEach(function (k) {
    var orig = history[k];
    history[k] = function () { var r = orig.apply(this, arguments); moved(); return r; };
  });
  window.addEventListener('popstate', moved);
  window.addEventListener('hashchange', moved);
})();
