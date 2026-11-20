// Firestore → alerts. Eventarc calls this on every write to a request and every new comment, whatever wrote it
// (the app, WhatsApp, the connector, the Brains), so no write path has to remember to send an alert.
// Eventarc sends Firestore events only as protobuf; the path rides in the ce-document header, so the payload is
// never parsed. What changed on a request is found by comparing it with the status seen last time (pushSeen).
// Verified by Eventarc's OIDC token (EVENTS_AUDIENCE + EVENTS_SA). Each comment event is handled once (pushEvents/{ce-id}).
import { Hono } from 'hono';
import { OAuth2Client } from 'google-auth-library';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { adminUids, brandPeople, pushTo, type PushMsg } from './send.js';

const oidc = new OAuth2Client();
async function fromEventarc(authorization?: string) {
  // Cloud Run answers on two URLs (the old hash one and the project-number one); either may be the audience.
  const audience = (process.env.EVENTS_AUDIENCE ?? '').split(',').map((s) => s.trim()).filter(Boolean); const sa = process.env.EVENTS_SA;
  const token = (authorization ?? '').replace(/^Bearer /, '');
  if (!audience.length || !sa || !token) { console.warn('events auth: missing', JSON.stringify({ aud: audience.length, sa: !!sa, token: !!token })); return false; }
  try {
    const p = (await oidc.verifyIdToken({ idToken: token, audience })).getPayload();
    return p?.email === sa && !!p?.email_verified;
  } catch (e) {
    // Only who signed it and for whom (never the token), to see a wrong audience or account.
    const [, body] = token.split('.');
    const claims = (() => { try { return JSON.parse(Buffer.from(body ?? '', 'base64url').toString()) as { aud?: string; email?: string }; } catch { return {}; } })();
    console.warn('events auth failed', JSON.stringify({ aud: claims.aud, email: claims.email, err: String(e).slice(0, 120) }));
    return false;
  }
}

type Ids = { brandId: string; requestId: string; commentId?: string };
/** "brands/B/requests/R[/comments/C]" → its ids. */
export function idsOf(path = ''): Ids | null {
  const m = path.match(/^brands\/([^/]+)\/requests\/([^/]+)(?:\/comments\/([^/]+))?$/);
  return m ? { brandId: m[1]!, requestId: m[2]!, commentId: m[3] } : null;
}
const url = (brandId: string, requestId: string) => `/requests/${requestId}?brand=${encodeURIComponent(brandId)}`;
const cut = (s: string, n = 70) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** What changed on a request, as alerts. */
export async function onRequestWrite({ brandId, requestId }: Ids) {
  const r = await db.doc(`brands/${brandId}/requests/${requestId}`).get();
  const after = r.exists ? String(r.get('status') ?? '') : '';
  // Swap the last seen status for this one, once: only the event that sees the change speaks.
  const seen = db.doc(`pushSeen/${brandId}__${requestId}`);
  const prev = await db.runTransaction(async (tx) => {
    const d = await tx.get(seen);
    const before = d.exists ? String(d.get('status') ?? '') : null;
    if (before === after) return { same: true as const, before };
    tx.set(seen, { status: after, at: FieldValue.serverTimestamp() });
    return { same: false as const, before };
  });
  if (prev.same || !r.exists || r.get('archived')) return 0;
  const before = prev.before;
  // Never seen: new only when just created (older requests are simply being seen for the first time).
  const created = before === null && Date.now() - ((r.get('createdAt') as Timestamp | undefined)?.toMillis() ?? 0) < 10 * 60_000;
  if (before === null && !created) return 0;

  const title = cut(String(r.get('title') ?? r.get('formatType') ?? ''));
  const people = await brandPeople(brandId);
  const brand = people.name;
  const base = { tag: `r-${requestId}`, url: url(brandId, requestId) };
  const admins = await adminUids();
  let sent = 0;
  const go = async (uids: string[], m: Omit<PushMsg, 'tag' | 'url'>) => { sent += (await pushTo(uids, { ...base, ...m })).sent; };

  if (created) {
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
export async function onCommentCreate({ brandId, requestId, commentId }: Ids) {
  if (!commentId) return 0;
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
  const ids = idsOf(c.req.header('ce-document') ?? '');
  if (!ids) return c.json({ ok: true });
  try {
    if (!ids.commentId) return c.json({ ok: true, sent: await onRequestWrite(ids) });
    // Eventarc may deliver twice; the first one wins.
    const id = (c.req.header('ce-id') ?? '').replace(/[^\w-]/g, '_').slice(0, 120);
    if (id) {
      const first = await db.doc(`pushEvents/${id}`).create({ at: FieldValue.serverTimestamp(), expireAt: Timestamp.fromMillis(Date.now() + 7 * 864e5) }).then(() => true, () => false);
      if (!first) return c.json({ ok: true, duplicate: true });
    }
    return c.json({ ok: true, sent: await onCommentCreate(ids) });
  } catch (e) {
    console.warn('push event failed', String(e));
    return c.json({ ok: true }); // never retried: an alert late by an hour is worse than none
  }
});
