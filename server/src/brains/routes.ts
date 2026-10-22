// Endpoints that put the Brains to work. Admin: re-propose a plan, draft the monthly report, run the
// competitor watch, see the task log. Owners and admin: analyze a group. Cron: weekly watch for every brand.
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import { logError } from '../guard.js';
import type { AuthEnv } from '../auth.js';
import { proposePlan } from './plan.js';
import { draftReport } from './report.js';
import { watchCompetitors } from './watch.js';
import { analyzeGroup } from './group.js';

export const adminBrains = new Hono<AuthEnv>();
adminBrains.use('/brands/:brandId/brains/*', async (c, next) => {
  if (!(await brandAccess(c.get('user').uid, c.req.param('brandId')!)).admin) return c.json({ error: 'forbidden' }, 403);
  await next();
});
adminBrains.post('/brands/:brandId/brains/plan/:requestId', async (c) => c.json({ plan: await proposePlan(c.req.param('brandId'), c.req.param('requestId')) }));
adminBrains.post('/brands/:brandId/brains/report/:month', async (c) => {
  const month = c.req.param('month');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return c.json({ error: 'invalid_month' }, 400);
  return c.json(await draftReport(c.req.param('brandId'), month));
});
/** Meetings with the client: their notes become team memory (all four Brains read them). Admin only. */
adminBrains.post('/brands/:brandId/brains/meetings', async (c) => {
  const b = await c.req.json<{ title?: string; date?: string; notes?: string; source?: string }>();
  const notes = String(b.notes ?? '').trim().slice(0, 20_000);
  if (!notes) return c.json({ error: 'notes_required' }, 400);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date)) ? String(b.date) : new Date().toISOString().slice(0, 10);
  const ref = await db.collection(`brands/${c.req.param('brandId')}/meetings`).add({
    title: String(b.title ?? '').trim().slice(0, 160) || date, date, notes, source: b.source === 'granola' ? 'granola' : 'manual',
    createdBy: c.get('user').uid, createdAt: FieldValue.serverTimestamp(),
  });
  return c.json({ id: ref.id });
});
adminBrains.delete('/brands/:brandId/brains/meetings/:id', async (c) => {
  await db.doc(`brands/${c.req.param('brandId')}/meetings/${c.req.param('id')}`).delete();
  return c.json({ ok: true });
});
adminBrains.post('/brands/:brandId/brains/watch', async (c) => c.json({ results: await watchCompetitors(c.req.param('brandId')) }));

export const brains = new Hono<AuthEnv>();
/** Group analysis: owners of the group (or admin) can ask for it. */
brains.post('/brands/:brandId/analysis', async (c) => {
  const { brandId } = c.req.param();
  const a = await brandAccess(c.get('user').uid, brandId);
  if (!a.admin && a.role !== 'client_owner') return c.json({ error: 'forbidden' }, 403);
  if ((await db.doc(`brands/${brandId}`).get()).get('kind') !== 'group') return c.json({ error: 'not_a_group' }, 400);
  return c.json(await analyzeGroup(brandId));
});

// ---------- cron (Cloud Scheduler with an OIDC token; nothing runs without CRON_AUDIENCE + CRON_SA) ----------
const oidc = new OAuth2Client();
export const cron = new Hono();
cron.post('/weekly', async (c) => {
  const audience = process.env.CRON_AUDIENCE;
  const sa = process.env.CRON_SA;
  const token = (c.req.header('Authorization') ?? '').replace(/^Bearer /, '');
  if (!audience || !sa || !token) return c.json({ error: 'unauthorized' }, 401);
  try {
    const t = await oidc.verifyIdToken({ idToken: token, audience });
    if (t.getPayload()?.email !== sa || !t.getPayload()?.email_verified) return c.json({ error: 'unauthorized' }, 401);
  } catch { return c.json({ error: 'unauthorized' }, 401); }
  const active = await db.collection('brands').where('status', '==', 'active').select().get();
  let watched = 0;
  for (const b of active.docs) {
    const brain = await db.doc(`brands/${b.id}/context/brain`).get();
    if (!((brain.get('competitors') as Array<{ url?: string }>) ?? []).some((x) => x.url)) continue;
    await watchCompetitors(b.id).then(() => watched++).catch((e) => logError(e, { where: 'cron-watch', brandId: b.id }));
  }
  return c.json({ ok: true, watched });
});
