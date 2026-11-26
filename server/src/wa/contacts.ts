// Phone → person index for the WhatsApp channel (waContacts/{phone}, backend only). A person registers their
// own number with consent (opt-in) in Settings; the brand's notice number links to its approver.
import { Hono } from 'hono';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { normalizePhone } from '../whatsapp.js';
import type { AuthEnv } from '../auth.js';

export type Contact = {
  uid?: string | null; optIn?: boolean; silent?: boolean; lastInboundAt?: Timestamp; politeAt?: Timestamp; lang?: 'es' | 'en';
  state?: { awaitNote?: string; pending?: Pending; offer?: Offer } | null;
  /** The WhatsApp agent stays quiet with this number until then (NickMark is talking or took over). */
  agentPausedUntil?: Timestamp | null;
  lastRequest?: { brandId: string; requestId: string; at: Timestamp } | null;
};
/** A request the agent offered to create; the person confirms with a button. */
export type Offer = { brandId: string; title: string; text: string; media: Pending['media']; at: number };
export type Pending = { text: string; media: Array<{ id: string; name: string; contentType: string }>; at: number };

export const contactRef = (phone: string) => db.doc(`waContacts/${phone}`);
const now = () => FieldValue.serverTimestamp();
const DAY = 864e5;

export async function getContact(phone: string) {
  const s = await contactRef(phone).get();
  return s.exists ? (s.data() as Contact) : null;
}

/** True while the person wrote in the last 24 h: free text and buttons are allowed without a template. */
export const windowOpen = (c: Contact | null) => !!c?.lastInboundAt && Date.now() - c.lastInboundAt.toMillis() < DAY - 5 * 60_000;

/** Links a number to a person (replacing any previous number of that person). */
export async function linkPhone(phone: string, uid: string, source: 'self' | 'settings' | 'admin') {
  const user = db.doc(`users/${uid}`);
  const old = ((await user.get()).get('whatsapp.phone') as string) || '';
  const batch = db.batch();
  if (old && old !== phone) batch.set(contactRef(old), { uid: null, optIn: false }, { merge: true });
  batch.set(contactRef(phone), { uid, optIn: true, optInAt: now(), source }, { merge: true });
  batch.set(user, { whatsapp: { phone, optIn: true } }, { merge: true });
  await batch.commit();
}

export async function unlinkPhone(uid: string) {
  const user = db.doc(`users/${uid}`);
  const old = ((await user.get()).get('whatsapp.phone') as string) || '';
  const batch = db.batch().set(user, { whatsapp: FieldValue.delete() }, { merge: true });
  if (old) batch.set(contactRef(old), { uid: null, optIn: false }, { merge: true });
  await batch.commit();
}

/**
 * WhatsApp access per brand: a member may use the channel unless NickMark turned it off (members/{uid}.whatsapp).
 * As everywhere else, the nearest membership decides: the brand's own, else the group above it (brand.ancestors).
 */
export async function waAllowed(uid: string, brandId: string) {
  const brand = await db.doc(`brands/${brandId}`).get();
  for (const id of [brandId, ...((brand.get('ancestors') as string[]) ?? [])]) {
    const m = await db.doc(`brands/${id}/members/${uid}`).get();
    if (m.exists) return m.get('whatsapp') !== false;
  }
  return false;
}

/**
 * Brands a person can ask for by WhatsApp, with the channel on: direct memberships on their profile and, for a group,
 * every company below it (whoever has the group has its companies). A group itself never takes requests.
 */
export async function brandsOf(uid: string): Promise<Array<{ id: string; name: string }>> {
  const direct = (((await db.doc(`users/${uid}`).get()).get('brandIds') as string[]) ?? []).slice(0, 10);
  const firsts = await Promise.all(direct.map((id) => db.doc(`brands/${id}`).get()));
  // Companies are found by their ancestors (always set on create), so a company added to the group later counts at once.
  const below = await Promise.all(firsts.map(async (d) => d.get('kind') === 'group'
    ? (await db.collection('brands').where('ancestors', 'array-contains', d.id).limit(30).get()).docs.map((x) => x.id) : [d.id]));
  const ids = [...new Set(below.flat())].slice(0, 30);
  const docs = await Promise.all(ids.map((id) => db.doc(`brands/${id}`).get()));
  const open = await Promise.all(docs.map((d) => waAllowed(uid, d.id)));
  return docs.filter((d, i) => open[i] && d.exists && d.get('kind') !== 'group' && d.get('status') !== 'archived')
    .map((d) => ({ id: d.id, name: String(d.get('name') ?? d.id) }));
}

// ---------- signed-in: my own number ----------
export const meWhatsapp = new Hono<AuthEnv>();

meWhatsapp.get('/me/whatsapp', async (c) => {
  const w = (await db.doc(`users/${c.get('user').uid}`).get()).get('whatsapp') as { phone?: string; optIn?: boolean } | undefined;
  return c.json({ phone: w?.phone ?? '', optIn: w?.optIn === true });
});

meWhatsapp.put('/me/whatsapp', async (c) => {
  const uid = c.get('user').uid;
  const b = await c.req.json<{ phone?: string; optIn?: boolean }>().catch(() => ({} as { phone?: string; optIn?: boolean }));
  if (!b.phone) { await unlinkPhone(uid); return c.json({ ok: true }); }
  const phone = normalizePhone(b.phone);
  if (!phone) return c.json({ error: 'invalid_phone' }, 400);
  if (b.optIn !== true) return c.json({ error: 'consent_required' }, 400);
  const taken = (await contactRef(phone).get()).get('uid') as string | null | undefined;
  if (taken && taken !== uid) return c.json({ error: 'phone_taken' }, 409);
  await linkPhone(phone, uid, 'self');
  await db.collection('audit').doc().set({ type: 'whatsapp_linked', uid, phoneLast4: phone.slice(-4), at: now() });
  return c.json({ ok: true, phone });
});
