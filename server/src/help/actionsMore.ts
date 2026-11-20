// More actions the assistant can PROPOSE (never do): invite someone to the brand team, book a meeting with NickMark,
// share a file, remember a brand preference, set a reminder. Each one is checked here and becomes a card; the person
// confirms it in the app, which calls the same endpoints as the screens. Nothing in this file writes.
import { db } from '../firebase.js';
import type { ActCtx } from './actions.js';
import { canApprove } from '../requests.js';

export type MoreCard =
  | { kind: 'act'; act: 'invite'; ref: string; email: string; name: string; title: string; text: string }
  | { kind: 'act'; act: 'meeting'; ref: string; title: string; text: string }
  | { kind: 'act'; act: 'share'; ref: string; assetId: string; title: string; text: string }
  | { kind: 'act'; act: 'remember'; ref: string; topic: 'voice' | 'avoid'; title: string; text: string }
  | { kind: 'act'; act: 'reminder'; ref: string; at: string; title: string; text: string }
  | { kind: 'act'; act: 'cancel'; ref: string; requestId: string; title: string; text: string };

const cut = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n);
const OK = 'TARJETA_LISTA: la persona la revisa y la confirma con el botón. No digas que ya se hizo.';
/** The UTC offset (+HH:MM) of the person's time zone on that day; Bogotá when the app did not send one. */
const offsetOf = (tz: string | undefined, day: string) => {
  try { const m = new Intl.DateTimeFormat('en-US', { timeZone: tz || 'America/Bogota', timeZoneName: 'longOffset' }).format(new Date(`${day.slice(0, 10)}T12:00:00Z`)).match(/GMT([+-]\d\d:\d\d)?$/); return m ? m[1] ?? '+00:00' : '-05:00'; } catch { return '-05:00'; }
};
const has = (c: ActCtx, s: 'files' | 'brand') => c.access.admin || c.access.sections.includes(s);

export async function proposeMore(c: ActCtx, accion: string, i: Record<string, unknown>): Promise<{ text: string; card?: MoreCard } | null> {
  const texto = cut(i.texto, 1200);
  if (accion === 'invitar') {
    if (!c.access.admin && c.access.role !== 'client_owner') return { text: 'Solo el dueño de la marca (o Nico) puede invitar personas: dile que se lo pida a él.' };
    const email = cut(i.email, 200).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { text: 'Falta el correo de la persona a invitar: pregúntalo.' };
    const name = cut(i.nombre, 80);
    return { text: OK, card: { kind: 'act', act: 'invite', ref: '', email, name, title: name || email, text: '' } };
  }
  if (accion === 'reunion') {
    return { text: `${OK} La tarjeta le muestra las horas libres de Nico para que elija.`, card: { kind: 'act', act: 'meeting', ref: '', title: cut(i.titulo, 100), text: texto } };
  }
  if (accion === 'compartir_archivo') {
    if (!has(c, 'files')) return { text: 'SIN_ACCESO: esta persona no tiene abierta la sección «files».' };
    const id = cut(i.archivo_id, 80);
    const a = /^[\w-]{4,80}$/.test(id) ? await db.doc(`brands/${c.brandId}/assets/${id}`).get() : null;
    if (!a?.exists || a.get('trashedAt')) return { text: 'No encontré ese archivo: búscalo primero con «archivos» y usa su id.' };
    return { text: OK, card: { kind: 'act', act: 'share', ref: '', assetId: a.id, title: cut(a.get('title') ?? a.get('name'), 120), text: '' } };
  }
  if (accion === 'recordar_gusto') {
    if (!has(c, 'brand')) return { text: 'SIN_ACCESO: esta persona no tiene abierta la sección «brand».' };
    if (!texto) return { text: 'Falta qué recordar: pregúntalo.' };
    const topic = i.tema === 'evitar' || /\b(nunca|no uses|evita|never|avoid|don.t)\b/i.test(texto) ? 'avoid' : 'voice';
    return { text: OK, card: { kind: 'act', act: 'remember', ref: '', topic, title: texto.slice(0, 70), text: texto } };
  }
  if (accion === 'recordatorio') {
    const at = cut(i.cuando, 30);
    const t = Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(at) ? at : `${at}${at.length <= 10 ? 'T09:00:00' : ''}${offsetOf(c.tz, at)}`);
    if (!texto) return { text: 'Falta qué recordarle: pregúntalo.' };
    if (!Number.isFinite(t) || t < Date.now() - 60_000 || t > Date.now() + 366 * 86_400_000) return { text: 'Falta cuándo (fecha y hora, en el próximo año): pregúntalo. Usa AAAA-MM-DDTHH:mm, hora local de la persona.' };
    return { text: OK, card: { kind: 'act', act: 'reminder', ref: '', at: new Date(t).toISOString(), title: texto.slice(0, 70), text: texto } };
  }
  if (accion === 'cancelar_pedido') {
    const id = cut(i.pedido_id, 80);
    const r = /^[\w-]{4,80}$/.test(id) ? await db.doc(`brands/${c.brandId}/requests/${id}`).get() : null;
    if (!r?.exists) return { text: 'No encontré ese pedido: búscalo primero con «pedidos» y usa su id.' };
    if (r.get('cancelled')) return { text: 'Ese pedido ya está cancelado.' };
    if (['approved', 'published'].includes(String(r.get('status')))) return { text: 'Ese pedido ya está aprobado: no se puede cancelar. Si hace falta, que lo hable con Nico.' };
    if (!c.access.admin && r.get('createdBy') !== c.uid && !(await canApprove(c.uid, c.brandId))) return { text: 'Solo quien lo pidió o quien aprueba en la marca puede cancelarlo: dile que se lo pida a esa persona o a Nico.' };
    return { text: `${OK} Al confirmar se cancela y Nico recibe aviso; se puede deshacer.`, card: { kind: 'act', act: 'cancel', ref: '', requestId: r.id, title: cut(r.get('title'), 120), text: '' } };
  }
  return null;
}
