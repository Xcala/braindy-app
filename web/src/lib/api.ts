import { appCheck, auth } from './firebase';
import { getToken } from 'firebase/app-check';

const API_URL = import.meta.env.VITE_API_URL ?? '';

/** Calls the Braindy backend with the current user's ID token. All AI work goes through here. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const check = appCheck ? (await getToken(appCheck).catch(() => null))?.token : undefined;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(check ? { 'X-Firebase-AppCheck': check } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    // The server's own message (e.g. a validation error) rides after the status, so callers can still match 'API 4xx'.
    const body = await res.json().catch(() => null) as Record<string, unknown> | null;
    const detail = typeof body?.message === 'string' ? body.message : '';
    throw Object.assign(new Error(detail ? `API ${res.status} · ${detail}` : `API ${res.status}`), { status: res.status, body });
  }
  return res.json() as Promise<T>;
}
