// The client teaches the Brand Brain what it does not know yet («Enséñaselo»), and retires what it learned wrong
// («Esto ya no aplica»). Owners, members with My brand open, and NickMark. Both leave a brainEvent, so NickMark sees
// every change in the Cerebro feed; a retired learning stays in the doc (marked) and can be brought back.
import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../firebase.js';
import { brandAccess } from '../access.js';
import type { AuthEnv } from '../auth.js';
import { recordBrainEvent, type BrainArea } from './brainEvents.js';

/** What can be taught in words, the field of the Brand Brain it goes to and its area on the map. */
const TOPICS: Record<string, { field: string; area: BrainArea }> = {
  voice: { field: 'voice', area: 'voice' },
  position: { field: 'position', area: 'strategy' },
  audiences: { field: 'audiences', area: 'strategy' },
  goals: { field: 'goals', area: 'strategy' },
  competitors: { field: 'competitors', area: 'strategy' },
  avoid: { field: 'avoid', area: 'rules' },
};

export const brainTeach = new Hono<AuthEnv>();
brainTeach.use('/brands/:brandId/brain/*', async (c, next) => {
  const a = await brandAccess(c.get('user').uid, c.req.param('brandId')!);
  if (!a.admin && !(a.member && a.sections.includes('brand'))) return c.json({ error: 'forbidden' }, 403);
  await next();
});

brainTeach.post('/brands/:brandId/brain/teach', async (c) => {
  const { brandId } = c.req.param();
  const b = await c.req.json<{ topic?: string; text?: string }>().catch(() => ({} as { topic?: string; text?: string }));
  const topic = TOPICS[String(b.topic)];
  const text = String(b.text ?? '').replace(/\s+\n/g, '\n').trim().slice(0, 1200);
  if (!topic) return c.json({ error: 'invalid_topic' }, 400);
  if (text.length < 2) return c.json({ error: 'text_required' }, 400);
  const ref = db.doc(`brands/${brandId}/context/brain`);
  await db.runTransaction(async (tx) => {
    const now = (await tx.get(ref)).data() ?? {};
    if (topic.field === 'competitors') {
      const list = Array.isArray(now.competitors) ? now.competitors : [];
      const [name, ...rest] = text.split(/\n|:|—| - /);
      tx.set(ref, { competitors: [...list, { name: name!.trim().slice(0, 120), ...(rest.join(' ').trim() ? { promise: rest.join(' ').trim().slice(0, 400) } : {}), taughtBy: 'client' }].slice(-20), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    } else {
      const before = typeof now[topic.field] === 'string' ? String(now[topic.field]).trim() : '';
      tx.set(ref, { [topic.field]: before ? `${before}\n${text}` : text, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
  });
  await recordBrainEvent(brandId, { kind: 'taught', area: topic.area, parts: [String(b.topic)], text });
  return c.json({ ok: true });
});

/** Retire one learning (matched by when it was learned and its text), or bring it back with undo. */
brainTeach.post('/brands/:brandId/brain/forget', async (c) => {
  const { brandId } = c.req.param();
  const b = await c.req.json<{ at?: string; text?: string; undo?: boolean }>().catch(() => ({} as { at?: string; text?: string; undo?: boolean }));
  const ref = db.doc(`brands/${brandId}/context/learnings`);
  const found = await db.runTransaction(async (tx) => {
    const items = ((await tx.get(ref)).get('items') as Array<Record<string, unknown>>) ?? [];
    const i = items.findIndex((x) => x.at === b.at && (!b.text || x.text === b.text));
    if (i < 0) return null;
    const item = { ...items[i]! };
    if (b.undo) { delete item.retired; delete item.retiredAt; delete item.retiredBy; } else Object.assign(item, { retired: true, retiredAt: new Date().toISOString(), retiredBy: c.get('user').uid });
    items[i] = item;
    tx.set(ref, { items, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return item;
  });
  if (!found) return c.json({ error: 'not_found' }, 404);
  // One event per retired learning (stable id), removed again on undo so the feed does not keep a false «ya no aplica».
  const eventId = `forgot-${createHash('sha1').update(`${String(b.at)}|${String(found.text ?? '')}`).digest('hex').slice(0, 16)}`;
  if (b.undo) await db.doc(`brands/${brandId}/brainEvents/${eventId}`).delete().catch(() => undefined);
  else await recordBrainEvent(brandId, { id: eventId, kind: 'forgot', area: 'work', text: String(found.text ?? ''), ...(found.requestId ? { requestId: String(found.requestId) } : {}) });
  return c.json({ ok: true });
});
