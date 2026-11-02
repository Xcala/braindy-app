// Outgoing WhatsApp notices about a request: a version to review (with Approve / Ask for changes buttons),
// approved, published. Inside the 24 h window they go as free messages; outside it, as approved templates
// (names and texts in docs/whatsapp-templates.md). Signed NicoMarca (ES) / NickMark (EN).
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { normalizePhone, sendChoices, sendTemplate, sendText } from '../whatsapp.js';
import { getContact, windowOpen } from './contacts.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
const sig = (lang: 'es' | 'en') => (lang === 'es' ? 'NicoMarca' : 'NickMark');

/** Button ids: ap:<token> approves, ch:<token> asks for changes (the note comes in the next message). */
export async function sendDeliveryNotice(phone: string, lang: 'es' | 'en', v: { brand: string; title: string; url: string; token: string }) {
  if (windowOpen(await getContact(phone))) {
    const body = lang === 'es'
      ? `${v.brand}: ${sig(lang)} te envía «${v.title}» para revisar.\nMíralo aquí: ${v.url}\n\n¿Lo apruebas?`
      : `${v.brand}: ${sig(lang)} sends you "${v.title}" to review.\nSee it here: ${v.url}\n\nDo you approve it?`;
    return sendChoices(phone, body, [
      { id: `ap:${v.token}`, title: lang === 'es' ? 'Aprobar' : 'Approve' },
      { id: `ch:${v.token}`, title: lang === 'es' ? 'Pedir cambios' : 'Ask for changes' },
    ]);
  }
  return sendTemplate(phone, 'delivery_review', lang, [v.brand, sig(lang), v.title], [
    { type: 'url', index: 0, param: v.token },
    { type: 'quick_reply', index: 1, payload: `ap:${v.token}` },
    { type: 'quick_reply', index: 2, payload: `ch:${v.token}` },
  ]);
}

/** "Approved" and "Published" to the brand's notice number, if that notice is on. Never throws. */
export async function noticeToBrand(brandId: string, kind: 'approved' | 'published', requestId: string) {
  try {
    const s = (await db.doc(`brands/${brandId}/settings/notices`).get()).data() ?? {};
    const phone = s.whatsapp ? normalizePhone(String(s.whatsapp)) : null;
    if (!phone || s.notices?.[kind] === false) return;
    const contact = await getContact(phone);
    if (contact?.optIn === false) return;
    const lang: 'es' | 'en' = s.lang === 'en' ? 'en' : 'es';
    const [brand, req] = await Promise.all([db.doc(`brands/${brandId}`).get(), db.doc(`brands/${brandId}/requests/${requestId}`).get()]);
    const name = String(brand.get('name') ?? ''); const title = String(req.get('title') ?? '');
    const url = `${PUBLIC_BASE}/requests/${requestId}`;
    const text = kind === 'approved'
      ? (lang === 'es' ? `${name}: «${title}» quedó aprobado. ${sig(lang)} y su equipo lo dejan listo para publicar.` : `${name}: "${title}" is approved. ${sig(lang)} and his team get it ready to publish.`)
      : (lang === 'es' ? `${name}: «${title}» ya está publicado.` : `${name}: "${title}" is live.`);
    const res = windowOpen(contact)
      ? await sendText(phone, `${text}\n${url}`)
      : await sendTemplate(phone, kind === 'approved' ? 'request_approved' : 'request_published', lang, [name, title], [{ type: 'url', index: 0, param: requestId }]);
    await db.collection(`brands/${brandId}/notices`).doc().set({
      kind: `request_${kind}`, requestId, sent: res.sent, reason: res.sent ? null : res.reason, waUrl: null, at: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.warn('whatsapp notice failed', kind, String(e).slice(0, 120));
  }
}
