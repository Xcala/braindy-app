// Alerts on the person's phone or computer (standard Web Push, no extra service). Each device a person turns
// alerts on is one doc in pushSubs (server only; the rules deny it to everyone). A person can switch off kinds
// of alerts (users/{uid}.pushOff). Dead devices (404/410 from the push service) are dropped on the next send.
// Never log endpoints, keys or message text: only counts.
import { createHash } from 'node:crypto';
import webpush from 'web-push';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';

/** Admin kinds: requests, decisions. Client kinds: deliveries, done, due. Both: comments. */
export const PUSH_KINDS = ['requests', 'comments', 'decisions', 'deliveries', 'done', 'due'] as const;
export type PushKind = (typeof PUSH_KINDS)[number];
export type Lang = 'es' | 'en';
/** What a device shows. Text per language, chosen by the language the device was turned on in. */
export type PushMsg = { kind: PushKind; tag: string; url: string; title: Record<Lang, string>; body: Record<Lang, string> };

const pub = () => process.env.VAPID_PUBLIC_KEY?.trim() ?? '';
let ready = false;
function setup() {
  if (ready) return true;
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!pub() || !priv) return false;
  webpush.setVapidDetails('https://app.braindy.co', pub(), priv);
  return (ready = true);
}
export const publicKey = () => pub() || null;
export const subId = (endpoint: string) => createHash('sha256').update(endpoint).digest('hex').slice(0, 40);

type Sub = { uid: string; endpoint: string; keys: { p256dh: string; auth: string }; lang?: Lang };

async function subsOf(uids: string[]) {
  const out: Array<{ id: string; s: Sub }> = [];
  for (let i = 0; i < uids.length; i += 30) {
    const q = await db.collection('pushSubs').where('uid', 'in', uids.slice(i, i + 30)).get();
    q.docs.forEach((d) => out.push({ id: d.id, s: d.data() as Sub }));
  }
  return out;
}

/** People who switched this kind off are skipped. Never throws: an alert must not break what triggered it. */
export async function pushTo(uids: string[], msg: PushMsg, opts: { ignorePrefs?: boolean } = {}) {
  const unique = [...new Set(uids.filter(Boolean))];
  if (!unique.length || !setup()) return { sent: 0, dropped: 0 };
  try {
    const users = await db.getAll(...unique.map((u) => db.doc(`users/${u}`)));
    const want = new Set(users.filter((u) => opts.ignorePrefs || !((u.get('pushOff') as string[] | undefined) ?? []).includes(msg.kind)).map((u) => u.id));
    const subs = (await subsOf([...want]));
    let sent = 0; let dropped = 0;
    await Promise.all(subs.map(async ({ id, s }) => {
      const lang: Lang = s.lang === 'en' ? 'en' : 'es';
      const payload = JSON.stringify({ title: msg.title[lang], body: msg.body[lang].slice(0, 180), url: msg.url, tag: msg.tag });
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 86400, urgency: 'high' });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) { dropped++; await db.doc(`pushSubs/${id}`).delete().catch(() => undefined); }
        else console.warn('push send failed', JSON.stringify({ kind: msg.kind, code: code ?? null }));
      }
    }));
    if (sent) await Promise.all(subs.map(({ id }) => db.doc(`pushSubs/${id}`).update({ lastSentAt: FieldValue.serverTimestamp() }).catch(() => undefined)));
    return { sent, dropped };
  } catch (e) {
    console.warn('push failed', msg.kind, String(e));
    return { sent: 0, dropped: 0 };
  }
}

// ---------- who gets what ----------
let admins: { uids: string[]; at: number } | null = null;
export async function adminUids() {
  if (!admins || Date.now() - admins.at > 10 * 60_000) {
    const q = await db.collection('users').where('role', '==', 'admin').select().get();
    admins = { uids: q.docs.map((d) => d.id), at: Date.now() };
  }
  return admins.uids;
}

/** People of the brand (and of the group above it) who see its requests. */
export async function brandPeople(brandId: string) {
  const brand = await db.doc(`brands/${brandId}`).get();
  const ids = [brandId, ...(brand.get('groupId') ? [String(brand.get('groupId'))] : [])];
  const out: string[] = [];
  for (const id of ids) {
    const m = await db.collection(`brands/${id}/members`).get();
    m.docs.forEach((d) => {
      const sections = d.get('sections') as string[] | undefined;
      if (!Array.isArray(sections) || sections.includes('requests')) out.push(d.id);
    });
  }
  const adm = new Set(await adminUids());
  return { name: String(brand.get('name') ?? ''), uids: [...new Set(out)].filter((u) => !adm.has(u)) };
}
