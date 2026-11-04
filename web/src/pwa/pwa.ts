import { useSyncExternalStore } from 'react';

/** What the page knows about installing and updating Braindy. One small store; components read it with usePwa(). */
type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type State = { canInstall: boolean; ios: boolean; installed: boolean; update: boolean; offline: boolean };

const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
// iPhone and iPad Safari have no install prompt: people add it from Share › Add to Home Screen.
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let state: State = { canInstall: false, ios: false, installed: false, update: false, offline: false };
let deferred: BeforeInstall | null = null;
let waiting: ServiceWorker | null = null;
// Set when the person taps Update: the first install also changes the controller and must not reload the page.
let asked = false;
const subs = new Set<() => void>();
const set = (p: Partial<State>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };

/** Called once from main.tsx, before React: the install prompt fires early and would be lost otherwise. */
export function installPwa() {
  set({ installed: standalone(), ios: isIos() && !standalone(), offline: !navigator.onLine });
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as BeforeInstall; set({ canInstall: true }); });
  addEventListener('appinstalled', () => { deferred = null; set({ canInstall: false, installed: true }); });
  addEventListener('online', () => set({ offline: false }));
  addEventListener('offline', () => set({ offline: true }));

  // Only the built app has a worker; in development it would serve stale files.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  sw.addEventListener('controllerchange', () => { if (asked) { asked = false; location.reload(); } });
  addEventListener('load', () => {
    sw.register('/sw.js').then((reg) => {
      const found = (w: ServiceWorker | null) => { if (w && sw.controller) { waiting = w; set({ update: true }); } };
      if (reg.waiting) found(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => { if (w.state === 'installed') found(w); });
      });
      // Long-open tabs look for a new version every hour and when they come back to the front.
      setInterval(() => reg.update().catch(() => undefined), 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => undefined); });
    }).catch(() => undefined);
  });
}

export const usePwa = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state);

/** Shows the browser's install dialog. false when the browser has none (iPhone: show the steps instead). */
export async function promptInstall() {
  if (!deferred) return false;
  await deferred.prompt();
  await deferred.userChoice.catch(() => undefined);
  deferred = null;
  set({ canInstall: false });
  return true;
}

/** Switches to the waiting version; the page reloads when it takes over. */
export function applyUpdate() {
  asked = true;
  if (waiting) waiting.postMessage('SKIP_WAITING');
  else location.reload();
}
