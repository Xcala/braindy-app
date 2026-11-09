// Incoming WhatsApp messages. A known client number creates a request in its brand (the same createRequest the
// app and the connector use); a follow-up within 15 minutes, or a reply to one of our notices, becomes a comment;
// Approve / Ask for changes buttons decide through the review link. Unknown numbers get no reply and land
// in the admin-only inbox, never in a brand. Never log bodies or phone numbers.
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { createRequest } from '../requests.js';
import { decideWithLink } from '../review.js';
import { sendChoices, sendText } from '../whatsapp.js';
import { brandsOf, contactRef, getContact, type Contact, type Pending } from './contacts.js';
import { storeMedia, type InMedia } from './media.js';
import { queueWork } from '../autopilot.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const FOLLOW_UP_MS = 15 * 60_000;
const now = () => FieldValue.serverTimestamp();

type MediaPart = { id: string; mime_type?: string; filename?: string; caption?: string };
export type WaMsg = {
  id: string; from: string; type: string; context?: { id?: string };
  text?: { body?: string }; button?: { payload?: string };
  interactive?: { button_reply?: { id?: string }; list_reply?: { id?: string } };
  image?: MediaPart; document?: MediaPart; video?: MediaPart; audio?: MediaPart;
};

const COPY = {
  es: {
    received: (t: string, url: string) => `Recibido. NicoMarca y su equipo ya tienen tu solicitud «${t}».\nSíguela aquí: ${url}`,
    which: 'Recibido. ¿Para qué marca es?',
    askNote: 'Cuéntame en un mensaje qué cambiarías.',
    approved: 'Aprobado. Gracias, NicoMarca ya lo sabe.',
    changes: 'Listo, NicoMarca y su equipo ya tienen tus cambios.',
    used: 'Esa entrega ya tenía una decisión.', expired: 'Ese enlace venció. Pídele a NicoMarca uno nuevo.',
    failed: 'No pude registrarlo. Ábrelo desde el enlace del mensaje.',
    stopped: 'Listo, no te enviaremos más avisos por WhatsApp. Escribe START para volver a activarlos.',
    started: 'Listo, los avisos por WhatsApp están activos de nuevo.',
    files: 'Archivos enviados por WhatsApp',
  },
  en: {
    received: (t: string, url: string) => `Got it. NickMark and his team have your request "${t}".\nFollow it here: ${url}`,
    which: 'Got it. Which brand is it for?',
    askNote: 'Tell me in one message what you would change.',
    approved: 'Approved. Thanks, NickMark knows.',
    changes: 'Done, NickMark and his team have your changes.',
    used: 'That delivery already had a decision.', expired: 'That link expired. Ask NickMark for a new one.',
    failed: "I couldn't record it. Open it from the link in the message.",
    stopped: "Done, we won't send you more WhatsApp notices. Write START to turn them back on.",
    started: 'Done, WhatsApp notices are on again.',
    files: 'Files sent by WhatsApp',
  },
};

// Abuse guard per number (per instance): at most 30 messages in 10 minutes are processed.
const recent = new Map<string, number[]>();
function tooMany(phone: string) {
  const t = Date.now(); const list = (recent.get(phone) ?? []).filter((x) => t - x < 10 * 60_000);
  list.push(t); recent.set(phone, list);
  return list.length > 30;
}

function partsOf(m: WaMsg): { text: string; media: InMedia[]; choice: string } {
  const media = (['image', 'document', 'video', 'audio'] as const).flatMap((k) => {
    const p = m[k];
    return p?.id ? [{ id: p.id, name: p.filename ?? '', contentType: p.mime_type ?? 'application/octet-stream' }] : [];
  });
  const caption = m.image?.caption ?? m.document?.caption ?? m.video?.caption ?? '';
  return {
    text: String(m.text?.body ?? caption ?? '').trim().slice(0, 4000), media,
    choice: m.button?.payload ?? m.interactive?.button_reply?.id ?? m.interactive?.list_reply?.id ?? '',
  };
}

const firstLine = (t: string) => t.split('\n')[0].trim().slice(0, 80);

// A contact marked silent (set by hand in waContacts) still files requests and comments, but gets no automatic reply.
const silent = async (phone: string) => (await contactRef(phone).get()).get('silent') === true;
const say = async (phone: string, text: string) => { if (!(await silent(phone))) return sendText(phone, text); };
const choose = async (...a: Parameters<typeof sendChoices>) => { if (!(await silent(a[0]))) return sendChoices(...a); };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** The brand a message names: its full name, its first long word ("Hacienda") or its initials ("CEEA"). */
export function brandNamed(text: string, brands: { id: string; name: string }[]) {
  const t = ` ${fold(text).replace(/[^a-z0-9]+/g, ' ')} `;
  const hits = brands.filter((b) => {
    const words = fold(b.name).split(/[^a-z0-9]+/).filter(Boolean);
    const initials = words.map((w) => w[0]).join('');
    return t.includes(` ${words.join(' ')} `) || (words[0]?.length >= 6 && t.includes(` ${words[0]} `)) || (initials.length >= 3 && t.includes(` ${initials} `));
  });
  return hits.length === 1 ? hits[0] : undefined;
}

async function toInbox(m: WaMsg, name: string, text: string, media: InMedia[]) {
  await db.doc(`waInbox/${m.id}`).set({
    phone: m.from, name: name.slice(0, 80), text, type: m.type, media: media.map((x) => ({ id: x.id, name: x.name, contentType: x.contentType })),
    status: 'new', at: now(),
  });
}

async function comment(brandId: string, requestId: string, uid: string, text: string, media: InMedia[]) {
  const files = await storeMedia(brandId, uid, media);
  const ref = db.doc(`brands/${brandId}/requests/${requestId}`);
  await db.batch()
    .set(ref.collection('comments').doc(), { author: uid, text: text || (files.length ? `📎 ${files.map((f) => f.name).join(', ')}` : ''), files, kind: 'comment', source: 'whatsapp', createdAt: now() })
    .update(ref, { updatedAt: now() })
    .commit();
  const r = await ref.get();
  // On free action, a follow-up on finished work (not yet approved) puts the Brains back on it.
  if (r.get('work.state') === 'done' && r.get('status') !== 'approved' && r.get('status') !== 'published') await queueWork(brandId, requestId, 'comment');
  return String(r.get('title') ?? '');
}

async function fileRequest(phone: string, uid: string, brandId: string, p: Pending, lang: 'es' | 'en') {
  const files = await storeMedia(brandId, uid, p.media);
  const text = p.text || COPY[lang].files;
  const r = await createRequest(brandId, uid, { title: firstLine(text), source: 'whatsapp', cards: { product: { text, files } } });
  if ('error' in r) return say(phone, COPY[lang].failed);
  await contactRef(phone).set({ state: null, lastRequest: { brandId, requestId: r.requestId, at: Timestamp.now() } }, { merge: true });
  return say(phone, COPY[lang].received(firstLine(text), `${PUBLIC_BASE}/requests/${r.requestId}`));
}

async function decideByButton(phone: string, token: string, state: 'approved' | 'changes_requested', note: string, lang: 'es' | 'en') {
  const r = await decideWithLink(token, state, note, phone);
  const c = COPY[lang];
  return say(phone, r === 'ok' ? (state === 'approved' ? c.approved : c.changes) : r === 'used' ? c.used : r === 'expired' ? c.expired : c.failed);
}

export async function handleMessage(m: WaMsg, profileName: string) {
  const phone = m.from;
  if (!/^\d{8,15}$/.test(phone) || tooMany(phone)) return;
  const contact: Contact | null = await getContact(phone);
  const lang = contact?.lang === 'en' ? 'en' : 'es';
  const { text, media, choice } = partsOf(m);
  await contactRef(phone).set({ lastInboundAt: now() }, { merge: true });

  // Opt-out / opt-in for notices.
  if (/^(stop|baja|parar)$/i.test(text)) { await contactRef(phone).set({ optIn: false }, { merge: true }); return say(phone, COPY[lang].stopped); }
  if (/^(start|alta)$/i.test(text) && contact?.uid) { await contactRef(phone).set({ optIn: true }, { merge: true }); return say(phone, COPY[lang].started); }

  // Review buttons work by the number the link was sent to, even if that number is not linked to a person.
  if (choice.startsWith('ap:')) return decideByButton(phone, choice.slice(3), 'approved', '', lang);
  if (choice.startsWith('ch:')) {
    await contactRef(phone).set({ state: { awaitNote: choice.slice(3) } }, { merge: true });
    return say(phone, COPY[lang].askNote);
  }
  if (contact?.state?.awaitNote && text) {
    await contactRef(phone).set({ state: null }, { merge: true });
    return decideByButton(phone, contact.state.awaitNote, 'changes_requested', text, lang);
  }

  const uid = contact?.uid ?? null;
  const brands = uid ? await brandsOf(uid) : [];
  if (!uid || brands.length === 0) {
    // No automatic reply (Nicolas, 2026-11-07): unknown numbers only land in the inbox and he answers himself.
    await toInbox(m, profileName, text, media);
    return;
  }
  if (!text && media.length === 0 && !choice) return; // stickers, reactions, locations: nothing to file

  // Brand chosen from the list we sent.
  if (choice.startsWith('br:')) {
    const brandId = choice.slice(3);
    const pending = contact?.state?.pending;
    if (!pending || !brands.some((b) => b.id === brandId)) return;
    return fileRequest(phone, uid, brandId, pending, lang);
  }

  // Reply to one of our notices → comment on that request, silently (an "added to…" echo on every message is noise).
  const replied = m.context?.id ? await db.doc(`waOutbound/${m.context.id}`).get() : null;
  if (replied?.exists && brands.some((b) => b.id === replied.get('brandId'))) {
    await comment(replied.get('brandId'), replied.get('requestId'), uid, text, media);
    return;
  }
  // Follow-up right after a request (more photos, "and make it blue") → comment on it, silently.
  const last = contact?.lastRequest;
  if (last && Date.now() - last.at.toMillis() < FOLLOW_UP_MS && brands.some((b) => b.id === last.brandId)) {
    await comment(last.brandId, last.requestId, uid, text, media);
    return;
  }

  const pending: Pending = { text, media, at: Date.now() };
  if (brands.length === 1) return fileRequest(phone, uid, brands[0].id, pending, lang);
  // Several brands: the one the message names, else the one they last asked for. Only a first-time sender gets the list.
  const named = brandNamed(text, brands);
  const usual = brands.find((b) => b.id === last?.brandId);
  if (named || usual) return fileRequest(phone, uid, (named ?? usual)!.id, pending, lang);
  await contactRef(phone).set({ state: { pending } }, { merge: true });
  return choose(phone, COPY[lang].which, brands.map((b) => ({ id: `br:${b.id}`, title: b.name })), lang === 'es' ? 'Marcas' : 'Brands');
}
