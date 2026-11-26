// Requests by email, the same way WhatsApp works: an email to the requests address from a member of a brand
// (sender verified by Google: DMARC or DKIM) becomes a request in that brand, with its attachments in Uploads;
// a reply in the same thread becomes a comment. Several brands: the one the email names, else the last one
// they asked for, else we ask in the thread. Unknown or unverified senders land in the admin-only mail inbox,
// never in a brand, and get no automatic reply. Never log bodies or addresses.
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { bucket, createRequest } from '../requests.js';
import { queueWork } from '../autopilot.js';
import { brandsOf } from '../wa/contacts.js';
import { brandNamed } from '../wa/inbound.js';
import { logError } from '../guard.js';
import { addLabel, getAttachment, getMessage, gmailToken, listMessages, mailIntegration, reply, type GMessage } from './gmail.js';
import { addressOf, attachmentsOf, bodyText, cleanSubject, header, senderVerified, type MailFile } from './parse.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const DONE = 'Braindy/Pedido';
const REVIEW = 'Braindy/Revisar';
const now = () => FieldValue.serverTimestamp();
const threadRef = (id: string) => db.doc(`mailThreads/${id}`);
const senderRef = (email: string) => db.doc(`mailSenders/${email.replace(/[/]/g, '_')}`);

const COPY = {
  received: (t: string, url: string) => `Hola,\n\nRecibido. NicoMarca y su equipo ya tienen tu solicitud «${t}».\nSíguela aquí: ${url}\n\nSi quieres agregar algo, responde a este correo.\n\nBraindy`,
  which: (names: string[]) => `Hola,\n\nRecibido. ¿Para qué marca es? Responde a este correo con el nombre: ${names.join(' o ')}.\n\nBraindy`,
  quota: 'Hola,\n\nRecibimos tu correo, pero los ajustes del sitio de este mes ya se usaron. NicoMarca te escribe para ver cómo seguir.\n\nBraindy',
  failed: 'Hola,\n\nNo pude registrar tu solicitud. NicoMarca ya lo sabe y te escribe pronto.\n\nBraindy',
};

/** The person with this verified address in Braindy (users/{uid}.email), if any. */
async function personOf(email: string): Promise<string | null> {
  const s = await db.collection('users').where('email', '==', email).limit(1).get();
  return s.docs[0]?.id ?? null;
}

async function saveFiles(brandId: string, uid: string, messageId: string, files: MailFile[]) {
  const out: Array<{ assetId: string; name: string; size: number; contentType: string }> = [];
  for (const f of files) {
    const bytes = await getAttachment(messageId, f.attachmentId).catch(() => null);
    if (!bytes) continue;
    const assetId = `upl-${randomUUID()}`;
    const storagePath = `brands/${brandId}/uploads/${assetId}/${f.name}`;
    await bucket().file(storagePath).save(bytes, { contentType: f.contentType, resumable: false });
    await db.doc(`brands/${brandId}/assets/${assetId}`).set({
      type: 'file', source: 'upload', via: 'email', title: f.name, folder: 'Uploads', storagePath, size: bytes.length, contentType: f.contentType,
      status: 'published', uploadedBy: uid, createdAt: now(), uploadedAt: now(),
    });
    out.push({ assetId, name: f.name, size: bytes.length, contentType: f.contentType });
  }
  return out;
}

async function comment(brandId: string, requestId: string, uid: string, m: GMessage, text: string) {
  const files = await saveFiles(brandId, uid, m.id, attachmentsOf(m));
  const ref = db.doc(`brands/${brandId}/requests/${requestId}`);
  await db.batch()
    .set(ref.collection('comments').doc(), { author: uid, text: text || (files.length ? `📎 ${files.map((f) => f.name).join(', ')}` : ''), files, kind: 'comment', source: 'email', createdAt: now() })
    .update(ref, { updatedAt: now() })
    .commit();
  const r = await ref.get();
  // On free action, a follow-up on finished work (not yet approved) puts the Brains back on it.
  if (r.get('work.state') === 'done' && r.get('status') !== 'approved' && r.get('status') !== 'published') await queueWork(brandId, requestId, 'comment');
}

async function fileRequest(m: GMessage, uid: string, email: string, brandId: string, title: string, text: string, extra: GMessage[] = []) {
  const files = (await Promise.all([m, ...extra].map((x) => saveFiles(brandId, uid, x.id, attachmentsOf(x))))).flat();
  const r = await createRequest(brandId, uid, { title, source: 'email', cards: { product: { text: text || title, files } } });
  const to = header(m, 'From'), subject = header(m, 'Subject'), msgId = header(m, 'Message-ID');
  if ('error' in r) {
    await reply(to, subject, m.threadId, msgId, r.error === 'quota' ? COPY.quota : COPY.failed).catch(() => null);
    return false;
  }
  await threadRef(m.threadId).set({ uid, brandId, requestId: r.requestId, pending: FieldValue.delete(), at: now() }, { merge: true });
  await senderRef(email).set({ uid, lastBrandId: brandId, at: now() }, { merge: true });
  await reply(to, subject, m.threadId, msgId, COPY.received(title, `${PUBLIC_BASE}/requests/${r.requestId}`)).catch((e) => logError(e, { where: 'mail-reply' }));
  return true;
}

async function toInbox(m: GMessage, email: string, reason: 'unknown' | 'unverified' | 'no_brand') {
  await db.doc(`mailInbox/${m.id}`).set({ from: email, subject: cleanSubject(header(m, 'Subject')), reason, status: 'new', at: now() });
  await addLabel(m.id, REVIEW).catch(() => null);
}

type Outcome = 'filed' | 'comment' | 'asked' | 'inbox' | 'skipped';

export async function handleMail(m: GMessage): Promise<Outcome> {
  const email = addressOf(header(m, 'From'));
  if (!email) return 'skipped';
  if (!senderVerified(m, email)) { await toInbox(m, email, 'unverified'); return 'inbox'; }
  const uid = await personOf(email);
  if (!uid) { await toInbox(m, email, 'unknown'); return 'inbox'; }
  const brands = await brandsOf(uid);
  if (brands.length === 0) { await toInbox(m, email, 'no_brand'); return 'inbox'; }

  const subject = cleanSubject(header(m, 'Subject'));
  const body = bodyText(m);
  const thread = await threadRef(m.threadId).get();

  // A reply in the thread of a request → comment on it, silently.
  if (thread.get('requestId') && brands.some((b) => b.id === thread.get('brandId'))) {
    await comment(thread.get('brandId'), thread.get('requestId'), uid, m, body);
    return 'comment';
  }
  // We asked which brand: this reply names it; the request carries the first email's text and files.
  const pending = thread.get('pending') as { messageId: string; title: string; text: string } | undefined;
  if (pending) {
    const named = brandNamed(`${subject} ${body}`, brands);
    if (!named) return 'skipped';
    const first = await getMessage(pending.messageId).catch(() => null);
    return (await fileRequest(m, uid, email, named.id, pending.title, pending.text, first ? [first] : [])) ? 'filed' : 'inbox';
  }

  const title = subject || body.split('\n')[0].slice(0, 80) || 'Solicitud por correo';
  const text = subject && body ? `${subject}\n\n${body}` : body || subject;
  const lastBrandId = (await senderRef(email).get()).get('lastBrandId');
  const usual = brands.find((b) => b.id === lastBrandId);
  const pick = brands.length === 1 ? brands[0] : brandNamed(text, brands) ?? usual;
  if (pick) return (await fileRequest(m, uid, email, pick.id, title, text)) ? 'filed' : 'inbox';

  await threadRef(m.threadId).set({ uid, pending: { messageId: m.id, title, text }, at: now() }, { merge: true });
  await reply(header(m, 'From'), header(m, 'Subject'), m.threadId, header(m, 'Message-ID'), COPY.which(brands.map((b) => b.name))).catch(() => null);
  return 'asked';
}

/** Cron (every 2 minutes): new emails to the requests address. Each message is handled once (mailSeen). */
export async function checkInbox() {
  const integ = await mailIntegration().get();
  const address = String(integ.get('address') ?? '').trim().toLowerCase();
  if (!address || !(await gmailToken())) return { mail: 'not_connected' as const };
  const q = `{to:${address} cc:${address} deliveredto:${address}} newer_than:3d -label:${DONE.replace('/', '-')} -label:${REVIEW.replace('/', '-')} -from:me`;
  const list = await listMessages(q, 20);
  const counts: Record<Outcome, number> = { filed: 0, comment: 0, asked: 0, inbox: 0, skipped: 0 };
  for (const { id } of list.reverse()) {
    try {
      await db.doc(`mailSeen/${id}`).create({ at: now() });
    } catch { continue; } // another run took it
    try {
      const m = await getMessage(id);
      const out = await handleMail(m);
      counts[out]++;
      if (out !== 'inbox') await addLabel(id, DONE).catch(() => null);
    } catch (e) {
      logError(e, { where: 'mail-inbound' });
      await db.doc(`mailSeen/${id}`).delete().catch(() => null); // try again on the next run
    }
  }
  await mailIntegration().set({ lastCheckAt: now(), ...(counts.filed ? { filed: FieldValue.increment(counts.filed) } : {}) }, { merge: true });
  return { mail: counts };
}
