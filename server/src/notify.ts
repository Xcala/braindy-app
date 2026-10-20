// Onboarding notices by WhatsApp (design 17, day 0 to 11). Sent with approved templates when Meta is
// configured; otherwise stored with a ready wa.me link so Nicolas sends them from the onboarding screen.
import { FieldValue } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { normalizePhone, sendTemplate, waMeLink } from './whatsapp.js';

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL ?? 'https://braindy-app-staging.web.app';
export type NoticeKind = 'welcome' | 'brain_ready' | 'session_confirmed' | 'brain_signed' | 'live';

// Template name in Meta → body text (ES / EN) used for the wa.me fallback. {name} = brand, {when} = session.
const TEMPLATES: Record<NoticeKind, { template: string; path: string; es: string; en: string }> = {
  welcome: { template: 'onboarding_welcome', path: '/onboarding', es: 'Bienvenidos a Braindy, {name}. Su app está lista. Empiecen el brief aquí (unos 12 minutos):', en: 'Welcome to Braindy, {name}. Your app is ready. Start the brief here (about 12 minutes):' },
  brain_ready: { template: 'brand_brain_ready', path: '/onboarding', es: '{name}: su Brand Brain está listo. El Researcher lo armó con su brief. Revísenlo antes de la sesión:', en: '{name}: your Brand Brain is ready. The Researcher built it from your brief. Review it before the session:' },
  session_confirmed: { template: 'session_confirmed', path: '/onboarding', es: '{name}: sesión con Nicolas confirmada para {when}. Traigan preguntas, no tareas.', en: '{name}: session with Nicolas confirmed for {when}. Bring questions, not homework.' },
  brain_signed: { template: 'brand_brain_signed', path: '/brand', es: '{name}: su Brand Brain está firmado por Nicolas. Los Brains arrancan ya.', en: '{name}: your Brand Brain is signed by Nicolas. The Brains start now.' },
  live: { template: 'system_live', path: '/home', es: '{name}: su sistema de marca está vivo. Todo en marca, en un solo lugar:', en: '{name}: your brand system is live. Everything on brand, in one place:' },
};

async function brandPhone(brandId: string) {
  const [s, plan] = await Promise.all([db.doc(`brands/${brandId}/settings/notices`).get(), db.doc(`brands/${brandId}/billing/plan`).get()]);
  const raw = (s.get('whatsapp') as string) || (plan.get('invoiceDetails.whatsapp') as string) || '';
  return { phone: raw ? normalizePhone(raw) : null, lang: (s.get('lang') as 'es' | 'en') ?? 'es' };
}

/** Never throws: a notice must not break the step that triggers it. */
export async function notify(brandId: string, kind: NoticeKind, vars: { when?: string } = {}) {
  try {
    const [{ phone, lang }, brand] = await Promise.all([brandPhone(brandId), db.doc(`brands/${brandId}`).get()]);
    const t = TEMPLATES[kind];
    const name = String(brand.get('name') ?? '');
    const url = `${PUBLIC_BASE}${t.path}`;
    const text = `${t[lang].replace('{name}', name).replace('{when}', vars.when ?? '')} ${kind === 'session_confirmed' || kind === 'brain_signed' ? '' : url}`.trim();
    const res = phone ? await sendTemplate(phone, t.template, lang, [name, ...(vars.when ? [vars.when] : [])]) : { sent: false as const, reason: 'no_number' };
    await db.collection(`brands/${brandId}/notices`).doc().set({
      kind, sent: res.sent, reason: res.sent ? null : res.reason, waUrl: !res.sent && phone ? waMeLink(phone, text) : null, at: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.warn('notify failed', kind, String(e));
  }
}
