/* Braindy service worker. Built by vite.config.ts, which fills in VERSION and PRECACHE.
 *
 * What it does, and what it never does:
 * - Pages: network first (a deploy shows up at once); offline it falls back to the saved app shell.
 * - /assets/* (hashed, immutable): cache first, so the app opens fast and works offline.
 * - Never touches data: Firestore, Storage, the API, Auth and anything on another origin go straight to the network,
 *   so nothing private is ever kept in this cache.
 * - A new version waits until the person taps "Update" (the page posts SKIP_WAITING), so an open tab never mixes versions.
 */
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const SHELL = 'braindy-shell-' + VERSION;
const ASSETS = 'braindy-assets';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = new Set([SHELL, ASSETS]);
    for (const k of await caches.keys()) if (k.startsWith('braindy-') && !keep.has(k)) await caches.delete(k);
    // Hashed files the current shell no longer lists are dropped, so the cache does not grow forever.
    const live = new Set(PRECACHE.map((p) => new URL(p, self.location.origin).href));
    const assets = await caches.open(ASSETS);
    for (const req of await assets.keys()) if (!live.has(req.url)) await assets.delete(req);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Firebase reserved paths (auth handler, init.json) are always live.
  if (url.pathname.startsWith('/__/')) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        return await fetch(req);
      } catch {
        const shell = await caches.open(SHELL);
        return (await shell.match('/index.html')) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    e.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) (await caches.open(ASSETS)).put(req, res.clone());
      return res;
    })());
    return;
  }

  // Icons and the manifest: from the shell when there, else the network.
  if (PRECACHE.includes(url.pathname)) e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});

// Alerts (Web Push from braindy-api). The payload is { title, body, url, tag }; same tag replaces the older alert.
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Braindy', {
    body: d.body || '', tag: d.tag || undefined, renotify: !!d.tag,
    icon: '/icon-192.png', badge: '/favicon-32.png', data: { url: d.url || '/home' },
  }));
});

// Tapping an alert opens its page: in the open app when there is one, else a new window.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = new URL((e.notification.data && e.notification.data.url) || '/home', self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const win = wins.find((w) => new URL(w.url).origin === self.location.origin);
    if (win) { await win.focus(); return win.navigate ? win.navigate(target).catch(() => win.postMessage({ type: 'bd:open', url: target })) : win.postMessage({ type: 'bd:open', url: target }); }
    return self.clients.openWindow(target);
  })());
});
