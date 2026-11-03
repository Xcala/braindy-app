// Incoming WhatsApp messages. A known client number creates a request in its brand (the same createRequest the
// app and the connector use); a follow-up within 15 minutes, or a reply to one of our notices, becomes a comment;
// Approve / Ask for changes buttons decide through the review link. Unknown numbers get a polite reply and land
// in the admin-only inbox, never in a brand. Never log bodies or phone numbers.
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { createRequest } from '../requests.js';
import { decideWithLink } from '../review.js';
import { brandAccess } from '../access.js';
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
    unknown: 'Hola, este es el WhatsApp de Braindy. No encontramos tu número en ninguna marca todavía. NicoMarca lo revisa y te escribe pronto.',
    received: (t: string, url: string) => `Recibido. NicoMarca y su equipo ya tienen tu solicitud «${t}».\nSíguela aquí: ${url}`,
    added: (t: string) => `Lo agregué a «${t}».`,
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
    unknown: "Hi, this is Braindy's WhatsApp. We can't find your number in any brand yet. NickMark will check and write to you soon.",
    received: (t: string, url: string) => `Got it. NickMark and his team have your request "${t}".\nFollow it here: ${url}`,
    added: (t: string) => `Added to "${t}".`,
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
  if ('error' in r) return sendText(phone, COPY[lang].failed);
  await contactRef(phone).set({ state: null, lastRequest: { brandId, requestId: r.requestId, at: Timestamp.now() } }, { merge: true });
  return sendText(phone, COPY[lang].received(firstLine(text), `${PUBLIC_BASE}/requests/${r.requestId}`));
}

async function decideByButton(phone: string, token: string, state: 'approved' | 'changes_requested', note: string, lang: 'es' | 'en') {
  const r = await decideWithLink(token, state, note, phone);
  const c = COPY[lang];
  return sendText(phone, r === 'ok' ? (state === 'approved' ? c.approved : c.changes) : r === 'used' ? c.used : r === 'expired' ? c.expired : c.failed);
}

export async function handleMessage(m: WaMsg, profileName: string) {
  const phone = m.from;
  if (!/^\d{8,15}$/.test(phone) || tooMany(phone)) return;
  const contact: Contact | null = await getContact(phone);
  const lang = contact?.lang === 'en' ? 'en' : 'es';
  const { text, media, choice } = partsOf(m);
  await contactRef(phone).set({ lastInboundAt: now() }, { merge: true });

  // Opt-out / opt-in for notices.
  if (/^(stop|baja|parar)$/i.test(text)) { await contactRef(phone).set({ optIn: false }, { merge: true }); return sendText(phone, COPY[lang].stopped); }
  if (/^(start|alta)$/i.test(text) && contact?.uid) { await contactRef(phone).set({ optIn: true }, { merge: true }); return sendText(phone, COPY[lang].started); }

  // Review buttons work by the number the link was sent to, even if that number is not linked to a person.
  if (choice.startsWith('ap:')) return decideByButton(phone, choice.slice(3), 'approved', '', lang);
  if (choice.startsWith('ch:')) {
    await contactRef(phone).set({ state: { awaitNote: choice.slice(3) } }, { merge: true });
    return sendText(phone, COPY[lang].askNote);
  }
  if (contact?.state?.awaitNote && text) {
    await contactRef(phone).set({ state: null }, { merge: true });
    return decideByButton(phone, contact.state.awaitNote, 'changes_requested', text, lang);
  }

  const uid = contact?.uid ?? null;
  const brands = uid ? await brandsOf(uid) : [];
  if (!uid || brands.length === 0) {
    await toInbox(m, profileName, text, media);
    const polite = contact?.politeAt?.toMillis() ?? 0;
    if (Date.now() - polite > 864e5) {
      await contactRef(phone).set({ politeAt: now() }, { merge: true });
      await sendText(phone, COPY[lang].unknown);
    }
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

  // Reply to one of our notices → comment on that request.
  const replied = m.context?.id ? await db.doc(`waOutbound/${m.context.id}`).get() : null;
  if (replied?.exists && (await brandAccess(uid, replied.get('brandId'))).member) {
    const title = await comment(replied.get('brandId'), replied.get('requestId'), uid, text, media);
    return sendText(phone, COPY[lang].added(title));
  }
  // Follow-up right after a request (more photos, "and make it blue") → comment on it.
  const last = contact?.lastRequest;
  if (last && Date.now() - last.at.toMillis() < FOLLOW_UP_MS && brands.some((b) => b.id === last.brandId)) {
    const title = await comment(last.brandId, last.requestId, uid, text, media);
    if (text) await sendText(phone, COPY[lang].added(title));
    return;
  }

  const pending: Pending = { text, media, at: Date.now() };
  if (brands.length === 1) return fileRequest(phone, uid, brands[0].id, pending, lang);
  await contactRef(phone).set({ state: { pending } }, { merge: true });
  return sendChoices(phone, COPY[lang].which, brands.map((b) => ({ id: `br:${b.id}`, title: b.name })), lang === 'es' ? 'Marcas' : 'Brands');
}
