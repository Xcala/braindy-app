/*
 * Braindy bridge: lets Braindy App point at a part of this site while it shows the site in its viewer.
 * Add once to every page: <script src="/braindy-bridge.js" defer></script> (copy this file into the site).
 * Inert outside an iframe and for any parent that is not Braindy App. It only reads the page; it never changes content.
 * Messages: parent → { type: 'braindy:spot', id, spot, label }; frame → { type: 'braindy:ready', url } and
 * { type: 'braindy:spot-result', id, found }.
 */
(function () {
  if (window.parent === window) return;
  var ALLOWED = ['https://app.braindy.co', 'https://braindy-app-staging.web.app', 'http://localhost:5174'];
  // A message aimed at an origin the parent does not have is dropped by the browser, so "ready" goes to each allowed one.
  function ready() { ALLOWED.forEach(function (o) { window.parent.postMessage({ type: 'braindy:ready', url: location.href }, o); }); }

  var fold = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); };

  /** The element a spot names: a CSS selector, else the smallest visible element whose text (or image alt) contains it. */
  function find(spot) {
    // Selectors first (#contacto, .hero, h1); plain words that are not tags match nothing and fall through to text.
    try { var el = document.querySelector(spot); if (el && el !== document.body) return el; } catch (e) { /* not a selector */ }
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

  var box = null, label = null, target = null, timer = 0;
  function place() {
    if (!target || !box) return;
    var r = target.getBoundingClientRect();
    box.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;border-radius:10px;transition:all .25s ease;'
      + 'box-shadow:0 0 0 3px #8B5CF6,0 0 0 9999px rgba(10,10,30,.28);'
      + 'left:' + (r.left - 6) + 'px;top:' + (r.top - 6) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px;';
    label.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;background:#8B5CF6;color:#fff;'
      + 'font:700 12px/1 system-ui,sans-serif;padding:5px 8px;border-radius:6px;'
      + 'left:' + Math.max(4, r.left - 6) + 'px;top:' + Math.max(4, r.top - 30) + 'px;';
  }
  function clear() {
    if (box) box.remove(); if (label) label.remove();
    box = label = target = null;
    removeEventListener('scroll', place, true); removeEventListener('resize', place);
  }
  function show(el, text) {
    clear();
    target = el;
    box = document.createElement('div'); label = document.createElement('div');
    label.textContent = text || 'Braindy';
    box.setAttribute('aria-hidden', 'true'); label.setAttribute('aria-hidden', 'true');
    document.body.appendChild(box); document.body.appendChild(label);
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    place();
    addEventListener('scroll', place, true); addEventListener('resize', place);
    clearTimeout(timer); timer = setTimeout(clear, 12000);
  }

  addEventListener('message', function (e) {
    if (e.source !== window.parent || ALLOWED.indexOf(e.origin) < 0 || !e.data || e.data.type !== 'braindy:spot') return;
    var el = find(String(e.data.spot || ''));
    if (el) show(el, e.data.label);
    window.parent.postMessage({ type: 'braindy:spot-result', id: e.data.id, found: !!el }, e.origin);
  });
  addEventListener('click', function () { if (target) clear(); }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
