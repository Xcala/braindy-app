// Actions the chat assistant can PROPOSE (never do): each one is checked here (the request exists, there is a version
// waiting, the person may approve, the site is the brand's) and becomes a card; the person confirms it with a button in
// the app, which calls the same endpoints as the screens. Nothing in this file writes.
import { db } from '../firebase.js';
import { canApprove } from '../requests.js';
import type { Ctx } from './reads.js';
import { proposeMore, type MoreCard } from './actionsMore.js';

export type ActCard =
  | { kind: 'act'; act: 'site'; ref: string; siteUrl: string; siteTitle: string; title: string; text: string }
  | { kind: 'act'; act: 'approve' | 'changes'; ref: string; requestId: string; versionId: string; n: number; title: string; text: string }
  | { kind: 'act'; act: 'add'; ref: string; requestId: string; title: string; text: string }
  | MoreCard;

export type ActCtx = Ctx & { uid: string; site?: string; tz?: string };
type Out = { text: string; card?: ActCard };

const cut = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n);
const can = (c: Ctx, s: 'apps' | 'requests') => c.access.admin || c.access.sections.includes(s);
const host = (u: string) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return ''; } };

/** The brand's websites and apps (My apps), for «which site?». */
export async function brandSites(c: ActCtx) {
  if (!can(c, 'apps')) return { text: 'SIN_ACCESO: esta persona no tiene abierta la sección «apps».' };
  const snap = await db.collection(`brands/${c.brandId}/links`).where('section', '==', 'apps').get();
  const rows = snap.docs.map((d) => `- ${cut(d.get('title'), 80)} · ${cut(d.get('url'), 200)} · ${d.get('kind') ?? ''}`);
  const now = c.site ? `\nAhora mismo está viendo: ${c.site}` : '';
  return { text: rows.length ? `${rows.length} sitios y apps:\n${rows.join('\n')}${now}` : 'La marca no tiene sitios ni apps en Braindy.' };
}

/** Latest delivered version of a request, if it waits for approval. */
async function pending(c: ActCtx, requestId: string) {
  if (!/^[\w-]{4,60}$/.test(requestId)) return { error: 'Id de pedido inválido.' };
  const ref = db.doc(`brands/${c.brandId}/requests/${requestId}`);
  const [r, v] = await Promise.all([ref.get(), ref.collection('versions').orderBy('n', 'desc').limit(5).get()]);
  if (!r.exists || r.get('archived')) return { error: 'No encontré ese pedido en esta marca.' };
  const ver = v.docs.find((d) => d.get('published') === true); // no composite index needed
  if (!ver || r.get('status') !== 'to_approve' || (ver.get('approval.state') ?? 'pending') !== 'pending') return { error: 'Ese pedido no tiene una versión esperando aprobación.', title: cut(r.get('title'), 120) };
  return { r, ver };
}

/** Checks one proposal and returns the card for the person to confirm, or why it cannot be proposed. */
export async function propose(c: ActCtx, i: Record<string, unknown>): Promise<Out> {
  const accion = String(i.accion ?? ''), texto = cut(i.texto, 3000), titulo = cut(i.titulo, 100);
  const ok = 'TARJETA_LISTA: la persona la revisa y la confirma con el botón. No digas que ya se hizo.';

  if (accion === 'ajuste_sitio') {
    if (!can(c, 'apps')) return { text: 'SIN_ACCESO: esta persona no tiene abierta la sección «apps».' };
    if (!texto) return { text: 'Falta qué cambiar en el sitio: pregúntalo.' };
    const snap = await db.collection(`brands/${c.brandId}/links`).where('section', '==', 'apps').get();
    const sites = snap.docs.map((d) => ({ url: String(d.get('url') ?? ''), title: String(d.get('title') ?? '') }));
    const want = cut(i.sitio, 300) || c.site || '';
    const site = sites.find((s) => want && (s.url === want || host(s.url) === host(want))) ?? (sites.length === 1 ? sites[0] : undefined);
    if (!site) return { text: sites.length ? `¿Cuál sitio? Pregúntale a la persona. Sitios: ${sites.map((s) => `${s.title} (${s.url})`).join(', ')}` : 'La marca no tiene sitios en Braindy: arma un pedido normal (BORRADOR).' };
    return { text: ok, card: { kind: 'act', act: 'site', ref: '', siteUrl: site.url, siteTitle: cut(site.title, 80) || host(site.url), title: titulo || texto.split('\n')[0]!.slice(0, 70), text: texto } };
  }

  if (accion === 'aprobar' || accion === 'pedir_cambios') {
    if (!can(c, 'requests')) return { text: 'SIN_ACCESO: esta persona no tiene abierta la sección «requests».' };
    if (!(await canApprove(c.uid, c.brandId))) return { text: 'Esta persona no puede aprobar entregas en esta marca: que se lo pida al dueño de la marca o a Nico.' };
    if (accion === 'pedir_cambios' && !texto) return { text: 'Falta qué cambios quiere: pregúntalo antes de proponer.' };
    const p = await pending(c, cut(i.pedido_id, 60));
    if ('error' in p) return { text: String(p.error) };
    return { text: ok, card: { kind: 'act', act: accion === 'aprobar' ? 'approve' : 'changes', ref: '', requestId: p.r.id, versionId: p.ver.id, n: Number(p.ver.get('n') ?? 1), title: cut(p.r.get('title'), 120), text: accion === 'aprobar' ? '' : texto } };
  }

  if (accion === 'agregar_al_pedido') {
    if (!can(c, 'requests')) return { text: 'SIN_ACCESO: esta persona no tiene abierta la sección «requests».' };
    if (!texto) return { text: 'Falta qué agregar al pedido: pregúntalo.' };
    const id = cut(i.pedido_id, 60);
    const r = /^[\w-]{4,60}$/.test(id) ? await db.doc(`brands/${c.brandId}/requests/${id}`).get() : null;
    if (!r?.exists || r.get('archived')) return { text: 'No encontré ese pedido en esta marca.' };
    return { text: ok, card: { kind: 'act', act: 'add', ref: '', requestId: r.id, title: cut(r.get('title'), 120), text: texto } };
  }
  return (await proposeMore(c, accion, i)) ?? { text: 'Acción desconocida.' };
}
