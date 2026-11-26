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
/** Away this long (another app, a locked phone) counts as coming back to the app. */
const AWAY_MS = 2 * 60 * 1000;
/** Something would be lost by a reload: text being written, or a dialog or side panel open. */
const busy = () => {
  const a = document.activeElement as HTMLElement | null;
  const typing = !!a && (((a instanceof HTMLInputElement || a instanceof HTMLTextAreaElement) && a.value.trim() !== '') || (a.isContentEditable && !!a.textContent?.trim()));
  return typing || !!document.querySelector('[aria-modal="true"]');
};
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
      // Coming back to the app after a while (the installed app is rarely closed, so it never reloads by itself): a new version
      // found then is applied on its own, unless the person is in the middle of something (2026-11-24, Nicolas).
      let returnedAt = 0;
      let hiddenAt = 0;
      const comingBack = () => Date.now() - returnedAt < 30_000;
      const found = (w: ServiceWorker | null) => {
        if (!w || !sw.controller) return;
        waiting = w; set({ update: true });
        if (comingBack() && !busy()) applyUpdate();
      };
      if (reg.waiting) found(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => { if (w.state === 'installed') found(w); });
      });
      // Long-open tabs look for a new version every hour and when they come back to the front.
      setInterval(() => reg.update().catch(() => undefined), 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
        if (hiddenAt && Date.now() - hiddenAt > AWAY_MS) returnedAt = Date.now();
        if (comingBack() && reg.waiting && !busy()) { applyUpdate(); return; }
        reg.update().catch(() => undefined);
      });
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
  // Several deploys in a row leave the version we saw replaced by a newer one (2026-11-21: «Update» did nothing), so ask
  // the registration for the one waiting now; if nothing takes over within 3 s, a plain reload still brings the new page.
  const fallback = setTimeout(() => location.reload(), 3000);
  navigator.serviceWorker?.getRegistration().then((reg) => {
    const w = reg?.waiting ?? (waiting?.state === 'installed' ? waiting : null);
    if (w) w.postMessage('SKIP_WAITING');
    else { clearTimeout(fallback); location.reload(); }
  }).catch(() => { clearTimeout(fallback); location.reload(); });
}
