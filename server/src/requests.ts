// Requests (phase 2): creation with routing to a lead Brain, the plan gate, versions with files,
// approval decisions (single and batch) and publishing. Status and stage are only ever set here.
import { randomUUID } from 'node:crypto';
import { Hono, type MiddlewareHandler } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { db } from './firebase.js';
import { brandAccess } from './access.js';
import { notifyDelivery } from './review.js';
import type { AuthEnv } from './auth.js';

const BUCKET = process.env.FILES_BUCKET ?? 'braindy-app-files';
export const URL_TTL_MS = 15 * 60 * 1000;
export const bucket = () => getStorage().bucket(BUCKET);

type Brain = 'researcher' | 'marketer' | 'creator' | 'builder';
// Keep in sync with web/src/requests/taxonomy.ts (lead, helpers, "with Nicolas").
const ROUTING: Record<string, { lead: Brain; helpers: Brain[]; withNicolas?: boolean; nicolasSubs?: string[] }> = {
  web: { lead: 'builder', helpers: ['creator'] },
  social: { lead: 'creator', helpers: ['marketer'], nicolasSubs: ['strategy'] },
  graphic: { lead: 'creator', helpers: ['marketer'] },
  branding: { lead: 'creator', helpers: ['researcher', 'marketer'], withNicolas: true },
  marketing: { lead: 'marketer', helpers: ['creator', 'researcher'], nicolasSubs: ['performance', 'strategy'] },
  ai: { lead: 'builder', helpers: ['researcher'] },
  multimedia: { lead: 'creator', helpers: ['builder'] },
  other: { lead: 'researcher', helpers: ['marketer'], withNicolas: true },
};

const str = (v: unknown, max = 2000) => String(v ?? '').trim().slice(0, max);
const now = () => FieldValue.serverTimestamp();

async function isAdmin(uid: string) {
  return (await db.doc(`users/${uid}`).get()).get('role') === 'admin';
}
export async function canApprove(uid: string, brandId: string) {
  const a = await brandAccess(uid, brandId);
  if (a.admin) return true;
  if (!a.member) return false;
  if (a.role === 'client_owner') return true;
  const chain = [brandId, ...(((await db.doc(`brands/${brandId}`).get()).get('ancestors') as string[]) ?? [])];
  for (const id of chain) {
    const m = await db.doc(`brands/${id}/members/${uid}`).get();
    if (m.exists) return m.get('canApprove') === true || m.get('role') === 'client_owner';
  }
  return false;
}

// ---------- client + admin ----------
export const requests = new Hono<AuthEnv>();

/** "Ask for something": creates the request and routes it to a lead Brain. */
requests.post('/brands/:brandId/requests', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await brandAccess(uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<Record<string, unknown>>();
  const route = ROUTING[str(b.category, 40)];
  if (!route) return c.json({ error: 'invalid_category' }, 400);
  const subcategory = str(b.subcategory, 40);
  const withNicolas = !!route.withNicolas || (route.nicolasSubs ?? []).includes(subcategory);
  const cards = (b.cards ?? {}) as Record<string, { text?: string; links?: string[] }>;
  const card = (k: string) => ({ text: str(cards[k]?.text, 4000), links: (cards[k]?.links ?? []).map((l) => str(l, 500)).filter(Boolean).slice(0, 10) });

  const ref = db.collection(`brands/${brandId}/requests`).doc();
  await ref.set({
    title: str(b.title, 160) || str(b.formatType, 160),
    category: str(b.category, 40), subcategory, formatType: str(b.formatType, 160),
    cards: { product: card('product'), application: card('application'), scene: card('scene') },
    dueDate: str(b.dueDate, 20) || null, format: str(b.format, 160), language: str(b.language, 60),
    status: 'in_production', stage: 'plan',
    leadBrain: route.lead, helperBrains: route.helpers, approvalLevel: withNicolas ? 'nicolas' : 'self',
    plan: null, versionCount: 0, createdBy: uid, createdAt: now(), updatedAt: now(),
  });
  return c.json({ requestId: ref.id });
});

/** Approve or ask for changes on a version. Approving moves the request to Approved. */
export async function decide(brandId: string, requestId: string, versionId: string, uid: string, state: string, note: string) {
  const reqRef = db.doc(`brands/${brandId}/requests/${requestId}`);
  const verRef = reqRef.collection('versions').doc(versionId);
  const [req, ver] = await Promise.all([reqRef.get(), verRef.get()]);
  if (!req.exists || !ver.exists || ver.get('published') !== true) return 'not_found';
  if (state === 'changes_requested' && !note) return 'note_required';
  const batch = db.batch()
    .update(verRef, { approval: { state, by: uid, at: now(), note: note || null } })
    .update(reqRef, state === 'approved'
      ? { status: 'approved', stage: 'approved', approvedAt: now(), updatedAt: now() }
      : { status: 'in_production', stage: 'work', updatedAt: now() });
  if (note) batch.set(reqRef.collection('comments').doc(), { author: uid, text: note, versionId, kind: state, createdAt: now() });
  batch.set(db.collection('audit').doc(), { type: 'approval', brandId, requestId, versionId, state, by: uid, at: now() });
  await batch.commit();
  return 'ok';
}

requests.post('/brands/:brandId/requests/:requestId/versions/:versionId/decision', async (c) => {
  const { brandId, requestId, versionId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await canApprove(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const b = await c.req.json<{ state?: string; note?: string }>();
  const state = b.state === 'approved' ? 'approved' : b.state === 'changes_requested' ? 'changes_requested' : '';
  if (!state) return c.json({ error: 'invalid' }, 400);
  const r = await decide(brandId, requestId, versionId, uid, state, str(b.note, 4000));
  return r === 'ok' ? c.json({ ok: true }) : c.json({ error: r }, r === 'not_found' ? 404 : 400);
});

/** Approve a month of posts at once. */
requests.post('/brands/:brandId/approvals/batch', async (c) => {
  const { brandId } = c.req.param();
  const uid = c.get('user').uid;
  if (!(await canApprove(uid, brandId))) return c.json({ error: 'forbidden' }, 403);
  const { items } = await c.req.json<{ items?: Array<{ requestId: string; versionId: string }> }>();
  const list = (items ?? []).slice(0, 60);
  const results = await Promise.all(list.map((i) => decide(brandId, str(i.requestId, 60), str(i.versionId, 60), uid, 'approved', '')));
  return c.json({ approved: results.filter((r) => r === 'ok').length, total: list.length });
});

/** Signed URL for a file of a version (members of the brand only). */
requests.get('/brands/:brandId/requests/:requestId/versions/:versionId/files/:index', async (c) => {
  const { brandId, requestId, versionId, index } = c.req.param();
  if (!(await brandAccess(c.get('user').uid, brandId)).member) return c.json({ error: 'forbidden' }, 403);
  const ver = await db.doc(`brands/${brandId}/requests/${requestId}/versions/${versionId}`).get();
  const file = ((ver.get('files') as Array<{ storagePath?: string; url?: string }>) ?? [])[Number(index)];
  if (!file) return c.json({ error: 'not_found' }, 404);
  if (file.url) return c.json({ url: file.url });
  if (!file.storagePath?.startsWith(`brands/${brandId}/`)) return c.json({ error: 'not_found' }, 404);
  const disposition = c.req.query('download') === '1' ? 'attachment' : 'inline';
  const [url] = await bucket().file(file.storagePath).getSignedUrl({ version: 'v4', action: 'read', expires: Date.now() + URL_TTL_MS, responseDisposition: disposition });
  return c.json({ url });
});

// ---------- admin (Nicolas) ----------
export const adminRequests = new Hono<AuthEnv>();
const requireAdmin: MiddlewareHandler<AuthEnv> = async (c, next) => {
  if (!(await isAdmin(c.get('user').uid))) return c.json({ error: 'forbidden' }, 403);
  await next();
};
adminRequests.use('*', requireAdmin);

/** Plan: scope, first delivery date, note. Approving it lets the Brains start and the client see it. */
adminRequests.post('/brands/:brandId/requests/:requestId/plan', async (c) => {
  const { brandId, requestId } = c.req.param();
  const b = await c.req.json<{ scope?: string[]; firstDelivery?: string; note?: string; approve?: boolean }>();
  const plan = {
    scope: (b.scope ?? []).map((s) => str(s, 300)).filter(Boolean).slice(0, 12),
    firstDelivery: str(b.firstDelivery, 20) || null, note: str(b.note, 2000), approved: b.approve === true,
    approvedAt: b.approve === true ? now() : null,
  };
  await db.doc(`brands/${brandId}/requests/${requestId}`).update({
    plan, stage: b.approve === true ? 'work' : 'plan', updatedAt: now(),
  });
  return c.json({ ok: true });
});

/** New version: registers it with signed upload URLs for its files. Published after the upload. */
adminRequests.post('/brands/:brandId/requests/:requestId/versions', async (c) => {
  const { brandId, requestId } = c.req.param();
  const reqRef = db.doc(`brands/${brandId}/requests/${requestId}`);
  const b = await c.req.json<{ notes?: string; reason?: string; brain?: string; files?: Array<{ name: string; contentType: string; size: number }> }>();
  const files = (b.files ?? []).slice(0, 20).filter((f) => f.name && f.size > 0 && f.size <= 500 * 1024 ** 2);
  if (!files.length) return c.json({ error: 'no_files' }, 400);
  const n = await db.runTransaction(async (tx) => {
    const r = await tx.get(reqRef);
    if (!r.exists) throw new Error('not_found');
    const next = Number(r.get('versionCount') ?? 0) + 1;
    tx.update(reqRef, { versionCount: next });
    return next;
  });
  const verRef = reqRef.collection('versions').doc(`v${n}`);
  const stored = files.map((f) => ({
    name: str(f.name, 200).replace(/[\\/\r\n]/g, '_'), contentType: str(f.contentType, 120) || 'application/octet-stream', size: Number(f.size),
    storagePath: `brands/${brandId}/requests/${requestId}/v${n}/${randomUUID()}-${str(f.name, 200).replace(/[\\/\r\n]/g, '_')}`,
  }));
  await verRef.set({
    n, files: stored, notes: str(b.notes, 4000), reason: str(b.reason, 1000), brain: str(b.brain, 20) || null,
    published: false, approval: { state: 'pending' }, createdAt: now(), createdBy: c.get('user').uid,
  });
  const uploads = await Promise.all(stored.map(async (f) => {
    const [url] = await bucket().file(f.storagePath).getSignedUrl({ version: 'v4', action: 'write', expires: Date.now() + URL_TTL_MS, contentType: f.contentType });
    return { url, contentType: f.contentType };
  }));
  return c.json({ versionId: verRef.id, n, uploads });
});

/** Publishes a version to the client (Nicolas reviewed it): the request moves to "To approve". */
adminRequests.post('/brands/:brandId/requests/:requestId/versions/:versionId/publish', async (c) => {
  const { brandId, requestId, versionId } = c.req.param();
  const reqRef = db.doc(`brands/${brandId}/requests/${requestId}`);
  const verRef = reqRef.collection('versions').doc(versionId);
  const ver = await verRef.get();
  if (!ver.exists) return c.json({ error: 'not_found' }, 404);
  for (const f of (ver.get('files') as Array<{ storagePath: string }>) ?? []) {
    const [exists] = await bucket().file(f.storagePath).exists();
    if (!exists) return c.json({ error: 'upload_missing', file: f.storagePath }, 409);
  }
  await db.batch()
    .update(verRef, { published: true, publishedAt: now(), reviewedBy: c.get('user').uid })
    .update(reqRef, { status: 'to_approve', stage: 'clientApproval', latestVersion: versionId, updatedAt: now() })
    .commit();
  // Review link to the brand's WhatsApp approver (sent by the API, or a wa.me link for Nicolas).
  const notice = await notifyDelivery(brandId, requestId, versionId, c.get('user').uid).catch(() => ({ status: 'error' as const }));
  return c.json({ ok: true, notice });
});

/** Marks an approved request as published (live). */
adminRequests.post('/brands/:brandId/requests/:requestId/published', async (c) => {
  const { brandId, requestId } = c.req.param();
  await db.doc(`brands/${brandId}/requests/${requestId}`).update({ status: 'published', stage: 'published', publishedAt: now(), updatedAt: now() });
  return c.json({ ok: true });
});
