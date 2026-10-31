// "Mi plan": what the client contracted, next to the contract that makes it binding. This file holds the commercial
// part (the plans or packs bought, total and payment terms, and the website's hosting and maintenance) at
// brands/{brandId}/billing/contracted (owners and billing people read; only the backend writes). The schedule is the
// contract's (Anexo 2, by week): before signing it lives in the draft contract, after signing in context/schedule.
// Nicolas loads it from the panel (JSON) or from any Claude with the connector tool braindy_plan.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { cleanSchedule } from './contracts/schedule.js';
import type { AuthEnv } from './auth.js';

const s = (max = 300) => z.string().trim().max(max);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha YYYY-MM-DD');

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

export const PlanSchema = z.object({
  title: s(120).describe('e.g. "Brand OS · 12 meses" or "Ruta Pack A + Pack C"'),
  summary: s(500).optional(),
  currency: z.enum(['cop', 'usd']).default('cop'),
  start: day.optional(), end: day.optional(),
  status: z.enum(['active', 'done', 'paused']).default('active'),
  packs: z.array(Pack).max(8).default([]),
  total: z.object({ amount: z.number().nonnegative(), label: s(120).optional() }).optional().describe('e.g. {amount: 9500000, label: "Proyecto completo · pago único"}'),
  payment: z.array(s(200)).max(6).default([]).describe('Payment terms, one per line'),
  notIncluded: z.array(s()).max(10).default([]),
  care: Care.optional(),
});
export type BrandPlan = z.infer<typeof PlanSchema>;

const TONE = z.enum(['strategy', 'brand', 'web', 'content', 'agents', 'ads', 'knowledge']);
/** The contract's schedule (Anexo 2), by week. Same shape as contracts/schedule.ts; cleanSchedule has the last word. */
export const WeekSchedule = z.object({
  start: day.describe('Monday of week 1'),
  weeks: z.number().int().min(1).max(52),
  meeting: z.object({ weekday: z.number().int().min(1).max(5).describe('1 = lunes … 5 = viernes'), time: z.string().describe('HH:MM'), minutes: z.number().int() }).optional(),
  groups: z.array(z.object({
    title: s(120).describe('Stage or pack, e.g. "Pack A · Marca"'),
    rows: z.array(z.object({
      title: s(160), note: s(300).optional(),
      from: z.number().int().min(0).describe('First week, 0-based'), to: z.number().int().min(0).describe('Last week, inclusive'),
      milestone: z.boolean().default(false).describe('Contract delivery (one week)'),
      status: z.enum(['pending', 'doing', 'done', 'blocked']).default('pending'),
      tone: TONE.optional().describe('Bar color: strategy, brand, web, content, agents, ads, knowledge'),
      label: s(30).optional().describe('Short text inside the bar, e.g. "IDENTIDAD"'),
    })).max(30),
  })).max(12),
});

const planRef = (brandId: string) => db.doc(`brands/${brandId}/billing/contracted`);
export const zodMessage = (e: z.ZodError) => e.issues.slice(0, 5).map((i) => `${i.path.join('.') || 'plan'}: ${i.message}`).join('; ');

/** Replaces what the brand contracted. Returns a short summary for replies. */
export async function setPlan(brandId: string, input: unknown, by: string) {
  const p = PlanSchema.parse(input);
  await planRef(brandId).set({ ...p, updatedBy: by, updatedAt: FieldValue.serverTimestamp() });
  await db.collection('audit').doc().set({ type: 'plan_set', brandId, by, at: FieldValue.serverTimestamp() });
  return `${p.packs.length} planes o packs${p.care ? ' y mantenimiento' : ''}`;
}

/** Puts a schedule where it belongs: the draft contract if there is one; else the live schedule (the signed annex never changes). */
export async function setSchedule(brandId: string, input: unknown) {
  const schedule = cleanSchedule(WeekSchedule.parse(input));
  const drafts = await db.collection(`brands/${brandId}/contracts`).where('status', '==', 'draft').limit(1).get();
  if (!drafts.empty) {
    await drafts.docs[0].ref.update({ schedule, updatedAt: FieldValue.serverTimestamp() });
    return 'cronograma en el borrador del contrato';
  }
  const live = db.doc(`brands/${brandId}/context/schedule`);
  if (!(await live.get()).exists) throw new Error('La marca no tiene contrato en borrador ni firmado: crea el contrato en Onboarding primero.');
  await live.set({ ...schedule, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return 'cronograma vivo (el anexo firmado no cambia)';
}

// ---------- admin (panel) ----------
export const adminPlan = new Hono<AuthEnv>();
adminPlan.use('/brands/:brandId/plan*', async (c, next) => {
  if (!(await brandAccess(c.get('user').uid, c.req.param('brandId')!)).admin) return c.json({ error: 'forbidden' }, 403);
  await next();
});

adminPlan.put('/brands/:brandId/plan', async (c) => {
  try { return c.json({ ok: true, summary: await setPlan(c.req.param('brandId'), await c.req.json(), c.get('user').uid) }); }
  catch (e) { return e instanceof z.ZodError ? c.json({ error: 'invalid', message: zodMessage(e) }, 400) : Promise.reject(e); }
});

adminPlan.delete('/brands/:brandId/plan', async (c) => {
  await planRef(c.req.param('brandId')).delete();
  return c.json({ ok: true });
});

/** Marks a pack as not started, in progress or delivered. */
adminPlan.patch('/brands/:brandId/plan/packs/:i', async (c) => {
  const i = Number(c.req.param('i'));
  const { status } = await c.req.json<{ status?: string }>();
  if (!['pending', 'in_progress', 'delivered'].includes(String(status))) return c.json({ error: 'invalid' }, 400);
  const ref = planRef(c.req.param('brandId'));
  const ok = await db.runTransaction(async (tx) => {
    const packs = ((await tx.get(ref)).get('packs') ?? []) as BrandPlan['packs'];
    if (!packs[i]) return false;
    packs[i].status = status as BrandPlan['packs'][number]['status'];
    tx.update(ref, { packs, updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
  return ok ? c.json({ ok: true }) : c.json({ error: 'not_found' }, 404);
});
