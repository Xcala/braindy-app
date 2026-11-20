// Firestore → alerts. Eventarc calls this on every write to a request and every new comment, whatever wrote it
// (the app, WhatsApp, the connector, the Brains), so no write path has to remember to send an alert.
// Verified by Eventarc's OIDC token (EVENTS_AUDIENCE + EVENTS_SA). Each event is handled once (pushEvents/{ce-id}).
import { Hono } from 'hono';
import { OAuth2Client } from 'google-auth-library';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { adminUids, brandPeople, pushTo, type PushMsg } from './send.js';

const oidc = new OAuth2Client();
async function fromEventarc(authorization?: string) {
  const audience = process.env.EVENTS_AUDIENCE; const sa = process.env.EVENTS_SA;
  const token = (authorization ?? '').replace(/^Bearer /, '');
  if (!audience || !sa || !token) return false;
  try {
    const p = (await oidc.verifyIdToken({ idToken: token, audience })).getPayload();
    return p?.email === sa && !!p?.email_verified;
  } catch { return false; }
}

type FsDoc = { name?: string; fields?: Record<string, { stringValue?: string }> };
type FsEvent = { value?: FsDoc; oldValue?: FsDoc };
const str = (d: FsDoc | undefined, f: string) => d?.fields?.[f]?.stringValue;
/** "projects/…/documents/brands/B/requests/R[/comments/C]" → its ids. */
function idsOf(name = '') {
  const m = name.match(/\/documents\/brands\/([^/]+)\/requests\/([^/]+)(?:\/comments\/([^/]+))?$/);
  return m ? { brandId: m[1]!, requestId: m[2]!, commentId: m[3] } : null;
}
const url = (brandId: string, requestId: string) => `/requests/${requestId}?brand=${encodeURIComponent(brandId)}`;
const cut = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** What changed on a request, as alerts. Exported for tests. */
export async function onRequestWrite(e: FsEvent) {
  const ids = idsOf(e.value?.name ?? e.oldValue?.name);
  if (!ids || ids.commentId || !e.value?.name) return 0;
  const { brandId, requestId } = ids;
  const before = str(e.oldValue, 'status'); const after = str(e.value, 'status');
  if (before === after && e.oldValue) return 0;
  const r = await db.doc(`brands/${brandId}/requests/${requestId}`).get();
  if (!r.exists || r.get('archived')) return 0;
  const title = cut(String(r.get('title') ?? r.get('formatType') ?? ''));
  const people = await brandPeople(brandId);
  const brand = people.name;
  const base = { tag: `r-${requestId}`, url: url(brandId, requestId) };
  const admins = await adminUids();
  let sent = 0;
  const go = async (uids: string[], m: Omit<PushMsg, 'tag' | 'url'>) => { sent += (await pushTo(uids, { ...base, ...m })).sent; };

  if (!e.oldValue) {
    if (!admins.includes(String(r.get('createdBy') ?? ''))) await go(admins, { kind: 'requests', title: { es: `Pedido nuevo · ${brand}`, en: `New request · ${brand}` }, body: { es: title, en: title } });
    return sent;
  }
  if (after === 'to_approve') await go(people.uids, { kind: 'deliveries', title: { es: `Para aprobar · ${brand}`, en: `To approve · ${brand}` }, body: { es: `NicoMarca te entregó «${title}». Revísala aquí.`, en: `NickMark delivered "${title}". Review it here.` } });
  else if (before === 'to_approve' && after === 'approved') await go(admins, { kind: 'decisions', title: { es: `${brand} aprobó`, en: `${brand} approved` }, body: { es: `«${title}»`, en: `"${title}"` } });
  else if (before === 'to_approve' && after === 'in_production') await go(admins, { kind: 'decisions', title: { es: `${brand} pidió cambios`, en: `${brand} asked for changes` }, body: { es: `«${title}»`, en: `"${title}"` } });
  if (after === 'published') await go(people.uids, { kind: 'done', title: { es: `Publicado · ${brand}`, en: `Published · ${brand}` }, body: { es: `«${title}» ya está publicado.`, en: `"${title}" is published.` } });
  return sent;
}

// Notes that ride on a decision already get the decision alert.
const QUIET_KINDS = new Set(['approved', 'changes_requested', 'status', 'system']);

/** A new comment, as alerts: NickMark hears from clients; the brand's people hear from anyone else. */
export async function onCommentCreate(e: FsEvent) {
  const ids = idsOf(e.value?.name);
  if (!ids?.commentId || e.oldValue) return 0;
  const { brandId, requestId, commentId } = ids;
  const c = await db.doc(`brands/${brandId}/requests/${requestId}/comments/${commentId}`).get();
  if (!c.exists || QUIET_KINDS.has(String(c.get('kind') ?? ''))) return 0;
  const author = String(c.get('author') ?? '');
  const who = author ? await db.doc(`users/${author}`).get() : null;
  if (!who?.exists) return 0; // Brains and system notes are not people
  const [r, people, admins] = await Promise.all([db.doc(`brands/${brandId}/requests/${requestId}`).get(), brandPeople(brandId), adminUids()]);
  const title = cut(String(r.get('title') ?? r.get('formatType') ?? ''), 50);
  const fromAdmin = admins.includes(author);
  const name = fromAdmin ? 'NicoMarca' : String(who.get('name') || who.get('email') || people.name).split('@')[0]!;
  const nameEn = fromAdmin ? 'NickMark' : name;
  const text = String(c.get('text') ?? '').trim() || '📎';
  const msg: PushMsg = {
    kind: 'comments', tag: `c-${requestId}`, url: url(brandId, requestId),
    title: { es: `${name} · ${title}`, en: `${nameEn} · ${title}` }, body: { es: text, en: text },
  };
  const to = [...people.uids.filter((u) => u !== author), ...(fromAdmin ? [] : admins)];
  return (await pushTo(to, msg)).sent;
}

export const events = new Hono();
events.use('*', async (c, next) => ((await fromEventarc(c.req.header('Authorization'))) ? next() : c.json({ error: 'unauthorized' }, 401)));
events.post('/firestore', async (c) => {
  const id = c.req.header('ce-id') ?? '';
  const body = await c.req.json<FsEvent>().catch(() => ({} as FsEvent));
  // Most request writes are the Brains' progress: same status, nothing to say, nothing written.
  const isComment = /\/comments\/[^/]+$/.test(body.value?.name ?? body.oldValue?.name ?? '');
  if (!isComment && (!body.value || (body.oldValue && str(body.oldValue, 'status') === str(body.value, 'status')))) return c.json({ ok: true });
  if (id) {
    // Eventarc may deliver twice; the first one wins.
    const ok = await db.doc(`pushEvents/${id.replace(/[^\w-]/g, '_').slice(0, 120)}`)
      .create({ at: FieldValue.serverTimestamp(), expireAt: Timestamp.fromMillis(Date.now() + 7 * 864e5) }).then(() => true, () => false);
    if (!ok) return c.json({ ok: true, duplicate: true });
  }
  try {
    const sent = isComment ? await onCommentCreate(body) : await onRequestWrite(body);
    return c.json({ ok: true, sent });
  } catch (e) {
    console.warn('push event failed', String(e));
    return c.json({ ok: true }); // never retried: an alert late by an hour is worse than none
  }
});
