import { api } from '../lib/api';

/** Alerts on this device (Web Push through Braindy's own service worker). */
export type PushState = 'unsupported' | 'needsInstall' | 'blocked' | 'off' | 'on';

const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const hasPush = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function registration() {
  if (!('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

export async function pushState(): Promise<PushState> {
  // iPhone only allows alerts for an app added to the home screen.
  if (isIos() && !standalone()) return 'needsInstall';
  if (!hasPush() || !import.meta.env.PROD) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  const reg = await registration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

const toKey = (b64: string) => {
  const s = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (ch) => ch.charCodeAt(0));
};

/** Asks the browser for permission (must run from a tap) and registers this device. */
export async function enablePush(lang: 'es' | 'en'): Promise<PushState> {
  if (!hasPush()) return 'unsupported';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'blocked' : 'off';
  const { key } = await api<{ key: string | null }>('/v1/push/key');
  if (!key) throw new Error('no_key');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(key) });
  await api('/v1/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub.toJSON(), lang }) });
  return 'on';
}

export async function disablePush(): Promise<PushState> {
  const sub = await (await registration())?.pushManager.getSubscription();
  if (sub) {
    await api('/v1/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => undefined);
    await sub.unsubscribe().catch(() => undefined);
  }
  return 'off';
}

export const pushApi = {
  prefs: () => api<{ off: string[]; devices: string[] }>('/v1/push/prefs'),
  setOff: (off: string[]) => api<{ off: string[] }>('/v1/push/prefs', { method: 'PUT', body: JSON.stringify({ off }) }),
  test: () => api<{ sent: number }>('/v1/push/test', { method: 'POST' }),
};
