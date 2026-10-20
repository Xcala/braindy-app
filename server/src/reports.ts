// Monthly report (design 19): sales, not likes. Nicolas fills in the numbers that come from outside
// (CRM, ads) and the lines from the Brains; pieces delivered and "first try" are counted from requests.
import { Hono } from 'hono';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import type { AuthEnv } from './auth.js';

const num = (v: unknown) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));
const txt = (v: unknown, max = 2000) => String(v ?? '').trim().slice(0, max);

async function deliveredIn(brandId: string, month: string) {
  const [y, m] = month.split('-').map(Number);
  const from = Timestamp.fromDate(new Date(Date.UTC(y, m - 1, 1)));
  const to = Timestamp.fromDate(new Date(Date.UTC(y, m, 1)));
  const snap = await db.collection(`brands/${brandId}/requests`).where('approvedAt', '>=', from).where('approvedAt', '<', to).get();
  const pieces = snap.size;
  const firstTry = snap.docs.filter((d) => Number(d.get('versionCount') ?? 1) <= 1).length;
  return { pieces, firstTryPct: pieces ? Math.round((firstTry / pieces) * 100) : null };
}

export const adminReports = new Hono<AuthEnv>();

adminReports.put('/brands/:brandId/reports/:month', async (c) => {
  const { brandId, month } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).admin) return c.json({ error: 'forbidden' }, 403);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return c.json({ error: 'invalid_month' }, 400);
  const b = await c.req.json<Record<string, unknown>>();
  const counted = await deliveredIn(brandId, month);
  const leadsByMonth = Array.isArray(b.leadsByMonth)
    ? (b.leadsByMonth as Array<{ month?: string; n?: unknown }>).slice(0, 12).map((x) => ({ month: txt(x.month, 7), n: num(x.n) ?? 0 }))
    : [];
  await db.doc(`brands/${brandId}/reports/${month}`).set({
    month, salesAttributed: num(b.salesAttributed), salesPrev: num(b.salesPrev), leads: num(b.leads), costPerLead: num(b.costPerLead),
    currency: txt(b.currency, 3) || 'COP', leadsByMonth, whatMoved: txt(b.whatMoved), nextMonth: txt(b.nextMonth),
    ...counted, published: b.published === true, reviewedBy: c.get('user').uid,
    updatedAt: FieldValue.serverTimestamp(), ...(b.published === true ? { publishedAt: FieldValue.serverTimestamp() } : {}),
  }, { merge: true });
  return c.json({ ok: true, ...counted });
});
