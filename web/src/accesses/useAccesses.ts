import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, type Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/api';

export type Access = {
  id: string; platform: string; username?: string; link?: string; notes?: string; hasSecret?: boolean;
  sharedWithBraindy?: boolean; subscription?: Subscription | null; signIn?: SignIn; group?: string; order?: number;
  /** What it is for, who pays it, when it renews and whether it is in use (2026-11-20: the old «apps» cards of Mi plan live here now). */
  purpose?: string; payer?: Payer | null; renews?: string | null; status?: AppStatus; updatedByName?: string; updatedAt?: Timestamp; lastRevealedAt?: Timestamp;
};
/** How people get in: their own password, a Google / Microsoft (Outlook) / Facebook account with nothing to keep here, or
 *  nothing at all (a public page, a QR). */
export type SignIn = 'password' | 'google' | 'microsoft' | 'facebook' | 'none';
const GOOGLE_HOST = /(^|\.)(analytics|ads|tagmanager|business|search|marketingplatform|lookerstudio|datastudio|merchants|console\.cloud|firebase)\.google\.com$|(^|\.)(youtube\.com|google\.com\/(analytics|ads))/i;
const FACEBOOK_HOST = /(^|\.)(facebook|fb|instagram|meta)\.com$/i;
const hostOf = (link?: string) => { try { return new URL(link!.startsWith('http') ? link! : `https://${link}`).host; } catch { return ''; } };
/** The saved choice; older accesses only said it in the notes ("ingresa con google"). An old entry saved as «password» with
 *  no password kept falls back to what its link says: Google Analytics or Ads is entered with Google, Meta with Facebook
 *  (audit C3, 2026-11-26). Gmail keeps its password. */
export const signInOf = (a: Pick<Access, 'signIn' | 'notes' | 'link' | 'platform' | 'hasSecret'>): SignIn => {
  if (a.signIn && a.signIn !== 'password') return a.signIn;
  const notes = a.notes ?? '';
  const said: SignIn | null = /\bgoogle\b/i.test(notes) ? 'google' : /\b(outlook|microsoft|hotmail)\b/i.test(notes) ? 'microsoft' : /\bfacebook\b/i.test(notes) ? 'facebook' : null;
  if (said && (!a.signIn || !a.hasSecret)) return said;
  if (a.hasSecret) return 'password';
  const host = hostOf(a.link);
  if (/^mail\.google\.com$/i.test(host)) return 'password';
  if (GOOGLE_HOST.test(host) || /\b(google analytics|ga4|google ads|tag manager|search console|google business)\b/i.test(a.platform ?? '')) return 'google';
  if (FACEBOOK_HOST.test(host) || /\b(meta|facebook|instagram)\b/i.test(a.platform ?? '')) return 'facebook';
  return 'password';
};
/** A paid plan on the platform: shown in its own column and added up below the table. */
export type Subscription = { plan?: string; price?: number | null; currency?: 'USD' | 'COP' | 'EUR'; period?: 'month' | 'year' | 'usage' | 'once' };
export type Payer = 'braindy' | 'client';
export type AppStatus = 'active' | 'paused' | 'cancelled';
export type AccessEvent = { id: string; platform: string; action: 'added' | 'updated' | 'deleted' | 'revealed' | 'copied'; byName: string; at?: Timestamp };

/** Credential metadata of a brand. `denied` = the user is not an owner (rules refuse the read). */
export function useAccesses(brandId?: string) {
  const [state, setState] = useState<{ list: Access[]; loading: boolean; denied: boolean }>({ list: [], loading: true, denied: false });
  useEffect(() => {
    if (!brandId) return;
    setState({ list: [], loading: true, denied: false });
    return onSnapshot(query(collection(db, 'brands', brandId, 'accesses'), orderBy('platform')),
      (s) => setState({ list: s.docs.map((d) => ({ id: d.id, ...d.data() }) as Access), loading: false, denied: false }),
      () => setState({ list: [], loading: false, denied: true }));
  }, [brandId]);
  return state;
}

export function useAccessLog(brandId?: string, max = 8) {
  const [events, setEvents] = useState<AccessEvent[]>([]);
  useEffect(() => {
    if (!brandId) return;
    return onSnapshot(query(collection(db, 'brands', brandId, 'accessLog'), orderBy('at', 'desc'), limit(max)),
      (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() }) as AccessEvent)), (e) => { console.warn('accessLog', e.code); setEvents([]); });
  }, [brandId, max]);
  return events;
}

const base = (brandId: string) => `/v1/brands/${encodeURIComponent(brandId)}/accesses`;
export type AccessInput = { platform: string; username: string; password?: string; link?: string; notes?: string; sharedWithBraindy?: boolean; subscription?: Subscription | null; signIn?: SignIn; group?: string; purpose?: string; payer?: Payer | null; renews?: string | null; status?: AppStatus };

export const accessesApi = {
  add: (brandId: string, a: AccessInput) => api<{ id: string }>(base(brandId), { method: 'POST', body: JSON.stringify(a) }),
  update: (brandId: string, id: string, a: Partial<AccessInput>) => api(`${base(brandId)}/${id}`, { method: 'PATCH', body: JSON.stringify(a) }),
  remove: (brandId: string, id: string) => api(`${base(brandId)}/${id}`, { method: 'DELETE' }),
  reveal: (brandId: string, id: string) => api<{ value: string; seconds: number }>(`${base(brandId)}/${id}/reveal`, { method: 'POST', body: '{}' }),
  /** Ids top to bottom after a drag, and the new group of the one that changed group. */
  reorder: (brandId: string, ids: string[], groups: Record<string, string>) => api(`/v1/brands/${encodeURIComponent(brandId)}/accesses-order`, { method: 'POST', body: JSON.stringify({ ids, groups }) }),
  copied: (brandId: string, id: string) => api(`${base(brandId)}/${id}/copied`, { method: 'POST', body: '{}' }),
};
