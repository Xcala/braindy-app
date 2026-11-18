// Sign-in by WhatsApp: a one-time link (app/entrar/<token>) that signs a client in without email or password.
// Only the hash of the token is stored. Opening the link (or WhatsApp's preview fetching it) spends nothing:
// the page spends it with a POST and gets a Firebase custom token back. Invite links last 7 days, re-entry
// links 15 minutes. Admin accounts never sign in this way. Never log tokens or phone numbers.
import { Hono } from 'hono';
import { createHash, randomBytes } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminAuth, db } from './firebase.js';
import { brandAccess } from './access.js';
import { normalizePhone, ownPhoneId, sendTemplate, sendText, waMeLink } from './whatsapp.js';
import { contactRef, getContact, linkPhone, windowOpen } from './wa/contacts.js';
import type { AuthEnv } from './auth.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const LIFE = { invite: 7 * 864e5, login: 15 * 60_000 } as const;
type Kind = keyof typeof LIFE;
const now = () => FieldValue.serverTimestamp();
const hash = (token: string) => createHash('sha256').update(`access:${token}`).digest('hex');
export const accessUrl = (token: string) => `${PUBLIC_BASE}/entrar/${token}`;

const isAdmin = async (uid: string) => (await db.doc(`users/${uid}`).get()).get('role') === 'admin';

export async function createAccessLink(uid: string, kind: Kind, by: string) {
  const token = randomBytes(24).toString('base64url');
  await db.doc(`accessLinks/${hash(token)}`).set({ uid, kind, by, createdAt: now(), usedAt: null, expiresAt: Timestamp.fromMillis(Date.now() + LIFE[kind]) });
  return token;
}

const COPY = {
  es: {
    invite: (brand: string, url: string) => `Hola. NicoMarca te invitó a ${brand} en Braindy, donde ves y apruebas todo el trabajo de tu marca.\n\nEntra con este enlace (sin contraseña): ${url}\n\nSirve una vez y vence en 7 días. Cuando quieras volver a entrar, escríbeme «Quiero entrar».`,
    login: (url: string) => `Aquí está tu enlace para entrar a Braindy: ${url}\n\nSirve una vez y vence en 15 minutos.`,
  },
  en: {
    invite: (brand: string, url: string) => `Hi. NickMark invited you to ${brand} on Braindy, where you see and approve all the work on your brand.\n\nSign in with this link (no password): ${url}\n\nIt works once and expires in 7 days. Whenever you want to come back, write me "Sign in".`,
    login: (url: string) => `Here is your link to sign in to Braindy: ${url}\n\nIt works once and expires in 15 minutes.`,
  },
};

/** "Quiero entrar" / "Sign in" by WhatsApp: true when the message asked for a link (and it was answered). */
export async function replyWithLoginLink(phone: string, text: string, uid: string | null | undefined, lang: 'es' | 'en') {
  if (!/^\s*(quiero entrar|entrar|ingresar|iniciar sesi[oó]n|acceso|sign in|log ?in)\s*[.!]?\s*$/i.test(text)) return false;
  if (!uid || (await isAdmin(uid))) return false; // unknown numbers and admins: the message goes on as usual
  const token = await createAccessLink(uid, 'login', 'whatsapp');
  await sendText(phone, COPY[lang].login(accessUrl(token)));
  await db.collection('audit').doc().set({ type: 'access_link', kind: 'login', uid, via: 'whatsapp_reply', at: now() });
  return true;
}

// ---------- public: spend the link ----------
export const publicAccess = new Hono();

publicAccess.post('/access/:token', async (c) => {
  const ref = db.doc(`accessLinks/${hash(c.req.param('token'))}`);
  const r = await db.runTransaction(async (tx) => {
    const l = await tx.get(ref);
    if (!l.exists) return { error: 'not_found' as const };
    if (l.get('usedAt')) return { error: 'used' as const };
    if ((l.get('expiresAt') as Timestamp).toMillis() < Date.now()) return { error: 'expired' as const };
    tx.update(ref, { usedAt: now() });
    return { uid: String(l.get('uid')), kind: String(l.get('kind')) };
  });
  if ('error' in r) return c.json({ error: r.error }, r.error === 'not_found' ? 404 : 410);
  if (await isAdmin(r.uid)) return c.json({ error: 'not_found' }, 404);
  const customToken = await adminAuth.createCustomToken(r.uid);
  await db.collection('audit').doc().set({ type: 'access_link_used', kind: r.kind, uid: r.uid, at: now() });
  return c.json({ customToken });
});

/** The Braindy WhatsApp number (digits), for the «Sign in with WhatsApp» button. Cached per instance. */
let ownNumber: { digits: string; at: number } | null = null;
publicAccess.get('/access-number', async (c) => {
  if (!ownNumber || Date.now() - ownNumber.at > 864e5) {
    const id = ownPhoneId(); const tok = process.env.WHATSAPP_TOKEN?.trim();
    const api = process.env.WHATSAPP_API_BASE?.trim() || 'https://graph.facebook.com/v21.0';
    const j = id && tok ? await fetch(`${api}/${id}?fields=display_phone_number`, { headers: { Authorization: `Bearer ${tok}` } })
      .then((x) => (x.ok ? x.json() as Promise<{ display_phone_number?: string }> : null)).catch(() => null) : null;
    const digits = String(j?.display_phone_number ?? '').replace(/\D/g, '');
    if (digits) ownNumber = { digits, at: Date.now() };
  }
  return c.json({ number: ownNumber?.digits ?? null });
});

// ---------- signed in: invite a person by WhatsApp ----------
export const accessLinks = new Hono<AuthEnv>();

/**
 * Sends a member of the brand their sign-in link by WhatsApp (linking `phone` first when given). Uses the approved
 * template `access_link`, else a free message inside the 24 h window, else hands back a wa.me link to send by hand.
 */
accessLinks.post('/brands/:brandId/members/:uid/whatsapp-link', async (c) => {
  const { brandId, uid } = c.req.param();
  const by = c.get('user').uid;
  const a = await brandAccess(by, brandId);
  if (!a.admin && a.role !== 'client_owner') return c.json({ error: 'forbidden' }, 403);
  if (!(await db.doc(`brands/${brandId}/members/${uid}`).get()).exists) return c.json({ error: 'not_a_member' }, 404);
  if (await isAdmin(uid)) return c.json({ error: 'admin' }, 400);
  const b = await c.req.json<{ phone?: string; lang?: string }>().catch(() => ({} as { phone?: string; lang?: string }));
  const lang = b.lang === 'en' ? 'en' : 'es';
  let phone = ((await db.doc(`users/${uid}`).get()).get('whatsapp.phone') as string) || '';
  if (b.phone?.trim()) {
    const p = normalizePhone(b.phone);
    if (!p) return c.json({ error: 'invalid_phone' }, 400);
    const taken = (await contactRef(p).get()).get('uid') as string | null | undefined;
    if (taken && taken !== uid) return c.json({ error: 'phone_taken' }, 409);
    if (p !== phone) await linkPhone(p, uid, 'admin');
    phone = p;
  }
  if (!phone) return c.json({ error: 'no_phone' }, 400);
  const brand = String((await db.doc(`brands/${brandId}`).get()).get('name') ?? 'Braindy');
  const token = await createAccessLink(uid, 'invite', by);
  const text = COPY[lang].invite(brand, accessUrl(token));
  let sent = (await sendTemplate(phone, 'access_link', lang, [brand], token)).sent;
  if (!sent && windowOpen(await getContact(phone))) sent = (await sendText(phone, text)).sent;
  await db.collection('audit').doc().set({ type: 'access_link', kind: 'invite', brandId, uid, by, sent, phoneLast4: phone.slice(-4), at: now() });
  return c.json(sent ? { sent: true } : { sent: false, waMe: waMeLink(phone, text) });
});
