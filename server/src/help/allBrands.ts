// NickMark mode: only the admin can ask across every active brand (what waits for the client, what is in production,
// what is late). Text only: request cards link inside the brand that is open, so other brands are named, not linked.
import { db } from '../firebase.js';
import type { Tool } from '../ai.js';
import type { Ctx, ReadOut } from './reads.js';

export const ALL_BRANDS: Tool = {
  name: 'todas_las_marcas',
  description: 'Solo NickMark: resumen de TODAS las marcas activas (pedidos por aprobar del cliente, en producción, atrasados según su fecha). Úsala para «qué tengo pendiente hoy», «cómo va todo», «qué está atrasado», o preguntas sobre otra marca.',
  input_schema: { type: 'object', properties: { marca: { type: 'string', description: 'Palabras del nombre para ver solo esa marca' } } },
};

const cut = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export async function allBrands(c: Ctx, marca?: string): Promise<ReadOut> {
  if (!c.access.admin) return { text: 'SIN_ACCESO: solo NickMark ve todas las marcas.', cards: [] };
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' });
  const words = cut(marca, 60).toLowerCase().split(' ').filter((w) => w.length > 1);
  const brands = (await db.collection('brands').where('status', '==', 'active').select('name').get()).docs
    .filter((b) => words.every((w) => cut(b.get('name'), 120).toLowerCase().includes(w)));
  const rows = await Promise.all(brands.slice(0, 40).map(async (b) => {
    const snap = await db.collection(`brands/${b.id}/requests`).where('status', 'in', ['to_approve', 'in_production']).select('title', 'status', 'dueDate', 'archived').limit(100).get();
    const live = snap.docs.filter((d) => !d.get('archived'));
    const wait = live.filter((d) => d.get('status') === 'to_approve');
    const prod = live.filter((d) => d.get('status') === 'in_production');
    const late = prod.filter((d) => typeof d.get('dueDate') === 'string' && d.get('dueDate') < today);
    const list = (xs: typeof live) => xs.slice(0, 4).map((d) => `«${cut(d.get('title'), 70)}»${d.get('dueDate') ? ` (para ${d.get('dueDate')})` : ''}`).join(', ');
    return { name: cut(b.get('name'), 80), n: wait.length + prod.length, late: late.length,
      line: `${cut(b.get('name'), 80)} · por aprobar del cliente ${wait.length}${wait.length ? `: ${list(wait)}` : ''} · en producción ${prod.length} · atrasados ${late.length}${late.length ? `: ${list(late)}` : ''}` };
  }));
  rows.sort((a, b) => b.late - a.late || b.n - a.n);
  const busy = rows.filter((r) => r.n > 0);
  const quiet = rows.filter((r) => r.n === 0).map((r) => r.name);
  const text = `Hoy ${today}. ${brands.length} marcas activas${words.length ? ' con ese nombre' : ''}.\n${busy.map((r) => r.line).join('\n') || 'Ninguna tiene pedidos abiertos.'}${quiet.length ? `\nSin pedidos abiertos: ${quiet.join(', ')}.` : ''}\n(Estas marcas no se enlazan desde aquí: para abrir una, cambia de marca arriba.)`;
  return { text, cards: [] };
}
