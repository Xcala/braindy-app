// Which way a delivery goes (Nicolas, 2026-11-23): three lanes so approvals stop waiting on him for everything.
//   direct: straight to the client (adaptations, sizes, corrections the client asked for, v2+, small site tweaks, reports).
//   after:  goes to the client now and Nicolas sees it in a daily summary (new pieces inside an identity already made).
//   nico:   held until Nicolas approves it (branding, naming, strategy, campaigns and ads, first piece of a series,
//           a brand's first month, prices or legal, anything under 90 in the brand check).
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { adminUids, pushTo } from '../push/send.js';

export type Lane = 'direct' | 'after' | 'nico';
const MIN_SCORE = 90;
const NEW_BRAND_DAYS = 30;

const ALWAYS_NICO = /\b(naming|nombre de (la )?marca|estrategia|strategy|campa[ñn]a|campaign|pauta|ads|anuncios|precios?|tarifas?|cotizaci[oó]n|legal|contrato|t[ée]rminos)\b/i;
const DIRECT = /\b(adapta(ci[oó]n|r)?|resize|redimension|tama[ñn]os?|formatos?|versi[oó]n para|reporte|informe|resultados del mes|ajuste del sitio|site adjustment)\b/i;

const ms = (v: unknown) => (v && typeof (v as { toMillis?: () => number }).toMillis === 'function' ? (v as { toMillis: () => number }).toMillis() : 0);

/** The lane for version n of this request, with the reason in a few words (shown to Nicolas and to Claude). */
export async function laneOf(brandId: string, req: DocumentSnapshot, n: number, notes: string, o: { seen?: boolean; hold?: boolean } = {}): Promise<{ lane: Lane; why: string }> {
  if (o.hold) return { lane: 'nico', why: 'pediste revisarla' };
  if (o.seen) return { lane: 'direct', why: 'Nico ya la vio' };
  const q = req.get('quality') as { score?: number } | undefined;
  if (!q || typeof q.score !== 'number') return { lane: 'nico', why: 'sin revisión de marca' };
  if (q.score < MIN_SCORE) return { lane: 'nico', why: `revisión de marca ${q.score}/100` };
  const category = String(req.get('category') ?? '');
  if (category === 'branding' || category === 'other') return { lane: 'nico', why: category === 'branding' ? 'es branding' : 'tipo sin definir' };
  const text = `${req.get('title') ?? ''} ${req.get('subcategory') ?? ''}\n${notes}`;
  // Corrections the client asked for (v2 onwards) go straight back to them.
  if (n >= 2 && req.get('latestVersion')) return { lane: 'direct', why: 'corrección pedida por el cliente' };
  if (req.get('approvalLevel') === 'nicolas' || ALWAYS_NICO.test(text)) return { lane: 'nico', why: 'estrategia, campaña, precios o legal' };
  const brand = await db.doc(`brands/${brandId}`).get();
  const born = ms(brand.get('createdAt'));
  if (born && Date.now() - born < NEW_BRAND_DAYS * 86_400_000) return { lane: 'nico', why: 'primer mes de la marca' };
  if (req.get('siteAdjust') === true || DIRECT.test(text)) return { lane: 'direct', why: 'adaptación, ajuste o reporte' };
  // First piece of its kind for this brand: the one that sets the line.
  const sub = String(req.get('subcategory') ?? '');
  const done = await db.collection(`brands/${brandId}/requests`).where('category', '==', category).where('status', 'in', ['approved', 'published']).limit(20).get();
  if (!done.docs.some((d) => !sub || d.get('subcategory') === sub)) return { lane: 'nico', why: 'primera pieza de su tipo' };
  if (brand.get('trust') === 'high') return { lane: 'direct', why: 'marca de confianza' };
  return { lane: 'after', why: 'pieza nueva dentro de la línea' };
}

const link = (brandId: string, requestId: string) => `/requests/${requestId}?brand=${encodeURIComponent(brandId)}`;
const short = (s: string, n = 60) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Held for Nicolas: the request remembers which version waits, and his phone gets «Para tu ojo». */
export async function holdForNico(brandId: string, req: DocumentSnapshot, versionId: string, why: string) {
  await req.ref.update({ held: { versionId, why, at: FieldValue.serverTimestamp() }, updatedAt: FieldValue.serverTimestamp() });
  const brand = String((await db.doc(`brands/${brandId}`).get()).get('name') ?? brandId);
  const title = short(String(req.get('title') ?? ''));
  await pushTo(await adminUids(), {
    kind: 'deliveries', tag: `eye-${req.id}`, url: link(brandId, req.id),
    title: { es: `👀 Para tu ojo · ${brand}`, en: `👀 For your eye · ${brand}` },
    body: { es: `«${title}» · ${why}. Aprueba y envía, o ajusta.`, en: `"${title}" is waiting for you. Approve and send, or adjust.` },
  }, { ignorePrefs: true });
}

/** Went out without him: kept for the daily summary. */
export const noteForDigest = (brandId: string, req: DocumentSnapshot, versionId: string) =>
  db.collection('laneDigest').add({ brandId, requestId: req.id, versionId, title: String(req.get('title') ?? ''), sent: false, at: FieldValue.serverTimestamp() });

/** Daily: one alert with what went to clients without passing by Nicolas. */
export async function pushLaneDigest() {
  const q = await db.collection('laneDigest').where('sent', '==', false).limit(60).get();
  if (q.empty) return { laneDigest: 0 };
  const names = new Map<string, string>();
  for (const id of new Set(q.docs.map((d) => String(d.get('brandId'))))) names.set(id, String((await db.doc(`brands/${id}`).get()).get('name') ?? id));
  const lines = q.docs.slice(0, 6).map((d) => `${names.get(String(d.get('brandId')))}: ${short(String(d.get('title')), 40)}`).join(' · ');
  const n = q.size;
  await pushTo(await adminUids(), {
    kind: 'deliveries', tag: 'lane-digest', url: n === 1 ? link(String(q.docs[0]!.get('brandId')), String(q.docs[0]!.get('requestId'))) : '/requests',
    title: { es: `Salieron hoy sin pasar por ti: ${n}`, en: `Went out today without you: ${n}` },
    body: { es: lines, en: lines },
  }, { ignorePrefs: true });
  const batch = db.batch();
  q.docs.forEach((d) => batch.update(d.ref, { sent: true }));
  await batch.commit();
  return { laneDigest: n };
}
