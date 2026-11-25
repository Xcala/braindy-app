// First-party usage analytics (decided 2026-11-24): counts which pages people open so the tabs are chosen with data.
// Page views are batched in memory and sent to our own API (/v1/usage) every ~30 s and when the page is hidden.
// Sends only a page pattern (ids removed), its section, the current brand, the device and the day: no uid, no third
// parties. The API adds the role (admin/client) from the profile and keeps aggregate counters only.
import { useEffect } from 'react';
import { getToken } from 'firebase/app-check';
import { appCheck, auth } from './firebase';
import { sectionOfPath } from '../team/sections';
import { useBrands } from '../brands/BrandProvider';

const API_URL = import.meta.env.VITE_API_URL ?? '';
const EVERY = 30_000;
const MAX_ITEMS = 50;
const WORD = /^[a-z][a-z-]{0,29}$/;

type Item = { path: string; section: string; brandId: string; device: 'phone' | 'desktop'; day: string; n: number };

const queue = new Map<string, Item>();
let started = false;
// Cached so the last batch can leave synchronously while the page is closing (pagehide cannot wait for a token).
let idToken: string | null = null;
let checkToken: string | null = null;

/** /requests/AbC123 → /requests/:id. Keeps plain lowercase words (brand/docs, learn/files-tour), at most 3 segments. */
export function pathPattern(pathname: string): string {
  const segs = pathname.split('/').filter(Boolean).slice(0, 3);
  if (!segs.length) return '/home';
  if (segs[0] === 'open') return '/open/:brand/:asset';
  const idAt = (i: number) => (segs[0] === 'requests' && i === 1 && segs[1] !== 'approve') || (segs[0] === 'admin' && segs[1] === 'proposals' && i === 2);
  return `/${segs.map((s, i) => (!idAt(i) && WORD.test(s) ? s : ':id')).join('/')}`;
}

function sectionOf(pathname: string): string {
  const first = pathname.split('/')[1] || 'home';
  return sectionOfPath(pathname) ?? (WORD.test(first) ? first.replace(/-/g, '') : 'other');
}

const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function refreshTokens() {
  idToken = (await auth.currentUser?.getIdToken().catch(() => null)) ?? null;
  checkToken = appCheck ? ((await getToken(appCheck).catch(() => null))?.token ?? null) : null;
}

/** Sends what is queued. keepalive lets the request finish after the page is gone (sendBeacon cannot carry the auth header). */
function send() {
  if (!queue.size || !idToken) return;
  const items = [...queue.values()].slice(0, MAX_ITEMS);
  queue.clear();
  fetch(`${API_URL}/v1/usage`, {
    method: 'POST', keepalive: true,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}`, ...(checkToken ? { 'X-Firebase-AppCheck': checkToken } : {}) },
    body: JSON.stringify({ items }),
  }).catch(() => { /* analytics never bother the person */ });
}

async function flush() {
  if (!queue.size) return;
  await refreshTokens();
  send();
}

function start() {
  if (started) return;
  started = true;
  void refreshTokens();
  window.setInterval(() => { void flush(); }, EVERY);
  window.addEventListener('pagehide', send);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') send(); });
}

export function recordPageView(pathname: string, brandId: string | undefined) {
  const item: Omit<Item, 'n'> = {
    path: pathPattern(pathname), section: sectionOf(pathname), brandId: brandId ?? 'none',
    device: window.innerWidth < 768 ? 'phone' : 'desktop', day: localDay(),
  };
  const key = `${item.path}|${item.section}|${item.brandId}|${item.device}|${item.day}`;
  const prev = queue.get(key);
  queue.set(key, { ...item, n: (prev?.n ?? 0) + 1 });
  start();
}

/** One page view per route change, once the current brand is known. Off in local dev so it does not pollute the counts. */
export function usePageViews(pathname: string) {
  const { current, loading } = useBrands();
  const brandId = current?.id;
  useEffect(() => {
    if (loading || import.meta.env.DEV) return;
    recordPageView(pathname, brandId);
    // A brand switch alone is not a new page view, so the brand is not a dependency.
  }, [pathname, loading]);
}
