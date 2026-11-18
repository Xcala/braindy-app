import { useEffect, useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../lib/api';

// Sign-in by WhatsApp: the server spends a one-time link and hands back a token for Firebase.

/** Spends the link (once) and signs in. Throws with status 410 (used/expired) or 404 (unknown). */
export async function enterWithLink(token: string) {
  const r = await api<{ customToken: string }>(`/public/access/${encodeURIComponent(token)}`, { method: 'POST', body: '{}' });
  await signInWithCustomToken(auth, r.customToken);
}

let cached: Promise<string | null> | null = null;
/** The Braindy WhatsApp number (digits), or null while unknown. */
export function useBraindyNumber() {
  const [n, setN] = useState<string | null>(null);
  useEffect(() => {
    cached ??= api<{ number: string | null }>('/public/access-number').then((r) => r.number, () => null);
    let live = true;
    cached.then((x) => { if (live) setN(x); });
    return () => { live = false; };
  }, []);
  return n;
}

export const waChat = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
