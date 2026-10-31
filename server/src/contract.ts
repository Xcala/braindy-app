// "Mi plan": what the client contracted, in one place. Three blocks, the same ones Nicolas's proposals use:
// the plans or packs bought (with what each includes), the work plan (Gantt with deliverables), and the website's
// hosting and maintenance. Stored at brands/{brandId}/billing/contract (owners and admin read; only the backend writes).
// Nicolas loads it from the panel (JSON) or from any Claude with the connector tool braindy_contract.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import type { AuthEnv } from './auth.js';

const s = (max = 300) => z.string().trim().max(max);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha YYYY-MM-DD');
export const TONES = ['strategy', 'brand', 'web', 'content', 'agents', 'ads', 'knowledge'] as const;

const Pack = z.object({
  label: s(40).optional().describe('Small label, e.g. "Pack A", "Plan Starter", "Pilar 01"'),
  name: s(120).describe('e.g. "Marca", "Ecosistema digital completo"'),
  subtitle: s(200).optional().describe('One line, e.g. "El sistema visual · 4 semanas"'),
  price: z.number().nonnegative().optional(),
  period: z.enum(['once', 'month']).default('once').describe('once = pago único, month = por mes'),
  months: z.number().int().positive().max(60).optional().describe('Duration in months for monthly plans'),
  includes: z.array(s()).max(20).default([]),
  excludes: z.array(s()).max(10).default([]).describe('What this pack does not include'),
  status: z.enum(['pending', 'in_progress', 'delivered']).default('pending'),
});

const Row = z.object({
  name: s(120), detail: s(200).optional(),
  from: z.number().int().min(0).describe('First period index (0-based) of the bar'),
  to: z.number().int().min(0).describe('Last period index (inclusive)'),
  tone: z.enum(TONES).default('brand').describe('Bar color: strategy, brand, web, content, agents, ads, knowledge'),
  milestone: z.boolean().default(false).describe('true = contract deliverable (orange, with ⚡)'),
  label: s(30).optional().describe('Text inside the bar, e.g. "IDENTIDAD"'),
  ready: z.number().int().min(0).optional().describe('After the bar, shown as "listo" until this period index'),
  done: z.boolean().default(false).describe('Delivered'),
});

const Schedule = z.object({
  title: s(120).optional(), note: s(400).optional(),
  periods: z.array(z.object({ label: s(20).describe('e.g. "SEP 1"'), sub: s(20).optional().describe('e.g. "1-15"'), from: day.optional().describe('Start date, for the today line') })).min(1).max(26),
  meetings: z.object({ label: s(80), detail: s(160).optional(), cells: z.array(s(40)).max(26).optional().describe('One text per period, e.g. "10 · 17 sep"') }).optional(),
  sections: z.array(z.object({ title: s(120), rows: z.array(Row).max(20) })).max(8),
});

const Care = z.object({
  name: s(120).describe('e.g. "Plan de mantenimiento · Todo, operando"'),
  price: z.number().nonnegative().optional(), period: z.enum(['month', 'year']).default('month'),
  note: s(300).optional().describe('e.g. "Se factura mes a mes, con corte el día 1"'),
  includes: z.array(z.object({ title: s(60), body: s(240).optional() })).max(10).default([]),
  excludes: z.array(s()).max(8).default([]),
  metrics: z.array(z.object({ value: s(12), label: s(60) })).max(4).default([]).describe('e.g. {value:"48", label:"horas hábiles de respuesta"}'),
  hosting: z.enum(['esencial', 'pro', 'ultra']).optional().describe('Website hosting plan, if any'),
  siteUrl: z.string().url().max(300).optional(),
  startsAfter: s(200).optional().describe('e.g. "Arranca cuando termina el cronograma (30 de noviembre)"'),
});

export const ContractSchema = z.object({
  title: s(120).describe('e.g. "Brand OS · 12 meses" or "Ruta Pack A + Pack C"'),
  summary: s(500).optional(),
  currency: z.enum(['cop', 'usd']).default('cop'),
  start: day.optional(), end: day.optional(),
  status: z.enum(['active', 'done', 'paused']).default('active'),
  packs: z.array(Pack).max(8).default([]),
  total: z.object({ amount: z.number().nonnegative(), label: s(120).optional() }).optional().describe('e.g. {amount: 9500000, label: "Proyecto completo · pago único"}'),
  payment: z.array(s(200)).max(6).default([]).describe('Payment terms, one per line'),
  notIncluded: z.array(s()).max(10).default([]),
  schedule: Schedule.optional(),
  care: Care.optional(),
}).superRefine((c, ctx) => {
  const n = c.schedule?.periods.length ?? 0;
  c.schedule?.sections.forEach((sec, i) => sec.rows.forEach((r, j) => {
    const bad = r.from > r.to || r.to >= n || (r.ready !== undefined && (r.ready <= r.to || r.ready >= n));
    if (bad) ctx.addIssue({ code: 'custom', path: ['schedule', 'sections', i, 'rows', j], message: `"${r.name}": períodos fuera de rango (hay ${n}, de 0 a ${n - 1})` });
  }));
});
export type Contract = z.infer<typeof ContractSchema>;

const ref = (brandId: string) => db.doc(`brands/${brandId}/billing/contract`);
export const zodMessage = (e: z.ZodError) => e.issues.slice(0, 5).map((i) => `${i.path.join('.') || 'plan'}: ${i.message}`).join('; ');

/** Replaces the brand's contract. Returns a short summary for the connector reply. */
export async function setContract(brandId: string, input: unknown, by: string) {
  const c = ContractSchema.parse(input);
  await ref(brandId).set({ ...c, updatedBy: by, updatedAt: FieldValue.serverTimestamp() });
  await db.collection('audit').doc().set({ type: 'contract_set', brandId, by, at: FieldValue.serverTimestamp() });
  const rows = c.schedule?.sections.reduce((n, x) => n + x.rows.length, 0) ?? 0;
  return `${c.packs.length} planes o packs, ${rows} filas en el cronograma${c.care ? ', mantenimiento' : ''}`;
}

// ---------- admin (panel) ----------
export const adminContract = new Hono<AuthEnv>();
adminContract.use('/brands/:brandId/contract*', async (c, next) => {
  if (!(await brandAccess(c.get('user').uid, c.req.param('brandId')!)).admin) return c.json({ error: 'forbidden' }, 403);
  await next();
});

adminContract.put('/brands/:brandId/contract', async (c) => {
  try { return c.json({ ok: true, summary: await setContract(c.req.param('brandId'), await c.req.json(), c.get('user').uid) }); }
  catch (e) { return e instanceof z.ZodError ? c.json({ error: 'invalid', message: zodMessage(e) }, 400) : Promise.reject(e); }
});

adminContract.delete('/brands/:brandId/contract', async (c) => {
  await ref(c.req.param('brandId')).delete();
  return c.json({ ok: true });
});

/** Marks a schedule row or a pack as delivered (or back). Body: { row: [section, row], done } or { pack: i, status }. */
adminContract.patch('/brands/:brandId/contract/progress', async (c) => {
  const b = await c.req.json<{ row?: [number, number]; done?: boolean; pack?: number; status?: string }>();
  const r = ref(c.req.param('brandId'));
  const ok = await db.runTransaction(async (tx) => {
    const snap = await tx.get(r);
    if (!snap.exists) return false;
    const d = snap.data() as Contract;
    if (Array.isArray(b.row)) {
      const row = d.schedule?.sections[b.row[0]]?.rows[b.row[1]];
      if (!row) return false;
      row.done = !!b.done;
      tx.update(r, { schedule: d.schedule, updatedAt: FieldValue.serverTimestamp() });
    } else if (typeof b.pack === 'number' && ['pending', 'in_progress', 'delivered'].includes(String(b.status))) {
      const p = d.packs[b.pack];
      if (!p) return false;
      p.status = b.status as Contract['packs'][number]['status'];
      tx.update(r, { packs: d.packs, updatedAt: FieldValue.serverTimestamp() });
    } else return false;
    return true;
  });
  return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
});
