// «Para tu ojo» in the chat (NickMark only): what the team uploaded that waits for him before the client sees it
// (connector/lanes.ts), across every active brand, and the card to approve and send one. Nothing in this file writes.
import { db } from '../firebase.js';
import type { Tool } from '../ai.js';
import type { Ctx, ReadOut } from './reads.js';

export const EYE: Tool = {
  name: 'para_tu_ojo',
  description: 'Solo NickMark: las entregas EN ESPERA de su visto bueno («Para tu ojo») en TODAS las marcas, con el motivo y la nota de ajuste si la dejó. Úsala para «qué tengo para mi ojo», «qué espera por mí», «qué debo aprobar yo». Para aprobar y enviar una, usa «proponer» con accion aprobar_y_enviar, marca_id y pedido_id de esta lista (una tarjeta por pedido).',
  input_schema: { type: 'object', properties: {} },
};

export type EyeCard = { kind: 'act'; act: 'eye'; ref: string; brandId: string; brand: string; requestId: string; versionId: string; title: string; text: string };

const cut = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export async function eyeList(c: Ctx): Promise<ReadOut> {
  if (!c.access.admin) return { text: 'SIN_ACCESO: solo NickMark ve esto.', cards: [] };
  const brands = (await db.collection('brands').where('status', '==', 'active').select('name').get()).docs.slice(0, 60);
  const rows = (await Promise.all(brands.map(async (b) => {
    const snap = await db.collection(`brands/${b.id}/requests`).where('held.versionId', '>', '').limit(20).get();
    return snap.docs.filter((d) => !d.get('archived') && !d.get('cancelled')).map((d) =>
      `- ${cut(b.get('name'), 80)} · «${cut(d.get('title'), 90)}» · ${d.get('held.versionId')} · motivo: ${cut(d.get('held.why'), 80) || 'sin motivo'}${d.get('held.note') ? ` · ya pediste ajustar: «${cut(d.get('held.note'), 200)}»` : ''} · marca_id ${b.id} · pedido_id ${d.id}`);
  }))).flat();
  return { text: rows.length ? `${rows.length} en espera de tu ojo (el cliente aún no las ve):\n${rows.join('\n')}` : 'Nada espera por tu ojo ahora.', cards: [] };
}

/** The card to approve and send one held version; NickMark confirms it with the button. */
export async function proposeEye(c: Ctx, i: Record<string, unknown>): Promise<{ text: string; card?: EyeCard }> {
  if (!c.access.admin) return { text: 'SIN_ACCESO: solo NickMark aprueba y envía lo que está en espera.' };
  const brandId = cut(i.marca_id, 80) || c.brandId, id = cut(i.pedido_id, 80);
  if (!/^[\w-]{2,80}$/.test(brandId) || !/^[\w-]{4,80}$/.test(id)) return { text: 'Faltan marca_id y pedido_id: tómalos de «para_tu_ojo».' };
  const [b, r] = await Promise.all([db.doc(`brands/${brandId}`).get(), db.doc(`brands/${brandId}/requests/${id}`).get()]);
  const versionId = cut(r.get('held.versionId'), 20);
  if (!r.exists || !versionId) return { text: 'Ese pedido no tiene nada en espera: revisa con «para_tu_ojo».' };
  return { text: 'TARJETA_LISTA: Nico la revisa (puede abrir la pieza) y confirma con el botón. No digas que ya se envió.',
    card: { kind: 'act', act: 'eye', ref: '', brandId, brand: cut(b.get('name'), 80) || brandId, requestId: r.id, versionId, title: cut(r.get('title'), 120), text: cut(r.get('held.why'), 120) } };
}
